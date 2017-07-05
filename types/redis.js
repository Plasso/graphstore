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
  get(id: string, cb: RedisDataCallback): void;
  mget(ids: Array<string>, cb: RedisDataCallback): void;
  set(id: string, data: string, cb: RedisErrorCallback): void;
  setnx(id: string, data: string, cb: RedisErrorCallback): void;
  exec(RedisDataCallback): void;
}

interface RedisClient {
  get(id: string, cb: RedisDataCallback): void;
  mget(ids: Array<string>, cb: RedisDataCallback): void;
  set(id: string, data: string, cb: RedisErrorCallback): void;
  setnx(id: string, data: string, cb: RedisErrorCallback): void;
  zadd(name: string, nx: string, id: string, data: string, cb: RedisDataCallback): void;
  zadd(args: Array<any>, cb: RedisErrorCallback): void;
  zrangebyscore(args: Array<any>, cb: RedisDataCallback): void;
  zrevrangebyscore(args: Array<any>, cb: RedisDataCallback): void;
  incr(name: string, cb: RedisDataCallback): void;
  watch(id: string): void;
  flushdb(cb: RedisErrorCallback): void;
  once(name: string, cb: RedisCallback): void;
  end(force: boolean): void;
  unwatch(id: string): void;
  zrank(name: string, id: string, cb: RedisDataCallback): void;
  zcard(name: string, cb: RedisDataCallback): void;
  multi(): RedisMultiClient;
}

interface Redis {
  createClient(connect: string): RedisClient;
}

declare module 'redis' {
  declare var exports:Redis;
}
