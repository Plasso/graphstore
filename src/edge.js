/* @flow */

interface EdgeDelegate {
  edgeName(): string;
  createEdge(leftNodeId: string, rightNodeId: string): number;
}

export default class {
  redis: RedisClient;
  delegate: EdgeDelegate;
  constructor(redis: RedisClient, delegate: EdgeDelegate) {
    this.redis = redis;
    this.delegate = delegate;
  }

  async createEdge(leftNodeId: string, rightNodeId: string) {
    return new Promise(async (resolve, reject) => {
      const edgeId = await this.delegate.createEdge(leftNodeId, rightNodeId);
      const name = await this.delegate.edgeName();
      const edgeName = `${name}_${leftNodeId}`;
      this.redis.zadd(edgeName, 'NX', edgeId, JSON.stringify(rightNodeId), (err, result) => {
        if (err) {
          reject(err);
        }
        resolve(edgeId);
      });
    });
  }

  async readEdges(leftId: string, { first, last, after, before }: { first: number, last: number, after: string, before: string }) {
    const name = await this.delegate.edgeName();
    const edgeName = `${name}_${leftId}`;
    if (first || after) {
      let min;
      if (after) {
        min = `(${after}`;
      } else {
        min = -Infinity;
      }
      const args = [edgeName, min, +Infinity, 'WITHSCORES', 'LIMIT', 0, Math.min(first, 50)];
      return new Promise((resolve, reject) => {
        this.redis.zrangebyscore(args, (err, data) => {
          resolve(data);
        });
      });
    } else if (last || before) {
      let min;
      if (before) {
        min = `(${before}`;
      } else {
        min = Infinity;
      }
      const args = [edgeName, min, -Infinity, 'WITHSCORES', 'LIMIT', 0, Math.min(last, 50)];
      return new Promise((resolve, reject) => {
        this.redis.zrevrangebyscore(args, (err, data) => {
          resolve(data);
        });
      });
    } else {
      const args = [edgeName, -Infinity, +Infinity, 'WITHSCORES', 'LIMIT', 0, Math.min(first, 50)];
      return new Promise((resolve, reject) => {
        this.redis.zrangebyscore(args, (err, data) => {
          resolve(data);
        });
      });
    }
  }

  async deleteEdge(id: string) {
  }
}
