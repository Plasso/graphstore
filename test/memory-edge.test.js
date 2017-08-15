/* @flow */

import { MemoryEdge } from '../src';

test('it returns the edge name', async () => {
  const edgeName = 'test_edge';
  const ed = new MemoryEdge(edgeName);

  const name = await ed.getName();

  expect(name).toBe(edgeName);
});

test('creating an edge returns an id', async () => {
  const edgeName = 'test_edge';
  const ed = new MemoryEdge(edgeName);

  const id = await ed.create('leftId', 'rightId');

  expect(id).toBe(0);
});

test('creating an edge increases count', async () => {
  const edgeName = 'test_edge';
  const ed = new MemoryEdge(edgeName);

  await ed.create('leftId', 'rightId');
  const count = await ed.getCount('leftId');

  expect(count).toBe(1);
});

test('creating an edge with different leftId does not increase count', async () => {
  const edgeName = 'test_edge';
  const ed = new MemoryEdge(edgeName);

  await ed.create('leftId', 'rightId');
  const count = await ed.getCount('otherId');

  expect(count).toBe(0);
});

test('getFirstAfter returns edges added in order', async () => {
  const edgeName = 'test_edge';
  const ed = new MemoryEdge(edgeName);

  const after = await ed.create('leftId', 'rightId1');
  await ed.create('leftId', 'rightId2');
  await ed.create('leftId', 'rightId3');
  await ed.create('leftId', 'rightId4');
  const page = await ed.getFirstAfter('leftId', { after, first: 2 });

  expect(page.edges[0]).toMatchObject({
    id: 1,
    nodeId: 'rightId2',
  });

  expect(page.edges[1]).toMatchObject({
    id: 2,
    nodeId: 'rightId3',
  });
});

test('getFirstAfter returns edges added in order (reverse)', async () => {
  const edgeName = 'test_edge';
  const ed = new MemoryEdge(edgeName, { forward: false });

  await ed.create('leftId', 'rightId1');
  await ed.create('leftId', 'rightId2');
  await ed.create('leftId', 'rightId3');
  const after = await ed.create('leftId', 'rightId4');
  const page = await ed.getFirstAfter('leftId', { after, first: 2 });

  expect(page.edges[0]).toMatchObject({
    id: 2,
    nodeId: 'rightId3',
  });

  expect(page.edges[1]).toMatchObject({
    id: 1,
    nodeId: 'rightId2',
  });
});


test('getFirstAfter returns hasNextPage if more edges', async () => {
  const edgeName = 'test_edge';
  const ed = new MemoryEdge(edgeName);

  await ed.create('leftId', 'rightId1');
  await ed.create('leftId', 'rightId2');
  const page = await ed.getFirstAfter('leftId', { first: 1 });

  expect(page.hasNextPage).toBe(true);
});

test('getFirstAfter returns hasNextPage: false if no more edges', async () => {
  const edgeName = 'test_edge';
  const ed = new MemoryEdge(edgeName);

  await ed.create('leftId', 'rightId1');
  await ed.create('leftId', 'rightId2');
  const page = await ed.getFirstAfter('leftId', { first: 2 });

  expect(page.hasNextPage).toBe(false);
});

test('getFirstAfter returns hasNextPage: false if no more edges', async () => {
  const edgeName = 'test_edge';
  const ed = new MemoryEdge(edgeName);

  await ed.create('leftId', 'rightId1');
  const id = await ed.create('leftId', 'rightId2');
  await ed.delete('leftId', id);
  const page = await ed.getFirstAfter('leftId', { first: 2 });

  expect(page.edges.length).toBe(1);
});

