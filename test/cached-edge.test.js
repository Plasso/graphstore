/* @flow */

import { CachedEdge, MemoryEdge } from '../src';
import redis from 'redis';

let client;
let nodes = {};

beforeAll((done) => {
  client = redis.createClient('redis://redis-test.wi32hd.0001.usw2.cache.amazonaws.com:6379');
  client.once('ready', done);
});

beforeEach((done) => {
  client.flushall(done);
});

afterEach((done) => {
  client.flushall(done);
});

afterAll(() => {
  client.end(true);
});

test('creating an edge returns an id', async () => {
  const edgeName = 'test_edge';
  const edge = new CachedEdge(client, new MemoryEdge(edgeName));

  const id = await edge.create('leftId', 'rightId');

  expect(id).toBe('0');
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

