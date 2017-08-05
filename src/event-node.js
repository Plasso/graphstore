/* @flow */

const EventEmitter = require('events');

export default class EventNode extends EventEmitter {
  delegate: NodeT;
  constructor(delegate: NodeT) {
    super();
    this.delegate = delegate;
  }

  getName() {
    return this.delegate.getName();
  }

  async read(ids: Array<string>) {
    this.emit('beforeRead', ids);
    const nodes = await this.delegate.read(ids);
    this.emit('afterRead', nodes);
    return nodes;
  }

  async create(data: {}) {
    this.emit('beforeCreate', data);
    const node = await this.delegate.create(data);
    this.emit('afterCreate', node);
    return node;
  }

  async update(data: NodeDataT, updateId: number) {
    this.emit('beforeUpdate', data, updateId);
    await this.delegate.update(data, updateId);
    this.emit('afterUpdate', data, updateId);
  }

  async delete(id: string) {
    this.emit('beforeDelete', id);
    await this.delegate.delete(id);
    this.emit('afterDelete', id);
  }
}
