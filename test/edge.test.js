/* @flow */

import { Edge, Node } from '../src';
import redis from 'redis';

let id = 0;
let client;

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
}

class NodeDelegate {
  async createNode() {
    id += 1;
    return id;
  }

  async readNode(id) {
    return { test: 'asdf' };
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

  const idLeft = await node.createNode({ asdf: 'left' });
  const idRight = await node.createNode({ asdf: 'right' });
  const idRight2 = await node.createNode({ asdf: 'right2' });

  const edgeId = await edge.createEdge(idLeft, idRight);
  await edge.createEdge(idLeft, idRight2);

  const edges = await edge.readEdges(idLeft, { first: 2 });
  const edges2 = await edge.readEdges(idLeft, { last: 2 });

  console.log(edges);
  console.log(edges2);
});
