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
  zadd(name: string, nx: string, id: number, data: string, cb: RedisDataCallback): void;
  zrangebyscore(args: Array<any>, cb: RedisDataCallback): void;
  zrevrangebyscore(args: Array<any>, cb: RedisDataCallback): void;
  incr(name: string, cb: RedisDataCallback): void;
  watch(id: string): void;
  multi(): RedisMultiClient;
}

interface Redis {
  createClient(connect: string): RedisClient;
}

declare module 'redis' {
  declare var exports:Redis;
}
