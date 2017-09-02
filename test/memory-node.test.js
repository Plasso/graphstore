/* @flow */

import { MemoryNode } from '../src';

test('it knows it\'s name', () => {
  const node = new MemoryNode('node_name');

  expect(node.getName()).toBe('node_name');
});

test('it returns an id when creating a node', async () => {
  const node = new MemoryNode('node_name');

  const [{ id }] = await node.create([{ test: 'data' }]);

  expect(id).toBe('0');
});

test('it creates a node', async () => {
  const node = new MemoryNode('node_name');
  const testNodeData = { test: 'data' };

  const [{ id }] = await node.create([testNodeData]);
  const fetchedNodes = await node.read([id]);

  expect(fetchedNodes[0]).toMatchObject(testNodeData);
});

test('it can delete a node', async () => {
  const node = new MemoryNode('node_name');
  const [{ id }] = await node.create([{ test: 'data' }]);

  await node.delete(id);

  const fetchedNode = await node.read([id]);

  expect(fetchedNode[0]).toBe(undefined);
});

test('it can update a node', async () => {
  const node = new MemoryNode('node_name');
  const [{ id, updateId }] = await node.create([{ test: 'data' }]);

  await node.update({ id, updateId, test: 'asdf' });

  const fetchedNode = await node.read([id]);

  expect(fetchedNode[0]).toMatchObject({ test: 'asdf' });
});

test('it stops updates to changed nodes', async () => {
  const node = new MemoryNode('node_name');
  const [{ id, updateId }] = await node.create([{ test: 'data' }]);

  const first = await node.update({ id, updateId, test: 'asdf' });
  const second = await node.update({ id, updateId, test: 'asdf' });

  expect(first).toBe(true);
  expect(second).toBe(false);
});

