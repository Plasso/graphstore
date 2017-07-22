interface RedisCallback {
    (): void;
}

interface RedisErrorCallback {
    (err?: Error): void;
}

interface RedisDataCallback {
    (err?: Error, data?: any): void;
}

interface RedisMultiClient {
  incr(name: string): void;
  get(id: string, cb: RedisDataCallback): void;
  mget(ids: Array<string>, cb: RedisDataCallback): void;
  set(id: string, data: string|number, cb: RedisErrorCallback): void;
  setnx(id: string, data: string, cb: RedisErrorCallback): void;
  zadd(name: string, value: string|number, cb: ?RedisErrorCallback): void;
  zadd(args: Array<any>, cb: ?RedisErrorCallback): void;
  exec(RedisDataCallback): void;
}

interface RedisClient {
  decr(id: string): void;
  get(id: string, cb: RedisDataCallback): void;
  mget(ids: Array<string>, cb: RedisDataCallback): void;
  set(id: string, data: string|number, cb: RedisErrorCallback): void;
  setnx(id: string, data: string, cb: RedisErrorCallback): void;
  zadd(name: string, nx: string, id: string, data: string, cb: RedisDataCallback): void;
  zadd(args: Array<any>, cb: ?RedisErrorCallback): void;
  zrangebyscore(args: Array<any>, cb: RedisDataCallback): void;
  zrangebyscore(id: string, start: number, end: number, cb: RedisDataCallback): void;
  zrevrangebyscore(args: Array<any>, cb: RedisDataCallback): void;
  incr(name: string, cb: RedisDataCallback): void;
  watch(id: string): void;
  flushdb(cb: RedisErrorCallback): void;
  flushall(cb: RedisErrorCallback): void;
  once(name: string, cb: RedisCallback): void;
  end(force: boolean): void;
  unwatch(id: string): void;
  zrank(name: string, id: string, cb: RedisDataCallback): void;
  zcount(name: string, low: string|number, high: string|number, cb: RedisDataCallback): void;
  zrange(name: string, start: number, end: number, cb: RedisDataCallback): void;
  zrevrange(name: string, start: number, end: number, cb: RedisDataCallback): void;
  zremrangebyscore(name: string, min: number, max: number, cb: RedisDataCallback): void;
  zcard(name: string, cb: RedisDataCallback): void;
  multi(): RedisMultiClient;
}

interface Redis {
  createClient(connect: string): RedisClient;
}

declare module 'redis' {
  declare var exports:Redis;
}
