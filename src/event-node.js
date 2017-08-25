/* @flow */

const EventEmitter = require('events');

export default class EventNode extends EventEmitter implements NodeT {
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

  async evict(ids: Array<string>) {
    this.emit('beforeEvict', ids);
    await this.delegate.evict(ids);
    this.emit('afterEvict', ids);
  }

  async update(data: NodeDataT) {
    this.emit('beforeUpdate', data);
    const success = await this.delegate.update(data);
    this.emit('afterUpdate', data);
    return success;
  }

  async delete(id: string) {
    this.emit('beforeDelete', id);
    await this.delegate.delete(id);
    this.emit('afterDelete', id);
  }
}
