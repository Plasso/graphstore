/* @flow */

import type Node from './node';

export default class Edge {
  redis: RedisClient;
  delegate: EdgeDelegate;
  leftNode: Node;
  rightNode: Node;
  constructor(redis: RedisClient, delegate: EdgeDelegate, leftNode: Node, rightNode: Node) {
    this.redis = redis;
    this.delegate = delegate;
    this.leftNode = leftNode;
    this.rightNode = rightNode;
  }

  static MAX_BATCH = 50;

  async createEdge(leftNodeId: string, rightNodeId: string) {
    return this.delegate.createEdge(leftNodeId, rightNodeId);
  }

  async _updateCountRec(leftId: string) {
    return new Promise(async (resolve, reject) => {
      const name = await this.delegate.edgeName(leftId);
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
        const newCount = await this.delegate.edgeCount(leftId);

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

  async edgeCount(leftId: string) {
    const name = await this.delegate.edgeName(leftId);
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

  async _readFirst(leftId: string, { after, first }: { after: string, first: number }) {
    const edgeName = await this.delegate.edgeName(leftId);
    let min;
    if (after) {
      min = `(${after}`;
    } else {
      min = -Infinity;
    }
    const args = [edgeName, min, +Infinity, 'LIMIT', 0, Math.min(first, Edge.MAX_BATCH)];
    return new Promise((resolve, reject) => {
      this.redis.zrangebyscore(args, (err, data) => {
        resolve(data.map(x => JSON.parse(x)));
      });
    });
  }

  async _readLast(leftId: string, { before, last }: { before: string, last: number }) {
    const name = await this.delegate.edgeName(leftId);
    const edgeName = `${name}_${leftId}`;
    let min;
    if (before) {
      min = `(${before}`;
    } else {
      min = Infinity;
    }
    const args = [edgeName, min, -Infinity, 'LIMIT', 0, Math.min(last, Edge.MAX_BATCH)];
    return new Promise((resolve, reject) => {
      this.redis.zrevrangebyscore(args, (err, data) => {
        resolve(data);
      });
    });
  }

  _getRankOfEdgeItem(name: string, id: string) {
    return new Promise((resolve, reject) => {
      this.redis.zrank(name, id, (err, rank) => {
        if (err) {
          reject(err);
          return;
        }
        console.log(name, id, rank);
        resolve(rank);
      });
    });
  }

  _getCountOfEdge(name: string) {
    return new Promise((resolve, reject) => {
      this.redis.zcard(name, (err, count) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(count);
      });
    });
  }

  async _primeCache(leftId: string, { after, first }: { after: string, first: number }) {
    const edgeName = await this.delegate.edgeName(leftId);

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
      return true;
    }

    const edges = await this.delegate.getEdgesForward(leftId, { offset: rank + count, limit: Edge.MAX_BATCH });

    const prefix = [edgeName];

    edges.forEach((x) => {
      prefix.push(x.id);
      prefix.push(JSON.stringify(x));
    });

    return new Promise((resolve, reject) => {
      this.redis.zadd(prefix, (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(true);
      });
    });
  }

  async _primeCacheReverse(leftId: string, { before, last }: { before: string, last: number }) {
    const name = await this.delegate.edgeName(leftId);
    const edgeName = `${name}_rev`;

    let rank;
    if (before != null) {
      rank = await this._getRankOfEdgeItem(edgeName, before);
      if (rank == null) {
        return false;
      }
    } else {
      rank = 0;
    }

    const count = await this._getCountOfEdge(edgeName);

    if (rank + last <= count) {
      return true;
    }

    const edges = await this.delegate.getEdgesBackwards(leftId, { offset: rank + count, limit: Edge.MAX_BATCH });

    const prefix = [edgeName];

    edges.forEach((x) => {
      prefix.push(x.id);
      prefix.push(JSON.stringify(x));
    });

    return new Promise((resolve, reject) => {
      this.redis.zadd(prefix, (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(true);
      });
    });
  }

  async readEdges(leftId: string, { first, last, after, before }: { first: number, last: number, after: string, before: string }) {
    const pageInfo = { hasNextPage: false, hasPreviousPage: false };
    if (last || before) {
      const inCache = await this._primeCacheReverse(leftId, { last, before });
      if (inCache) {
        return this._readLast(leftId, { last, before });
      } else {
        return this.delegate.getEdgesBeforeId(leftId, { last, before });
      }
    } else {
      const inCache = await this._primeCache(leftId, { first, after });
      if (inCache) {
        return this._readFirst(leftId, { first, after });
      } else {
        return this.delegate.getEdgesAfterId(leftId, { first, after });
      }
    }
  }

  async deleteEdge(id: string) {
  }
}
