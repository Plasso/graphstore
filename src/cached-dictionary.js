/* @flow */

import promisify from './promisify';

export default class CachedDictionary implements DictionaryT {
  redis: any;
  delegate: DictionaryT;
  constructor(redis: any, delegate: DictionaryT) {
    this.redis = promisify(redis);
    this.delegate = delegate;
  }

  static MISSING_KEY = '__MISSING__';

  async read(keys: Array<string>) {
    const values = await this.redis.hmget(this.getName(), keys);
    const missingIds = keys.map((key, idx) => {
      if (values[idx] === null) {
        return key;
      }
      return '';
    }).filter(value => value !== '');
    let newValues = [];
    if (missingIds.length > 0) {
      newValues = await this.delegate.read(missingIds);
    }

    const promises = values.map((value, idx) => {
      if (value === null) {
        const newValue = newValues.shift();
        values[idx] = newValue;
        if (newValue) {
          return this.set(keys[idx], newValue);
        }
      } else if (values[idx] === CachedDictionary.MISSING_KEY) {
        values[idx] = null;
      }
      return Promise.resolve();
    });
    await Promise.all(promises);
    return values;
  }

  async set(key: string, value: string) {
    await this.delegate.set(key, value);
    await this.redis.hset(this.getName(), key, value);
  }

  async remove(key: string) {
    await this.delegate.remove(key);
    await this.redis.hset(this.getName(), key, CachedDictionary.MISSING_KEY);
  }

  getName() {
    return this.delegate.getName();
  }
}
