import GraphStore from '../src';
import redis from 'redis';


test('', async () => {
  const client = redis.createClient('redis://redis-test.wi32hd.0001.usw2.cache.amazonaws.com:6379');

  client.flushdb();

  const gs = new GraphStore(client);

  await gs.createNode('test', { test: 'asdf' });

  const node = await gs.readNode('test');

  expect(node).toMatchObject({ test: 'asdf' });

  await expect(gs.createNode('test', {})).rejects.toBeDefined();

  await gs.deleteNode('test');

  const node2 = await gs.readNode('test');

  await gs.createNode('test', { test: 'asdf' });

  await gs.updateNode('test', { test: 'test2' });

  await gs.createEdge('test_edge', 1, 'test', 'test');

  client.end(true);
});

