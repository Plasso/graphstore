/* @flow */

import { EventNode, MemoryNode } from '../src';

test('it emits event before read', async () => {
  const node = new EventNode(new MemoryNode('test_node'));
  const nodeData = { test: 'asdf' };

  let called = false;

  const { id } = await node.create(nodeData);

  node.on('beforeRead', ([firstId]) => {
    called = true;
    expect(firstId).toBe(id);
  });

  await node.read([id]);

  expect(called).toBe(true);
});

test('it emits event after read', async () => {
  const node = new EventNode(new MemoryNode('test_node'));
  const nodeData = { test: 'asdf' };

  let called = false;

  const { id } = await node.create(nodeData);

  node.on('afterRead', ([newNode]) => {
    called = true;
    expect(newNode).toMatchObject({ id, ...nodeData });
  });

  await node.read([id]);

  expect(called).toBe(true);
});

test('it emits event before create', async () => {
  const node = new EventNode(new MemoryNode('test_node'));
  const nodeData = { test: 'asdf' };

  let called = false;

  node.on('beforeCreate', (data) => {
    called = true;
    expect(data).toMatchObject(nodeData);
  });

  await node.create(nodeData);

  expect(called).toBe(true);
});

test('it emits event after create', async () => {
  const node = new EventNode(new MemoryNode('test_node'));
  const nodeData = { test: 'asdf' };

  let generatedId;

  node.on('afterCreate', (newNode) => {
    expect(newNode).toMatchObject({ ...nodeData });
    generatedId = newNode.id;
  });

  const { id } = await node.create(nodeData);

  expect(generatedId).toBe(id);
});

test('it emits event before update', async () => {
  const node = new EventNode(new MemoryNode('test_node'));
  const originalData = { test: 'original' };
  const newData = { test: 'new' };

  const { id } = await node.create(originalData);

  let called = false;

  node.on('beforeUpdate', (newId, data, updateId) => {
    expect(newId).toBe(id);
    expect(data).toMatchObject(newData);
    expect(updateId).toBe(1);
    called = true;
  });

  await node.update(id, newData, 1);

  expect(called).toBe(true);
});

test('it emits event after update', async () => {
  const node = new EventNode(new MemoryNode('test_node'));
  const originalData = { test: 'original' };
  const newData = { test: 'new' };

  const { id } = await node.create(originalData);

  let called = false;

  node.on('afterUpdate', (newId, data, updateId) => {
    expect(newId).toBe(id);
    expect(data).toMatchObject(newData);
    expect(updateId).toBe(1);
    called = true;
  });

  await node.update(id, newData, 1);

  expect(called).toBe(true);
});

test('it emits event before delete', async () => {
  const node = new EventNode(new MemoryNode('test_node'));
  const nodeData = { test: 'original' };

  const { id } = await node.create(nodeData);

  let called = false;

  node.on('beforeDelete', (newId) => {
    expect(newId).toBe(id);
    called = true;
  });

  await node.delete(id);

  expect(called).toBe(true);
});

test('it emits event after delete', async () => {
  const node = new EventNode(new MemoryNode('test_node'));
  const nodeData = { test: 'original' };

  const { id } = await node.create(nodeData);

  let called = false;

  node.on('afterDelete', (newId) => {
    expect(newId).toBe(id);
    called = true;
  });

  await node.delete(id);

  expect(called).toBe(true);
});

