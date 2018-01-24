/* @flow */

import { CachedNode, MemoryNode } from '../src';
import redis from 'redis';

let client;

beforeEach((done) => {
  client = redis.createClient('redis://redis-test.wi32hd.0001.usw2.cache.amazonaws.com:6379/1');
  client.once('ready', () => {
    client.flushdb(done);
  });
});

afterEach(() => {
  client.end(true);
});

test('it caches created nodes', async (done) => {
  const testNode = { test: 'asdf' };
  const node = new CachedNode(client, new MemoryNode('test_node'));

  const [{ id }] = await node.create([testNode]);

  const newNode = { id, ...testNode };

  client.get(node._id(id), (err, node) => {
    expect(JSON.parse(node)).toMatchObject(newNode);
    done();
  });
});

test('it asks delegate for uncached node', async () => {
  const testNode = { test: 'asdf' };
  const memoryNode = new MemoryNode('test_node');
  const node = new CachedNode(client, memoryNode);

  const [{ id }] = await memoryNode.create([testNode]);

  const [fetchedNode] = await node.read([id]);

  expect(fetchedNode).toMatchObject({ id, ...testNode });
});

test('it skips asking delegate when passed empty array', async () => {
  const memoryNode = new MemoryNode('test_node');
  const node = new CachedNode(client, memoryNode);

  const ret = await node.read([]);

  expect(ret.length).toBe(0);
});

test('it asks delegate for name', () => {
  const node = new CachedNode({}, new MemoryNode('test_node'));

  expect(node.getName()).toBe('test_node');
});

test('it deletes nodes from cache', async (done) => {
  const testNode = { test: 'asdf' };
  const node = new CachedNode(client, new MemoryNode('test_node'));

  const [{ id }] = await node.create([testNode]);

  await node.delete(id);

  client.get(node._id(id), (err, newNode) => {
    expect(newNode).toBe('MISSING');
    done();
  });
});

test('it deletes nodes from delegate', async () => {
  const testNode = { test: 'asdf' };
  const node = new CachedNode(client, new MemoryNode('test_node'));

  const [{ id }] = await node.create([testNode]);

  await node.delete(id);

  const [fetchedNode] = await node.read([id]);

  expect(fetchedNode).toBe(undefined);
});

test('it updates nodes in cache', async (done) => {
  const testNode = { test: 'asdf' };
  const node = new CachedNode(client, new MemoryNode('test_node'));

  const [{ id, updateId }] = await node.create([{ test: 'hjkl' }]);

  await node.update({ id, updateId, ...testNode });

  client.get(node._id(id), (err, newNode) => {
    const parsedObject = JSON.parse(newNode);
    expect(parsedObject).toMatchObject({ id, ...testNode });
    done();
  });
});

test('it can evict items from cache', async (done) => {
  const testNode = { test: 'asdf' };
  const node = new CachedNode(client, new MemoryNode('test_node'));

  const [{ id, updateId }] = await node.create([{ test: 'hjkl' }]);

  await node.evict([id]);

  client.get(node._id(id), (err, newNode) => {
    expect(newNode).toBe(null);
    done();
  });
});


test('it updates nodes in delegate', async () => {
  const testNode = { test: 'asdf' };
  const node = new CachedNode(client, new MemoryNode('test_node'));

  const [{ id, updateId }] = await node.create([{ test: 'hjkl' }]);

  await node.update({ id, updateId, ...testNode });

  const [fetchedNode] = await node.read([id]);

  expect(fetchedNode).toMatchObject({ id, ...testNode });
});

test('it stops updates to changed nodes', async () => {
  const node = new CachedNode(client, new MemoryNode('node_name'));
  const [{ id, updateId }] = await node.create([{ test: 'data' }]);

  const first = await node.update({ id, updateId, test: 'asdf' });
  const second = await node.update({ id, updateId, test: 'asdf' });

  expect(first).toBe(true);
  expect(second).toBe(false);
});

