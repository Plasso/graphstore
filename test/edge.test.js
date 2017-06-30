import { Edge } from '../src';
import redis from 'redis';

let id = 0;
let client;

class EdgeDelegate {
  async edgeName() {
    return 'test_edge';
  }
  async edgeCount() {
    return 10;
  }
  async createEdge() {
    id += 1;
    return id;
  }
}

beforeAll(() => {
  client = redis.createClient('redis://redis-test.wi32hd.0001.usw2.cache.amazonaws.com:6379');

  client.flushdb();
});

afterAll(() => {
  client.end(true);
});

test('can create an edge', async () => {

});
