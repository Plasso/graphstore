/* @flow */

type EdgeRecord = {
  id: number;
  leftNodeId: string;
  rightNodeId: string;
};

interface EdgeDelegate {
  edgeName(): string;
  createEdge(leftNodeId: string, rightNodeId: string): number;
  edgeCount(): number;
  getEdgesForward(leftId: string, { offset: number, limit: number }): Array<EdgeRecord>;
  getEdgesAfterId(leftId: string, { after: string, first: number }): Array<EdgeRecord>;
}

export default class Edge {
  redis: RedisClient;
  delegate: EdgeDelegate;
  constructor(redis: RedisClient, delegate: EdgeDelegate) {
    this.redis = redis;
    this.delegate = delegate;
  }

  static MAX_BATCH = 50;

  async _createEdge(edgeName: string, edgeId: string, rightNodeId: string) {
    return new Promise(async (resolve, reject) => {
      this.redis.zadd(edgeName, 'NX', edgeId, JSON.stringify(), (err, result) => {
        if (err) {
          reject(err);
        }
        resolve(edgeId);
      });
    });
  }

  async createEdge(leftNodeId: string, rightNodeId: string) {
    const edgeId = await this.delegate.createEdge(leftNodeId, rightNodeId);
    const name = await this.delegate.edgeName();
    const edgeName = `${name}_${leftNodeId}`;

    return this._createEdge(edgeName, edgeId.toString(), rightNodeId);
  }

  async _updateCountRec() {
    return new Promise(async (resolve, reject) => {
      const name = await this.delegate.edgeName();
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
        const newCount = await this.delegate.edgeCount();

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

  async _updateCount() {
    let tries = 0;

    while(tries < 3) {
      try {
        const newCount = await this._updateCountRec();
        return newCount;
      } catch (e) {
        tries = tries + 1;
      }
    }
    throw new Error(`Could not update count`);
  }

  async edgeCount() {
    const name = await this.delegate.edgeName();
    return new Promise((resolve, reject) => {
      this.redis.get(`${name}_count`, async (err, count) => {
        if (err) {
          reject(err);
          return;
        }
        if (count == null) {
          const newCount = await this._updateCount();
          resolve(newCount);
          return;
        }
        resolve(count);
      });
    });
  }

  async _readFirst(leftId: string, { after, first }: { after: string, first: number }) {
    const name = await this.delegate.edgeName();
    const edgeName = `${name}_${leftId}`;
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
    const name = await this.delegate.edgeName();
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

  async _overlapsCache(leftId: string, { after, first }: { after: string, first: number }) {
    const name = await this.delegate.edgeName();
    const edgeName = `${name}_${leftId}`;

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

  async readEdges(leftId: string, { first, last, after, before }: { first: number, last: number, after: string, before: string }) {
    if (last || before) {
      return this._readLast(leftId, { last, before });
    } else {
      const inCache = await this._overlapsCache(leftId, { first, after });
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
