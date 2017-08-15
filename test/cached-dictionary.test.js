/* @flow */

import { CachedDictionary } from '../src';
import redis from 'redis';

let client;

beforeEach((done) => {
  client = redis.createClient('redis://redis-test.wi32hd.0001.usw2.cache.amazonaws.com:6379/1');
  client.once('ready', () => {
    client.flushdb(done);
  });
});

afterEach(() => {
  client.end(true);
});

test('it can add keys to cache', async () => {
  const delegate = { set: jest.fn(), read: jest.fn(), remove: async() => {},  getName: () => 'test_dict' };
  const dict = new CachedDictionary(client, delegate);

  await dict.set('key', 'value');
  const [value] = await dict.read(['key']);

  expect(delegate.set.mock.calls.length).toBe(1);
  expect(delegate.read.mock.calls.length).toBe(0);
  expect(value).toBe('value');
});

test('it can read multiple keys from cache', async () => {
  const delegate = { set: jest.fn(), read: jest.fn(), getName: () => 'test_dict', remove: async () => {} };
  const dict = new CachedDictionary(client, delegate);

  delegate.read.mockReturnValueOnce(['value2', null]);

  await dict.set('key1', 'value1');
  await dict.set('key3', 'value3');
  const [value1, value2, value3, value4] = await dict.read(['key1', 'key2', 'key3', 'key4']);

  expect(delegate.read.mock.calls[0][0][0]).toBe('key2');
  expect(delegate.read.mock.calls[0][0][1]).toBe('key4');
  expect(delegate.set.mock.calls.length).toBe(3);
  expect(delegate.set.mock.calls[0][0]).toBe('key1');
  expect(delegate.set.mock.calls[0][1]).toBe('value1');
  expect(delegate.set.mock.calls[1][0]).toBe('key3');
  expect(delegate.set.mock.calls[1][1]).toBe('value3');
  expect(delegate.set.mock.calls[2][0]).toBe('key2');
  expect(delegate.set.mock.calls[2][1]).toBe('value2');
  expect(delegate.set.mock.calls.length).toBe(3);
  expect(delegate.set.mock.calls.length).toBe(3);
  expect(delegate.read.mock.calls.length).toBe(1);
  expect(value1).toBe('value1');
  expect(value2).toBe('value2');
  expect(value3).toBe('value3');
  expect(value4).toBeNull();
});

test('it can remove keys', async () => {
  const delegate = { set: jest.fn(), remove: jest.fn(), getName: () => 'test_dict', read: jest.fn() };
  const dict = new CachedDictionary(client, delegate);


  await dict.set('key', 'value');
  await dict.remove('key');

  const [value] = await dict.read(['key']);

  expect(value).toBeNull();
  expect(delegate.remove.mock.calls.length).toBe(1);
  expect(delegate.remove.mock.calls[0][0]).toBe('key');
});
