export default class {
  constructor(redis, delegate) {
    this.redis = redis;
    this.delegate = delegate;
  }

  async createEdge(leftNodeId, rightNodeId) {
    return new Promise(async (resolve, reject) => {
      const edgeId = await this.delegate.createEdge(leftNodeId, rightNodeId);
      const edgeName = await this.delegate.edgeName();
      // TODO: zaddnx wanted here.
      this.redis.zadd(edgeName, edgeId, JSON.stringify({leftNodeId, rightNodeId}), (err, result) => {
        if (err) {
          reject(err);
        }
        resolve();
      });
    });
  }

  async readEdges(name, { first, last, after, before }) {
    if (first) {
      let min;
      if (after) {
        min = `(${after}`;
      } else {
        min = -Infinity;
      }
      const args = [name, min, +Infinity, 'WITHSCORES', 'LIMIT', 0, Math.min(first, 50)];
      return new Promise((resolve, reject) => {
        this.redis.zrangebyscore(args, (err, data) => {
          resolve(data);
        });
      });
    } else if (last) {
      let min;
      if (after) {
        min = `(${before}`;
      } else {
        min = -Infinity;
      }
      const args = [name, min, -Infinity, 'WITHSCORES', 'LIMIT', 0, Math.min(last, 50)];
      return new Promise((resolve, reject) => {
        this.redis.zrevrangebyscore(args, (err, data) => {
          resolve(data);
        });
      });
    } else {
      const args = [name, -Infinity, +Infinity, 'WITHSCORES', 'LIMIT', 0, 50];
      return new Promise((resolve, reject) => {
        this.redis.zrangebyscore(args, (err, data) => {
          resolve(data);
        });
      });
    }
  }

  async deleteEdge(id) {
  }
}
