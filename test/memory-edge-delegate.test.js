/* @flow */

import redis from 'redis';
import { MemoryEdgeDelegate } from '../src';

test('it returns the edge name', async () => {
  const edgeName = 'test_edge';
  const ed = new MemoryEdgeDelegate(edgeName);

  const name = await ed.edgeName('leftId');

  expect(name).toBe(`${edgeName}_leftId`);
});

test('creating an edge returns an id', async () => {
  const edgeName = 'test_edge';
  const ed = new MemoryEdgeDelegate(edgeName);

  const id = await ed.createEdge('leftId', 'rightId');

  expect(id).toBe('0');
});

test('creating an edge increases count', async () => {
  const edgeName = 'test_edge';
  const ed = new MemoryEdgeDelegate(edgeName);

  await ed.createEdge('leftId', 'rightId');
  const count = await ed.edgeCount('leftId');

  expect(count).toBe(1);
});

test('creating an edge with different leftId does not increase count', async () => {
  const edgeName = 'test_edge';
  const ed = new MemoryEdgeDelegate(edgeName);

  await ed.createEdge('leftId', 'rightId');
  const count = await ed.edgeCount('otherId');

  expect(count).toBe(0);
});

test('getEdgesForward returns edges added in order', async () => {
  const edgeName = 'test_edge';
  const ed = new MemoryEdgeDelegate(edgeName);

  await ed.createEdge('leftId', 'rightId1');
  await ed.createEdge('leftId', 'rightId2');
  await ed.createEdge('leftId', 'rightId3');
  await ed.createEdge('leftId', 'rightId4');
  const edges = await ed.getEdgesForward('leftId', { offset: 1, limit: 2 });

  expect(edges[0]).toMatchObject({
    id: 1,
    leftNodeId: 'leftId',
    rightNodeId: 'rightId2',
  });
  expect(edges[1]).toMatchObject({
    id: 2,
    leftNodeId: 'leftId',
    rightNodeId: 'rightId3',
  });
});

test('getEdgesAfterId returns edges added in order', async () => {
  const edgeName = 'test_edge';
  const ed = new MemoryEdgeDelegate(edgeName);

  const after = await ed.createEdge('leftId', 'rightId1');
  await ed.createEdge('leftId', 'rightId2');
  await ed.createEdge('leftId', 'rightId3');
  await ed.createEdge('leftId', 'rightId4');
  const edges = await ed.getEdgesAfterId('leftId', { after, first: 2 });

  expect(edges[0]).toMatchObject({
    id: 1,
    leftNodeId: 'leftId',
    rightNodeId: 'rightId2',
  });

  expect(edges[1]).toMatchObject({
    id: 2,
    leftNodeId: 'leftId',
    rightNodeId: 'rightId3',
  });
});

test('getEdgesBeforeId returns edges added in order', async () => {
  const edgeName = 'test_edge';
  const ed = new MemoryEdgeDelegate(edgeName);

  await ed.createEdge('leftId', 'rightId1');
  await ed.createEdge('leftId', 'rightId2');
  await ed.createEdge('leftId', 'rightId3');
  const before = await ed.createEdge('leftId', 'rightId4');
  const edges = await ed.getEdgesBeforeId('leftId', { before, last: 2 });

  expect(edges[0]).toMatchObject({
    id: 2,
    leftNodeId: 'leftId',
    rightNodeId: 'rightId3',
  });

  expect(edges[1]).toMatchObject({
    id: 1,
    leftNodeId: 'leftId',
    rightNodeId: 'rightId2',
  });
});

