/* @flow */

export default class CachedEdge {
  redis: RedisClient;
  delegate: EdgeT;
  left: number;
  right: number;
  constructor(redis: RedisClient, delegate: EdgeT, options = {}) {
    this.redis = redis;
    this.delegate = delegate;
    this.forward = options.reverse ? false : true;
    this.hi = -Infinity;
    this.low = +Infinity;
  }

  static MAX_BATCH = 50;

  _watermark(leftId: string) {
    return `${leftId}_${this.delegate.getName()}_watermark`;
  }

  async _get(key: string): string {
    return new Promise((resolve, reject) => {
      this.redis.get(key, (err, data) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(data);
      });
    });
  }

  async _create(id: number, leftNodeId: string, rightNodeId: string) {
    const watermarkName = this._watermark(leftNodeId);
    this.redis.watch(watermarkName);

    try {
      const watermarkString = await this._get(watermarkName);
      const watermark = parseInt(watermarkString, 10);

      const multi = this.redis.multi();

      if (this.forward) {
        if (id < watermark) {
          multi.zadd(this._name(leftNodeId), id, JSON.stringify({ id, nodeId: rightNodeId }));
        }
      } else {
        if (id > watermark) {
          multi.zadd(this._name(leftNodeId), id, JSON.stringify({ id, nodeId: rightNodeId }));
        }
      }
      return new Promise((resolve, reject) => {
        multi.exec((err, result) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(id);
        });
      });
    } catch(err) {
      this.redis.unwatch(watermarkName);
      reject(err);
    }
  }

  async create(leftNodeId: string, rightNodeId: string) {
    const id = await this.delegate.create(leftNodeId, rightNodeId);
    let tries = 0;

    while(tries < 3) {
      try {
        return this._create(id, leftNodeId, rightNodeId);
      } catch (e) {
        tries = tries + 1;
      }
    }
    throw new Error(`Could not update cache`);
  }

  async _read(leftId: string, { after, first }: { after: string, first: number }) {
    const edgeName = this._name(leftId);
    let min;
    let max;
    if (after != null) {
      min = `(${after}`;
    } else {
      min = this.forward ? -Infinity : +Infinity;
    }

    max = this.forward ? +Infinity : -Infinity;

    const args = [edgeName, min, max, 'LIMIT', 0, Math.min(first, CachedEdge.MAX_BATCH)];
    return new Promise((resolve, reject) => {
      if (this.forward) {
        this.redis.zrangebyscore(args, (err, data) => {
          resolve(data.map(x => JSON.parse(x)));
        });
      } else {
        this.redis.zrevrangebyscore(args, (err, data) => {
          resolve(data.map(x => JSON.parse(x)));
        });
      }
    });
  }

  _getRankOfEdgeItem(name: string, id: number) {
    return new Promise((resolve, reject) => {
      this.redis.zcount(name, -Infinity, `(${id}`, (err, rank) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rank);
      });
    });
  }

  _name(leftId: string) {
    return `${this.delegate.getName()}_${leftId}`;
  }

  _getCountOfEdge(leftId: string) {
    return new Promise((resolve, reject) => {
      this.redis.zcard(this._name(leftId), (err, count) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(count);
      });
    });
  }

  async getFirstAfter(leftId: string, { after, first }: { after: string, first: number }) {
    const edgeName = this._name(leftId);

    let rank;
    if (after != null) {
      rank = await this._getRankOfEdgeItem(edgeName, after);
      if (rank == null) {
        const { hasNextPage, edges } = await this.delegate.getFirstAfter(leftId, { after, first });

        return {
          hasNextPage,
          edges
        };
      }
    } else {
      rank = 0;
    }

    const count = await this._getCountOfEdge(leftId);

    if (rank + first <= count) {
      const edges = await this._read(leftId, { after, first });
      return { hasNextPage: rank + first < count, edges };
    }

    const { hasNextPage, edges } = await this.delegate.getFirstAfter(leftId, { after, first: CachedEdge.MAX_BATCH });

    const prefix = [edgeName];

    edges.forEach((x) => {
      prefix.push(x.id);
      prefix.push(JSON.stringify(x));
    });

    this.redis.set(this._watermark(leftId), edges[edges.length - 1].id);

    return new Promise((resolve, reject) => {
      this.redis.zadd(prefix, (err) => {
        if (err) {
          reject(err);
          return;
        }
        const newHasNextPage = first < edges.length;
        resolve({ hasNextPage: newHasNextPage, edges: edges.slice(0, first) });
      });
    });
  }

  async deleteEdge(leftId: string, id: number) {
  }

  async _updateCountRec(leftId: string) {
    return new Promise(async (resolve, reject) => {
      const name = this._name();
      const counterName = `${name}_count`;
      this.redis.watch(counterName);
      this.redis.get(counterName, async (err, count) => {
        if (err) {
          reject(err);
          return;
        }

        if (count) {
          this.redis.unwatch(counterName);
          resolve(count);
          return;
        }

        const multi = this.redis.multi();
        const newCount = await this.delegate.getCount(leftId);

        multi.set(counterName, newCount.toString());

        multi.exec((err, result) => {
          if (err) {
            reject(err);
            return;
          }

          if (result === null) {
            reject();
            return;
          }

          resolve(newCount)
        });
      });
    });
  }

  async _updateCount(leftId: string) {
    let tries = 0;

    while(tries < 3) {
      try {
        const newCount = await this._updateCountRec(leftId);
        return newCount;
      } catch (e) {
        tries = tries + 1;
      }
    }
    throw new Error(`Could not update count`);
  }

  async getCount(leftId: string) {
    const name = this._name();
    return new Promise((resolve, reject) => {
      this.redis.get(`${name}_count`, async (err, count) => {
        if (err) {
          reject(err);
          return;
        }
        if (count == null) {
          const newCount = await this._updateCount(leftId);
          resolve(newCount);
          return;
        }
        resolve(count);
      });
    });
  }
}
