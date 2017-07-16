import { Node } from '../src';
import redis from 'redis';

let id = 0;
let client;


beforeAll((done) => {
  client = redis.createClient('redis://redis-test.wi32hd.0001.usw2.cache.amazonaws.com:6379');
  client.once('ready', function () {
    client.flushdb(done);
  });
});

afterAll(() => {
  client.end(true);
});

test('can create a node', async () => {
  const gs = new Node(client, new NodeDelegate());

  const nodeId = await gs.createNode({ test: 'asdf' });

  const node = await gs.readNode(nodeId);

  expect(node).toMatchObject({ test: 'asdf' });
});

test('cannot create duplicate node', async () => {
  const gs = new Node(client, new NodeDelegate());
  const nodeId = await gs.createNode({ test: 'asdf' });

  await expect(gs._createNode(nodeId, {})).rejects.toBeDefined();
});

test('can read a node not in cache', async () => {
  const gs = new Node(client, new NodeDelegate());
  const node = await gs.readNode('test');
  expect(node).toMatchObject({ test: 'asdf' });
});

test('can delete node', async () => {
  const gs = new Node(client, new NodeDelegate());
  const nodeId = await gs.createNode({ test: 'asdf' });

  await gs.deleteNode(nodeId);

  const node = await gs.readNode(nodeId);

  expect(node).toBe('MISSING');
});

test('can update a node', async () => {
  const gs = new Node(client, new NodeDelegate());
  const nodeId = await gs.createNode({ test: 'asdf' });

  await gs.updateNode(nodeId, { test: 'test2' });

  const node = await gs.readNode(nodeId);

  expect(node).toMatchObject({ test: 'test2' });
});

