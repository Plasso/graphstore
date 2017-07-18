/* @flow */

import { MemoryNode } from '../src';

test('it knows it\'s name', () => {
  const node = new MemoryNode('node_name');

  expect(node.getName()).toBe('node_name');
});

test('it returns an id when creating a node', async () => {
  const node = new MemoryNode('node_name');

  const id = await node.create({ test: 'data' });

  expect(id).toBe('0');
});

test('it creates a node', async () => {
  const node = new MemoryNode('node_name');
  const testNodeData = { test: 'data' };

  const id = await node.create(testNodeData);
  const fetchedNodes = await node.read([id]);

  expect(fetchedNodes[0]).toMatchObject(testNodeData);
});

test('if can delete a node', async () => {
  const node = new MemoryNode('node_name');
  const id = await node.create({ test: 'data' });

  await node.delete(id);

  const fetchedNode = await node.read([id]);

  expect(fetchedNode[0]).toBe(undefined);
});

test('if can update a node', async () => {
  const node = new MemoryNode('node_name');
  const id = await node.create({ test: 'data' });

  await node.update(id, { test: 'asdf' });

  const fetchedNode = await node.read([id]);

  expect(fetchedNode[0]).toMatchObject({ test: 'asdf' });
});

