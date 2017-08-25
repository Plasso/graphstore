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


test('it emits event before evict', async () => {
  const node = new EventNode(new MemoryNode('test_node'));

  const ids = ['1', '2', '3'];
  let called = false;

  node.on('beforeEvict', (newIds) => {
    newIds.forEach((id, idx) => expect(id).toBe(ids[idx]));
    called = true;
  });

  await node.evict(ids);

  expect(called).toBe(true);
});

test('it emits event after evict', async () => {
  const node = new EventNode(new MemoryNode('test_node'));
  const ids = ['1', '2', '3'];
  let called = false;

  node.on('afterEvict', (newIds) => {
    newIds.forEach((id, idx) => expect(id).toBe(ids[idx]));
    called = true;
  });

  await node.evict(ids);

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

  const { id, updateId } = await node.create(originalData);

  let called = false;

  node.on('beforeUpdate', (data) => {
    expect(data).toMatchObject({ id, updateId, ...newData });
    called = true;
  });

  const success = await node.update({ id, updateId, ...newData });
  expect(success).toBe(true);
  expect(called).toBe(true);
});

test('it emits event after update', async () => {
  const node = new EventNode(new MemoryNode('test_node'));
  const originalData = { test: 'original' };
  const newData = { test: 'new' };

  const { id, updateId } = await node.create(originalData);

  let called = false;

  node.on('afterUpdate', (data) => {
    expect(data).toMatchObject({ id, updateId: updateId + 1, ...newData });
    called = true;
  });

  await node.update({ id, updateId, ...newData });

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

