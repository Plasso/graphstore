/* @flow */
import promisify from './promisify';

export default class CachedEdge implements EdgeT {
  redis: any;
  delegate: EdgeT;
  forward: boolean;
  constructor(redis: any, delegate: EdgeT, options: { reverse?: boolean } = {}) {
    this.redis = promisify(redis);
    this.delegate = delegate;
    this.forward = options.reverse ? false : true;
  }

  static MAX_BATCH = 50;

  _watermark(leftId: string) {
    return `${leftId}_${this.delegate.getName()}_watermark`;
  }

  async _get(key: string) {
    return this.redis.get(key);
  }

  async _create(id: number, leftNodeId: string, rightNodeId: string, data: ?{}) {
    const watermarkName = this._watermark(leftNodeId);
    this.redis.__base.watch(watermarkName);

    try {
      const watermarkString = await this.redis.get(watermarkName);
      const watermark = parseInt(watermarkString, 10);

      const multi = promisify(this.redis.__base.multi());
      const name = this._name(leftNodeId);
      const counterName = `${name}_count`;

      multi.__base.incr(counterName);

      if (this.forward) {
        if (id < watermark) {
          multi.__base.zadd(this._name(leftNodeId), id, JSON.stringify({ id, nodeId: rightNodeId, data }));
        }
      } else {
        if (id > watermark) {
          multi.__base.zadd(this._name(leftNodeId), id, JSON.stringify({ id, nodeId: rightNodeId, data }));
        }
      }
      await multi.exec();
    } catch(err) {
      this.redis.__base.unwatch();
      throw(err);
    }
    return id;
  }

  async create(leftNodeId: string, rightNodeId: string, data: ?{}) {
    const id = await this.delegate.create(leftNodeId, rightNodeId, data);
    let tries = 0;

    while(tries < 4) {
      try {
        return this._create(id, leftNodeId, rightNodeId, data);
      } catch (e) {
        tries = tries + 1;
      }
    }
    throw new Error(`Could not update cache`);
  }

  async _read(leftId: string, { after, first: firstOrUndefined }: EdgeFirstAfterT) {
    const first = firstOrUndefined || CachedEdge.MAX_BATCH;
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
    let data;
    if (this.forward) {
      data = await this.redis.zrangebyscore(args);
    } else {
      data = await this.redis.zrevrangebyscore(args);
    }
    return data.map(x => JSON.parse(x));
  }

  _getRankOfEdgeItem(name: string, id: number) {
    if (this.forward) {
      return this.redis.zcount(name, -Infinity, `(${id}`);
    } else {
      return this.redis.zcount(name, +Infinity, `(${id}`);
    }
  }

  _name(leftId: string) {
    return `${this.delegate.getName()}_${leftId}`;
  }

  _getCountOfEdge(leftId: string) {
    return this.redis.zcard(this._name(leftId));
  }

  async _updateEdgeCache(leftId: string, first: number, hasNextPage: boolean,  edges: Array<EdgeDataT>) {
    const watermarkName = this._watermark(leftId);
    this.redis.__base.watch(watermarkName);
    const watermarkString = await this.redis.get(watermarkName);
    const multi = promisify(this.redis.__base.multi());
    const prefix = [this._name(leftId)];
    const watermark = parseInt(watermarkString, 10);
    let edgesToAdd;

    if (!isNaN(watermark)) {
      edgesToAdd = edges.filter((edge) => {
        if (this.forward) {
          return edge.id > watermark;
        } else {
          return edge.id < watermark;
        }
      });
    } else {
      edgesToAdd = edges;
    }

    edgesToAdd.forEach((x) => {
      prefix.push(x.id);
      prefix.push(JSON.stringify(x));
    });

    if (edgesToAdd.length > 0) {
      multi.__base.set(this._watermark(leftId), edgesToAdd[edgesToAdd.length - 1].id);
      multi.__base.zadd(prefix);
    }

    await multi.exec();
    const newHasNextPage = first < edges.length;
    return { hasNextPage: newHasNextPage || hasNextPage, edges: edges.slice(0, first) };
  }

