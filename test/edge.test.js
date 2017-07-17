/* @flow */

import { Edge, Node } from '../src';
import redis from 'redis';
import MemoryNodeDelegate from '../src/memory-node-delegate';

let id = 0;
let client;
let nodes = {};

beforeAll((done) => {
  client = redis.createClient('redis://redis-test.wi32hd.0001.usw2.cache.amazonaws.com:6379');
  client.once('ready', function () {
    client.flushdb(done);
  });
});

afterAll(() => {
  client.end(true);
});

test('can create an edge', async () => {
  const node = new Node(client, new MemoryNodeDelegate('test_node'));

  const id = await node.createNode({ name: 'value' });

  const fetchedNode = await node.readNode(id);

  expect(fetchedNode).toMatchObject({ name: 'value' });
});
