/* @flow */

import promisify from './promisify';

export default class CachedNode implements NodeT {
  redis: any;
  delegate: NodeT;
  constructor(redis: any, delegate: NodeT) {
    this.redis = promisify(redis);
    this.delegate = delegate;
  }

  _id(id: string) {
    return `${this.delegate.getName()}_${id}`;
  }

  async _create(data: Array<NodeDataT>) {
    const params = [];
    data.forEach(datum => {
      params.push(this._id(datum.id));
      params.push(JSON.stringify(datum));
    });
    return this.redis.mset(params);
  }

  async create(data: Array<{}>) {
    const nodes = await this.delegate.create(data);
    await this._create(nodes);

    return nodes;
  }

  async read(ids: Array<string>) {
    if (!ids || ids.length === 0) {
      return [];
    }
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
          return this._create([delegateNode]);
        }
        return Promise.resolve();
      });
      await Promise.all(promises);
    }
    return nodes;
  }

  async evict(ids: Array<string>) {
    return this.redis.del(ids.map(id => this._id(id)));
  }

  async update(node: NodeDataT) {
    const nodeId = this._id(node.id);
    this.redis.__base.watch(nodeId);
    const cachedNode = await this.redis.get(nodeId);

    if (cachedNode === 'MISSING') {
      this.redis.__base.unwatch();
      throw new Error(`Id ${node.id} does not exist`);
    }

    // Fail update if underlying node changed since last read
    if (cachedNode) {
      if (cachedNode.updateId && node.updateId && cachedNode.updateId !== node.updateId) {
        this.redis.__base.unwatch();
        return false;
      }
    }

    const multi = promisify(this.redis.__base.multi());

    const newNode = { ...node };

    if (newNode.updateId) {
      newNode.updateId = newNode.updateId + 1;
    }

    multi.__base.set(nodeId, JSON.stringify(newNode));

    const success = await this.delegate.update(node);

    if (success) {
      const result = await multi.exec();
      if (result === null) {
        throw new Error('Failed to update node');
      }
    } else {
      multi.__base.discard();
    }

    return success;
  }

  async delete(id: string) {
    await this.delegate.delete(id);
    await this.redis.set(this._id(id), 'MISSING');
  }

  getName() {
    return this.delegate.getName();
  }
}
