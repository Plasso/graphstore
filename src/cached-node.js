/* @flow */

import counter from './counter';

export default class CachedNode implements NodeT {
  redis: RedisClient;
  delegate: NodeT;
  constructor(redis: RedisClient, delegate: NodeT) {
    this.redis = redis;
    this.delegate = delegate;
  }

  _id(id: string) {
    return `${this.delegate.getName()}_${id}`;
  }

  _create(id: string, data: {}) {
    return new Promise((resolve, reject) => {
      this.redis.get(this._id(id), (err, node) => {
        if (err) {
          reject(err);
          return;
        }

        if (node && node != 'MISSING') {
          reject(new Error(`Id ${id} already exists.`));
          return;
        }

        let json;

        try {
          json = JSON.stringify({ id, ...data });
        } catch (e) {
          reject(e);
          return;
        }

        if (node === 'MISSING') {
          this.redis.set(this._id(id), json, (err) => {
            if (err) {
              reject(err);
              return;
            }

            resolve(id);
          });
        } else {
          this.redis.setnx(this._id(id), json, (err, result) => {
            if (err) {
              reject(err);
              return;
            }

            if (result == 0) {
              reject(new Error(`Id ${id} already exists`));
              return;
            }

            resolve(id);
          });
        }
      });
    });
  }

  async create(data: {}) {
    const id = await this.delegate.create(data);
    await this._create(id, data);

    return id;
  }

  async read(ids: Array<string>) {
    const nodeIds = ids.map((id) => this._id(id));
    return new Promise((resolve, reject) => {
      this.redis.mget(nodeIds, async (err, nodes) => {
        if (err) {
          reject(err);
          return;
        }

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

        resolve(nodes);
      });
    });
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
    return new Promise(async (resolve, reject) => {
      this.redis.watch(nodeId);
      const updateId = await counter(this.redis);
      this.redis.get(nodeId, (err, cachedNode) => {
        if (err) {
          reject(err);
          return;
        }

        if (cachedNode === 'MISSING') {
          reject(new Error(`Id ${id} does not exist`));
          return;
        }

        const multi = this.redis.multi();

        multi.set(nodeId, JSON.stringify({ id, ...node }));

        multi.exec(async (err, result) => {
          if (err) {
            reject(err);
            return;
          }

          if (result === null) {
            reject();
            return;
          }

          await this.delegate.update(id, node, updateId);

          resolve()
        });
      });
    });
  }

  async delete(id: string) {
    return new Promise(async (resolve, reject) => {
      await this.delegate.delete(id);
      this.redis.set(this._id(id), 'MISSING', (err) => {
        if (err) {
          reject(err);
          return;
        }

        resolve();
      });
    });
  }

  getName() {
    return this.delegate.getName();
  }
}
