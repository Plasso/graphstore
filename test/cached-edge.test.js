/* @flow */

import { CachedEdge, MemoryEdge } from '../src';
import redis from 'redis';

let client;
let nodes = {};

beforeEach((done) => {
  client = redis.createClient('redis://redis-test.wi32hd.0001.usw2.cache.amazonaws.com:6379/0');
  client.once('ready', () => {
    client.flushdb(done);
  });
});

afterEach(() => {
  client.end(true);
});

test('getFirstAfter returns cached edges added in order', async () => {
  const edgeName = 'test_edge';
  const ed = new MemoryEdge(edgeName);
  const edge = new CachedEdge(client, ed);

  const after = await ed.create('leftId', 'rightId1');
  await ed.create('leftId', 'rightId2');
  await ed.create('leftId', 'rightId3');
  await ed.create('leftId', 'rightId4');
  await edge.getFirstAfter('leftId', { first: 4 });

  const page = await edge.getFirstAfter('leftId', { after, first: 2 });

  expect(page.edges[0]).toMatchObject({
    id: 1,
    nodeId: 'rightId2',
  });

  expect(page.edges[1]).toMatchObject({
    id: 2,
    nodeId: 'rightId3',
  });
});

test('getFirstAfter can exend cache', async (done) => {
  const edgeName = 'test_edge';
  const ed = new MemoryEdge(edgeName);
  const edge = new CachedEdge(client, ed);

  const after = await ed.create('leftId', 'rightId1');
  await ed.create('leftId', 'rightId2');
  await ed.create('leftId', 'rightId3');
  await ed.create('leftId', 'rightId4');
  await edge.getFirstAfter('leftId', { first: 4 });
  client.set(edge._watermark('leftId'), 2);
  client.zremrangebyscore(edge._name('leftId'), 3, +Infinity);

  client.zrangebyscore(edge._name('leftId'), -Infinity, +Infinity, async (err, data) => {
    expect(data.length).toBe(3);
    await edge.getFirstAfter('leftId', { after, first: 3 });

    client.zrangebyscore(edge._name('leftId'), -Infinity, +Infinity, (err, data2) => {
      expect(data2.length).toBe(4);
      done();
    });
  });
});

test('getFirstAfter returns edges added in order', async () => {
  const edgeName = 'test_edge';
  const ed = new MemoryEdge(edgeName);
  const edge = new CachedEdge(client, ed);

  const after = await ed.create('leftId', 'rightId1');
  await ed.create('leftId', 'rightId2');
  await ed.create('leftId', 'rightId3');
  await ed.create('leftId', 'rightId4');
  const page = await edge.getFirstAfter('leftId', { after, first: 2 });

  expect(page.edges[0]).toMatchObject({
    id: 1,
    nodeId: 'rightId2',
  });

  expect(page.edges[1]).toMatchObject({
    id: 2,
    nodeId: 'rightId3',
  });
});

test('getFirstAfter returns hasNextPage if more edges', async () => {
  const edgeName = 'test_edge';
  const ed = new MemoryEdge(edgeName);
  const edge = new CachedEdge(client, ed);

  await ed.create('leftId', 'rightId1');
  await ed.create('leftId', 'rightId2');
  const page = await edge.getFirstAfter('leftId', { first: 1 });

  expect(page.hasNextPage).toBe(true);
});

test('creating an edge increases count', async () => {
  const edgeName = 'test_edge';
  const ed = new MemoryEdge(edgeName);
  const edge = new CachedEdge(client, ed);
  await edge.create('leftId', 'rightId1');
  const count1 = await edge.getCount('leftId');
  await edge.create('leftId', 'rightId2');
  const count2 = await edge.getCount('leftId');

  expect(count1).toBe(1);
  expect(count2).toBe(2);
});

test('deleting an edge decreases count', async () => {
  const edgeName = 'test_edge';
  const ed = new MemoryEdge(edgeName);
  const edge = new CachedEdge(client, ed);
  const id = await edge.create('leftId', 'rightId1');
  const count1 = await edge.getCount('leftId');
  await edge.delete('leftId', id);
  const count2 = await edge.getCount('leftId');

  expect(count1).toBe(1);
  expect(count2).toBe(0);
});

test('it can delete edges', async () => {
  const edgeName = 'test_edge';
  const ed = new MemoryEdge(edgeName);
  const edge = new CachedEdge(client, ed);

  await ed.create('leftId', 'rightId1');
  const id = await ed.create('leftId', 'rightId2');
  await ed.create('leftId', 'rightId2');
  await edge.delete('leftId', id);

  const page = await edge.getFirstAfter('leftId', { first: 3});

  expect(page.edges.length).toBe(2);
});

test('creating an edge returns an id', async () => {
  const edgeName = 'test_edge';
  const edge = new CachedEdge(client, new MemoryEdge(edgeName));

  const id = await edge.create('leftId', 'rightId');

  expect(id).toBe(0);
});

test('creating an edge increases count', async () => {
  const edgeName = 'test_edge';
  const edge = new CachedEdge(client, new MemoryEdge(edgeName));

  await edge.create('leftId', 'rightId');

  const count = await edge.getCount('leftId');

  expect(count).toBe(1);
});

test('creating an edge with different leftId does not increase count', async () => {
  const edgeName = 'test_edge';
  const edge = new CachedEdge(client, new MemoryEdge(edgeName));

  await edge.create('leftId', 'rightId');

  const count = await edge.getCount('otherId');

  expect(count).toBe(0);
});

test('edge gets added to cache', async (done) => {
  const edgeName = 'test_edge';
  const leftId = 'leftId';
  const memoryEdge = new MemoryEdge(edgeName);
  const edge = new CachedEdge(client, memoryEdge);

  await memoryEdge.create(leftId, { test: '1' });
  const id = await memoryEdge.create(leftId, { test: '2' });
  await memoryEdge.create(leftId, { test: '3' });

  await memoryEdge.delete(leftId, id);

  memoryEdge.id = parseInt(id, 32);

  const edges = await edge.getFirstAfter(leftId, { first: 2 });

  await edge.create(leftId, { test: '2' });
  memoryEdge.edges[leftId].sort((a, b) => a.id > b.id);

  client.zrange(edge._name(leftId), 0, -1, (err, data) => {
    expect(data.length).toBe(3);
    done();
  });
});

test('edge gets added to cache (reverse)', async (done) => {
  const edgeName = 'test_edge';
  const leftId = 'leftId';
  const memoryEdge = new MemoryEdge(edgeName, false);
  const edge = new CachedEdge(client, memoryEdge, { reverse: true });

  await memoryEdge.create(leftId, { test: '1' });
  const id = await memoryEdge.create(leftId, { test: '2' });
  await memoryEdge.create(leftId, { test: '3' });

  await memoryEdge.delete(leftId, id);

  memoryEdge.id = parseInt(id, 32);

  const edges = await edge.getFirstAfter(leftId, { first: 2 });

  await edge.create(leftId, { test: '2' });
  memoryEdge.edges[leftId].sort((a, b) => a.id < b.id);

  client.zrevrange(edge._name(leftId), 0, -1, (err, data) => {
    expect(data.length).toBe(3);
    done();
  });
});
