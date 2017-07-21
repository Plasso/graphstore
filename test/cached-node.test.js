/* @flow */

import { CachedNode, MemoryNode } from '../src';
import redis from 'redis';

let client;

beforeAll((done) => {
  client = redis.createClient('redis://redis-test.wi32hd.0001.usw2.cache.amazonaws.com:6379');
  client.once('ready', done);
});

beforeEach((done) => {
  client.flushdb(done);
});

afterEach((done) => {
  client.flushdb(done);
});

afterAll(() => {
  client.end(true);
});

test('it caches created nodes', async (done) => {
  const testNode = { id: null, test: 'asdf' };
  const node = new CachedNode(client, new MemoryNode('test_node'));

  const id = await node.create(testNode);

  testNode.id = id;

  client.get(node._id(id), (err, node) => {
    expect(JSON.parse(node)).toMatchObject(testNode);
    done();
  });
});

test('it asks delegate for uncached node', async () => {
  const testNode = { id: null, test: 'asdf' };
  const memoryNode = new MemoryNode('test_node');
  const node = new CachedNode(client, memoryNode);

  const id = await memoryNode.create(testNode);

  testNode.id = id;

  const [fetchedNode] = await node.read([id]);

  expect(fetchedNode).toMatchObject(testNode);
});

test('it asks delegate for name', () => {
  const node = new CachedNode(null, new MemoryNode('test_node'));

  expect(node.getName()).toBe('test_node');
});

test('it deletes nodes from cache', async (done) => {
  const testNode = { id: null, test: 'asdf' };
  const node = new CachedNode(client, new MemoryNode('test_node'));

  const id = await node.create(testNode);

  testNode.id = id;

  await node.delete(id);

  client.get(node._id(id), (err, newNode) => {
    expect(newNode).toBe('MISSING');
    done();
  });
});

test('it deletes nodes from delegate', async () => {
  const testNode = { id: null, test: 'asdf' };
  const node = new CachedNode(client, new MemoryNode('test_node'));

  const id = await node.create(testNode);

  testNode.id = id;

  await node.delete(id);

  const [fetchedNode] = await node.read([id]);

  expect(fetchedNode).toBe(undefined);
});

test('it updates nodes in cache', async (done) => {
  const testNode = { id: null, test: 'asdf' };
  const node = new CachedNode(client, new MemoryNode('test_node'));

  const id = await node.create({ test: 'hjkl' });

  testNode.id = id;

  await node.update(id, testNode);

  client.get(node._id(id), (err, newNode) => {
    const parsedObject = JSON.parse(newNode);
    expect(parsedObject).toMatchObject(testNode);
    done();
  });
});

test('it updates nodes in delegate', async () => {
  const testNode = { id: null, test: 'asdf' };
  const node = new CachedNode(client, new MemoryNode('test_node'));

  const id = await node.create({ test: 'hjkl' });

  testNode.id = id;

  await node.update(id, testNode);

  const [fetchedNode] = await node.read([id]);

  expect(fetchedNode).toMatchObject(testNode);
});