  async getFirstAfter(leftId: string, { after, first: firstOrUndefined }: EdgeFirstAfterT) {
    const edgeName = this._name(leftId);

    const first = firstOrUndefined || CachedEdge.MAX_BATCH;

    let rank;
    if (after != null) {
      rank = await this._getRankOfEdgeItem(edgeName, after);
      if (rank == null) {
        /* asking for something outside cache  */
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

    if (rank + 1 + first <= count) {
      const edges = await this._read(leftId, { after, first });
      return { hasNextPage: rank + 1 + first < count, edges };
    }

    const { hasNextPage, edges } = await this.delegate.getFirstAfter(leftId, { after, first: CachedEdge.MAX_BATCH });

    let tries = 0;

    while(tries < 4) {
      try {
        const page = await this._updateEdgeCache(leftId, first, hasNextPage, edges);
        return page;
      } catch (e) {
        tries = tries + 1;
      }
    }
    throw new Error(`Could not update edge cache`);
  }

  async delete(leftId: string, id: number) {
    await this.delegate.delete(leftId, id);
    await this.redis.zremrangebyscore(this._name(leftId), id, id);
    const name = this._name(leftId);
    const counterName = `${name}_count`;

    this.redis.__base.decr(counterName);
  }

  async _updateCountRec(leftId: string) {
    const name = this._name(leftId);
    const counterName = `${name}_count`;

    this.redis.watch(counterName);
    const count = await this.redis.get(counterName);

    if (count) {
      this.redis.__base.unwatch();
      return count;
    }

    const multi = promisify(this.redis.__base.multi());
    const newCount = await this.delegate.getCount(leftId);

    multi.__base.set(counterName, newCount.toString());

    const result = await multi.exec();
    if (result === null) {
      throw new Error('unable to update count');
    }
    return newCount;
  }

  async _updateCount(leftId: string) {
    let tries = 0;

    while(tries < 4) {
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
    const name = this._name(leftId);
    const count = await this.redis.get(`${name}_count`);
    if (count == null) {
      return this._updateCount(leftId);
    }
    return parseInt(count);
  }

  getName() {
    return this.delegate.getName();
  }

  async _update(leftId: string, id: number, data: ?{}) {
    const watermarkName = this._watermark(leftId);
    const edgeName = this._name(leftId);
    this.redis.__base.watch(edgeName, watermarkName);
    try {
      const watermarkString = await this.redis.get(watermarkName);
      const watermark = parseInt(watermarkString, 10);

      if (isNaN(watermark)) {
        this.redis.__base.unwatch();
        return;
      }

      if (this.forward) {
        if (id > watermark) {
          this.redis.__base.unwatch();
          return;
        }
      } else {
        if (id < watermark) {
          this.redis.__base.unwatch();
          return;
        }
      }

      const multi = promisify(this.redis.__base.multi());
      const [ edgeJson ] = await this.redis.zrangebyscore(edgeName, id, id);
      multi.__base.zremrangebyscore(edgeName, id, id);
      const edge = JSON.parse(edgeJson);
      edge.data = data;
      multi.__base.zadd(edgeName, id, JSON.stringify(edge));
      const result = await multi.exec();
      if (result === null) {
        throw new Error('Failed to update edge cache.');
      }
    } catch (e) {
      this.redis.__base.unwatch();
      throw e;
    }
  }

  async update(leftId: string, id: number, data: ?{}) {
    await this.delegate.update(leftId, id, data);

    let tries = 0;

    while (tries < 4) {
      try {
        await this._update(leftId, id, data);
        return;
      } catch (e) {
        tries = tries + 1;
      }
    }
    throw new Error('Failed to update edge.');
  }
}
