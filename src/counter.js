/* @flow */

export default async function getId(redis: any) {
  return redis.incr('__global__');
}
