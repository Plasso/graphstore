/* @flow */

import counter from './counter';

export default class Node {
  redis: RedisClient;
  delegate: NodeDelegate;
  constructor(redis: RedisClient, delegate: NodeDelegate) {
    this.redis = redis;
    this.delegate = delegate;
  }

  _id(id: string) {
    return `${this.delegate.getNodeType()}_${id}`;
  }

  _createNode(id: string, data: {}) {
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
          json = JSON.stringify(data);
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

  async createNode(data: {}) {
    const id = await this.delegate.createNode(data);
    await this._createNode(id, data);

    return id;
  }

  async readNode(id: string) {
    const nodes = await this.readNodes([id]);
    return nodes[0];
  }

  async readNodes(ids: Array<string>) {
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
          if (node === null) {
            missingIds.push(ids[idx]);
            nodes[idx] = 'MISSING';
          } else if (node !== 'MISSING') {
            try {
              nodes[idx] = JSON.parse(node);
            } catch(_) {
              nodes[idx] = 'CORRUPT';
            }
          }
        });

        if (missingIds.length > 0) {
          const delegateNodes = await this.delegate.readNodes(missingIds);
          delegateNodes.forEach((delegateNode) => {
            if (delegateNode) {
              this._createNode(delegateNode.id, delegateNode);
              nodes[idToIndex[delegateNode.id]] = delegateNode;
            }
          });
        }

        resolve(nodes);
      });
    });
  }

  async updateNode(id: string, updates: Array<{}>, deletes: Array<{}>) {
    let tries = 0;

    while(tries < 3) {
      try {
        await this._updateNode(id, updates, deletes);
        return;
      } catch (e) {
        tries = tries + 1;
      }
    }
    throw new Error(`Could not update node ${id}`);
  }

  async _updateNode(id: string, updates: Array<{}>, deletes: Array<{}>) {
    const nodeId = this._id(id);
    return new Promise(async (resolve, reject) => {
      this.redis.watch(nodeId);
      const updateId = await counter(this.redis);
      this.redis.get(nodeId, (err, node) => {
        if (err) {
          reject(err);
          return;
        }

        if (node === 'MISSING') {
          reject(new Error(`Id ${id} does not exist`));
          return;
        }

        const obj = JSON.parse(node);
        const multi = this.redis.multi();

        const newNode = {...obj, ...updates};

        if (deletes) {
          deletes.forEach((name) => {
            delete newNode[name];
          });
        }

        multi.set(nodeId, JSON.stringify(newNode));

        multi.exec(async (err, result) => {
          if (err) {
            reject(err);
            return;
          }

          if (result === null) {
            reject();
            return;
          }

          await this.delegate.updateNode(id, newNode, updateId);

          resolve()
        });
      });
    });
  }

  async deleteNode(id: string) {
    return new Promise(async (resolve, reject) => {
      await this.delegate.deleteNode(id);
      this.redis.set(this._id(id), 'MISSING', (err) => {
        if (err) {
          reject(err);
          return;
        }

        resolve();
      });
    });
  }

  getNodeType() {
    return this.delegate.getNodeType();
  }
}
