/* @flow */

import { Edge, Node } from '../src';
import redis from 'redis';
import MemoryEdgeDelegate from '../src/memory-edge-delegate';

let id = 0;
let client;
let nodes = {};

class NodeDelegate {
  async createNode(data) {
    id += 1;

    nodes[id] = data;

    return id;
  }

  async readNode(id) {
    return nodes[id];
  }

  async deleteNode(id) {
    delete nodes[id];
  }

  async updateNode(id, newNode /* , updateId */) {
    nodes[id] = newNode;
  }
}

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
  const edge = new Edge(client, new MemoryEdgeDelegate(''));
  const node = new Node(client, new NodeDelegate());
  Edge.MAX_BATCH = 5;

  const edges = await edge.readEdges(1, { after: 0, first: 2 });
  const edges2 = await edge.readEdges(1, { first: 5 });
  const edges3 = await edge.readEdges(1, { after: 5, first: 5 });

  console.log(edges);
  console.log(edges2);
  console.log(edges3);

  const count = await edge.edgeCount();

  console.log(count);
});
