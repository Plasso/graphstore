import { Node } from '../src';
import redis from 'redis';

import MemoryNodeDelegate from '../src/memory-node-delegate';

let client;

beforeEach((done) => {
  client = redis.createClient('redis://redis-test.wi32hd.0001.usw2.cache.amazonaws.com:6379');
  client.once('ready', function () {
    client.flushdb(done);
  });
});

afterEach(() => {
  client.end(true);
});

test('can create a node', async () => {
  const gs = new Node(client, new MemoryNodeDelegate('test_node'));

  const nodeId = await gs.createNode({ test: 'asdf' });

  const node = await gs.readNode(nodeId);

  expect(node).toMatchObject({ test: 'asdf' });
});

test('cannot create duplicate node', async () => {
  const gs = new Node(client, new MemoryNodeDelegate('test_node'));
  const nodeId = await gs.createNode({ test: 'asdf' });

  await expect(gs._createNode(nodeId, {})).rejects.toBeDefined();
});

test('can read a node not in cache', async () => {
  const memoryNodeDelegate = new MemoryNodeDelegate('test_node');
  const gs = new Node(client, memoryNodeDelegate);
  const nodeId = await memoryNodeDelegate.createNode({ test: 'asdf' });
  const node = await gs.readNode(nodeId);
  expect(node).toMatchObject({ test: 'asdf' });
});

test('can delete node', async () => {
  const gs = new Node(client, new MemoryNodeDelegate('test_node'));
  const nodeId = await gs.createNode({ test: 'asdf' });

  await gs.deleteNode(nodeId);

  const node = await gs.readNode(nodeId);

  expect(node).toBe('MISSING');
});

test('can update a node', async () => {
  const gs = new Node(client, new MemoryNodeDelegate('test_node'));
  const nodeId = await gs.createNode({ test: 'asdf' });

  await gs.updateNode(nodeId, { test: 'test2' });

  const node = await gs.readNode(nodeId);

  expect(node).toMatchObject({ test: 'test2' });
});

