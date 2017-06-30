import counter from './counter';

export default class {
  constructor(redis, delegate) {
    this.redis = redis;
    this.delegate = delegate;
  }

  async _createNode(id, data) {
    return new Promise((resolve, reject) => {
      this.redis.get(id, (err, node) => {
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
          this.redis.set(id, json, (err) => {
            if (err) {
              reject(err);
              return;
            }

            resolve(id);
          });
        } else {
          this.redis.setnx(id, json, (err, result) => {
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

  async createNode(data) {
    const id = await this.delegate.createNode(data);
    return this._createNode(id, data);
  }

  async readNode(id) {
    return new Promise((resolve, reject) => {
      this.redis.get(id, async (err, node) => {
        if (err) {
          reject(err);
          return;
        }

        if (node === 'MISSING') {
          resolve(node);
        }

        if (node == null) {
          const newNode = await this.delegate.readNode(id);
          if (newNode) {
            this._createNode(id, newNode);
            node = JSON.stringify(newNode);
          }
        }

        if (node == null) {
          resolve('MISSING');
        }

        let obj;

        try {
          obj = JSON.parse(node);
        } catch (e) {
          reject(e);
        }

        resolve(obj);
      });
    });
  }

  async readNodes(ids) {
    return new Promise((resolve, reject) => {
      this.redis.mget(ids, (err, nodes) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(nodes.map((node) => {
          if (node === 'MISSING') {
            return node;
          }
          try {
            return JSON.parse(node);
          } catch (e) {
            return e;
          }
        }));
      });
    });
  }

  async updateNode(id, updates, deletes) {
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

  async _updateNode(id, updates, deletes) {
    return new Promise(async (resolve, reject) => {
      this.redis.watch(id);
      const updateId = await counter(this.redis);
      this.redis.get(id, (err, node) => {
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

        multi.set(id, JSON.stringify(newNode));

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

  async deleteNode(id) {
    return new Promise(async (resolve, reject) => {
      await this.delegate.deleteNode(id);
      this.redis.set(id, 'MISSING', (err) => {
        if (err) {
          reject(err);
          return;
        }

        resolve();
      });
    });
  }
}
