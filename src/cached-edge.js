/* @flow */

import type Node from './node';

export default class CachedEdge {
  redis: RedisClient;
  delegate: EdgeT;
  left: number;
  right: number;
  constructor(redis: RedisClient, delegate: EdgeT, options = {}) {
    this.redis = redis;
    this.delegate = delegate;
    this.forwards = options.reverse ? false : true;
    this.hi = -Infinity;
    this.low = +Infinity;
  }

  static MAX_BATCH = 50;

  async create(leftNodeId: string, rightNodeId: string) {
    const id = await this.delegate.create(leftNodeId, rightNodeId);
    if (this.forward) {
      if (id < this.hi) {
        // add to edge cache
      }
    } else {
      if (id > this.low) {
        // add to edge cache
      }
    }
    return id;
  }

  async _read(leftId: string, { after, first }: { after: string, first: number }) {
    const edgeName = this._name(leftId);
    let min;
    let max;
    if (start) {
      min = `(${after}`;
    } else {
      min = this.forward ? -Infinity : +Infinity;
    }

    max = this.forward ? +Infinity : -Infinity;

    const args = [edgeName, min, max, 'LIMIT', 0, Math.min(count, Edge.MAX_BATCH)];
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

  _getRankOfEdgeItem(name: string, id: string) {
    return new Promise((resolve, reject) => {
      this.redis.zcount(name, -Infinity, `(${id}`, (err, rank) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rank > 0 ? rank - 1 : null);
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

  async read(leftId: string, { after, first }: { after: string, first: number }) {
    const edgeName = this._name(leftId);

    let rank;
    if (after != null) {
      rank = await this._getRankOfEdgeItem(edgeName, after);
      if (rank == null) {
        return false;
      }
    } else {
      rank = 0;
    }

    const count = await this._getCountOfEdge(edgeName);

    if (rank + first <= count) {
      const edges = await this._read(leftId, { after, first });
      return { hasNextPage: rank + first < count, edges };
    }

    const { hasNextPage, edges } = await this.delegate.getLimitOffset(leftId, { offset: rank + count, limit: Edge.MAX_BATCH });

    const prefix = [edgeName];

    edges.forEach((x) => {
      prefix.push(x.id);
      prefix.push(JSON.stringify(x));
    });

    if (this.forward) {
      this.hi = edges[edges.length - 1].id;
    } else {
      this.low = edges[edges.length - 1].id;
    }

    return new Promise((resolve, reject) => {
      this.redis.zadd(prefix, (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve({ hasNextPage, edges });
      });
    });
  }

  async deleteEdge(id: number) {
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

        multi.exec(async (err, result) => {
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
