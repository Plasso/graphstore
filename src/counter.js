export default async function getId(redis) {
  return new Promise((resolve, reject) => {
    redis.incr('__global__', (err, result) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(result);
    });
  });
}
