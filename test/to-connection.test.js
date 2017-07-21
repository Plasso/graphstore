/* @flow */

import { toConnection, MemoryNode, MemoryEdge } from '../src';

test('it ruturns empty array when no edges', async () => {
  const node = new MemoryNode('test_node');
  const edge = new MemoryEdge('test_edge');
  const emptyPage = await edge.getFirstAfter('left_id', { first: 10 });
  const connection = await toConnection(node, emptyPage);
  expect(connection).toMatchObject({
    hasNextPage: false,
    hasPreviousPage: false,
    edges: [],
  });
});

test('it can convert edges to a connection', async () => {
  const node1 = { test: 'node1' };
  const node2 = { test: 'node2' };
  const node = new MemoryNode('test_node');
  const edge = new MemoryEdge('test_edge');

  const node1Id = await node.create(node1);
  const node2Id = await node.create(node2);

  node1.id = node1Id;
  node2.id = node2Id;

  const edge1Id = await edge.create('leftId', node1Id);
  const edge2Id = await edge.create('leftId', node2Id);

  const page = await edge.getFirstAfter('leftId', { first: 2 });

  const connection = await toConnection(node, page);

  expect(connection).toMatchObject({
    hasNextPage: false,
    hasPreviousPage: false,
    edges: [
      { cursor: edge1Id.toString(32), node: { id: node1Id, ...node1 } },
      { cursor: edge2Id.toString(32), node: { id: node2Id, ...node2 } },
    ],
  });
});

test('it can convert edges to a connection with hasNextPage', async () => {
  const node1 = { test: 'node1' };
  const node2 = { test: 'node2' };
  const node = new MemoryNode('test_node');
  const edge = new MemoryEdge('test_edge');

  const node1Id = await node.create(node1);
  const node2Id = await node.create(node2);

  node1.id = node1Id;
  node2.id = node2Id;

  const edge1Id = await edge.create('leftId', node1Id);
  const edge2Id = await edge.create('leftId', node2Id);

  const page = await edge.getFirstAfter('leftId', { first: 1 });

  const connection = await toConnection(node, page);

  expect(connection).toMatchObject({
    hasNextPage: true,
    hasPreviousPage: false,
    edges: [
      { cursor: edge1Id.toString(32), node: { id: node1Id, ...node1 } },
    ],
  });
});


