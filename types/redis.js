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
  watch(id: string): void;
  multi(): RedisMultiClient;
}

interface Redis {
  createClient(connect: string): RedisClient;
}

declare module 'redis' {
  declare var exports:Redis;
}
