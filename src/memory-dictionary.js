/* @flow */

export default class MemoryDictionary implements DictionaryT {
  name: string;
  dictionary: {};
  constructor(name: string) {
    this.name = name;
    this.dictionary = {};
  }

  async read(keys: Array<string>) {
    return keys.map(key => this.dictionary[key] || null);
  }

  async set(key: string, value: string) {
    this.dictionary[key] = value;
  }

  async remove(key: string) {
    delete this.dictionary[key];
  }

  getName() {
    return this.name;
  }
}
