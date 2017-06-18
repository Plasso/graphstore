export default class {
  constructor(redis) {
    this.redis = redis;
  }

  async createNode(id, data) {
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

            resolve();
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

            resolve();
          });
        }
      });
    });
  }

  async readNode(id) {
    return new Promise((resolve, reject) => {
      this.redis.get(id, (err, node) => {
        if (err) {
          reject(err);
          return;
        }

        if (node === 'MISSING') {
          resolve(node);
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
    return new Promise((resolve, reject) => {
      this.redis.watch(id);
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

        multi.exec((err, result) => {
          if (err) {
            reject(err);
            return;
          }

          if (result === null) {
            reject();
            return;
          }

          resolve()
        });
      });
    });
  }

  async deleteNode(id) {
    return new Promise((resolve, reject) => {
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
