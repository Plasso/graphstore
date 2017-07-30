/* @flow */

import counter from './counter';
import promisify from './promisify';

export default class CachedNode implements NodeT {
  redis: any;
  delegate: NodeT;
  constructor(redis: RedisClient, delegate: NodeT) {
    this.redis = promisify(redis);
    this.delegate = delegate;
  }

  _id(id: string) {
    return `${this.delegate.getName()}_${id}`;
  }

  async _create(id: string, data: {}) {
    const node = await this.redis.get(this._id(id));

    if (node && node != 'MISSING') {
      throw new Error(`Id ${id} already exists.`);
    }

    const json = JSON.stringify({ id, ...data });

    if (node === 'MISSING') {
      await this.redis.set(this._id(id));
    } else {
      const result = await this.redis.setnx(this._id(id), json);

      if (result == 0) {
        throw new Error(`Id ${id} already exists`);
      }
    }
    return id;
  }

  async create(data: {}) {
    const id = await this.delegate.create(data);
    await this._create(id, data);

    return id;
  }

  async read(ids: Array<string>) {
    const nodeIds = ids.map((id) => this._id(id));
    const nodes =  await this.redis.mget(nodeIds);

    const idToIndex = {};

    ids.forEach((id, idx) => {
      idToIndex[id] = idx;
    });
    const missingIds = [];
    nodes.forEach((node, idx) => {
      nodes[idx] = undefined;
      if (node === null) {
        missingIds.push(ids[idx]);
      } else if (node !== 'MISSING') {
        try {
          nodes[idx] = JSON.parse(node);
        } catch(_) {
          nodes[idx] = 'CORRUPT';
        }
      }
    });

    if (missingIds.length > 0) {
      const delegateNodes = await this.delegate.read(missingIds);
      const promises = delegateNodes.map((delegateNode) => {
        if (delegateNode) {
          nodes[idToIndex[delegateNode.id]] = delegateNode;
          return this._create(delegateNode.id, delegateNode);
        }
        return Promise.resolve();
      });
      await Promise.all(promises);
    }
    return nodes;
  }

  async update(id: string, node: NodeDataT) {
    let tries = 0;

    while(tries < 3) {
      try {
        await this._update(id, node);
        return;
      } catch (e) {
        tries = tries + 1;
      }
    }
    throw new Error(`Could not update node ${id}`);
  }

  async _update(id: string, node: NodeDataT) {
    const nodeId = this._id(id);
    this.redis.__base.watch(nodeId);
    const updateId = await counter(this.redis);
    const cachedNode = await this.redis.get(nodeId);

    if (cachedNode === 'MISSING') {
      this.redis.__base.unwatch(nodeId);
      throw new Error(`Id ${id} does not exist`);
    }

    const multi = promisify(this.redis.__base.multi());

    multi.__base.set(nodeId, JSON.stringify({ id, ...node }));

    const result = await multi.exec();
    if (result === null) {
      throw new Error('Failed to update node');
    }

    return  this.delegate.update(id, node, updateId);
  }

  async delete(id: string) {
    await this.delegate.delete(id);
    await this.redis.set(this._id(id), 'MISSING');
  }

  getName() {
    return this.delegate.getName();
  }
}
