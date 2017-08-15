/* @flow */

import { MemoryDictionary } from '../src';

test('it can add keys to dictionary', async () => {
  const dict = new MemoryDictionary('test_dictionary');

  await dict.set('key', 'value');
  const [value] = await dict.read(['key']);

  expect(value).toBe('value');
});

test('it can read multiple keys from dictionary', async () => {
  const dict = new MemoryDictionary('test_dictionary');

  await dict.set('key1', 'value1');
  await dict.set('key3', 'value3');
  const [value1, value2, value3] = await dict.read(['key1', 'key2', 'key3']);

  expect(value1).toBe('value1');
  expect(value2).toBeNull();
  expect(value3).toBe('value3');
});

test('it can remove keys from dictionary', async () => {
  const dict = new MemoryDictionary('test_dictionary');

  await dict.set('key', 'value');
  await dict.remove('key');
  const [value] = await dict.read(['key']);

  expect(value).toBeNull();
});
