interface RedisErrorCallback {
    (err?: Error): void;
}

interface RedisDataCallback {
    (data?: any, err?: Error): void;
}
interface RedisClient {
  get(id: string, cb: RedisDataCallback): void;
  set(id: string, data: string, cb: RedisErrorCallback): void;
}

interface Redis {
  createClient(connect: string): RedisClient;
}

declare module 'redis' {
  declare var exports:Redis;
}
