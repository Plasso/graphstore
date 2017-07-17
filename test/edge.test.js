/* @flow */

import { Edge, Node } from '../src';
import redis from 'redis';
import MemoryNodeDelegate from '../src/memory-node-delegate';
import MemoryEdgeDelegate from '../src/memory-edge-delegate';

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
  const node = new Node(client, new MemoryNodeDelegate('test_node'));
  const edgeName = 'test_edge';
  const edge = new Edge(client, new MemoryEdgeDelegate(edgeName), node, node);
  const leftId = await node.createNode({ test: 'left' });
  const rightId = await node.createNode({ test: 'right' });

  const id = await edge.createEdge(leftId, rightId);

  expect(id).toBe('0');
});

test('creating an edge increases count', async () => {
  const node = new Node(client, new MemoryNodeDelegate('test_node'));
  const edgeName = 'test_edge';
  const edge = new Edge(client, new MemoryEdgeDelegate(edgeName), node, node);
  const leftId = await node.createNode({ test: 'left' });
  const rightId = await node.createNode({ test: 'right' });

  await edge.createEdge(leftId, rightId);

  const count = await edge.edgeCount(leftId);

  expect(count).toBe(1);
});

test('creating an edge with different leftId does not increase count', async () => {
  const node = new Node(client, new MemoryNodeDelegate('test_node'));
  const edgeName = 'test_edge';
  const edge = new Edge(client, new MemoryEdgeDelegate(edgeName), node, node);
  const leftId = await node.createNode({ test: 'left' });
  const rightId = await node.createNode({ test: 'right' });

  await edge.createEdge(leftId, rightId);

  const count = await edge.edgeCount('otherId');

  expect(count).toBe(0);
});

