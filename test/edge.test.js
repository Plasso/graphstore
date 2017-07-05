/* @flow */

import { Edge, Node } from '../src';
import redis from 'redis';

let id = 0;
let client;
let nodes = [
  { id: 1, asdf: 1 },
  { id: 2, asdf: 2 },
];
let edges = [
  { id: 1, rightNodeId: 1 },
  { id: 2, rightNodeId: 2 },
  { id: 3, rightNodeId: 3 },
  { id: 4, rightNodeId: 4 },
  { id: 5, rightNodeId: 5 },
  { id: 6, rightNodeId: 6 },
  { id: 7, rightNodeId: 7 },
  { id: 8, rightNodeId: 8 },
  { id: 9, rightNodeId: 9 },
  { id: 10, rightNodeId: 10 },
];

class EdgeDelegate {
  async edgeName() {
    return 'test_edge';
  }
  async edgeCount() {
    return 10;
  }
  async createEdge() {
    id += 1;
    return id;
  }
  async getEdgesForward(leftId, { offset, limit }) {
    console.log('getEdgesForward', offset, limit);
    return edges.slice(offset, offset + limit);
  }
  async getEdgesAfterId(leftId, { after, first }) {
    console.log('getEdgesAfterId');
    const start = after || 0;
    return edges.slice(start, start + first);
  }
}

class NodeDelegate {
  async createNode() {
    id += 1;
    return id;
  }

  async readNode(id) {
    return nodes[id];
  }

  async deleteNode() {
  }

  async updateNode(/* id, newNode, updateId */) {
    // console.log(id, newNode, updateId);
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
  const edge = new Edge(client, new EdgeDelegate());
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
