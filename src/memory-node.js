/* @flow */

export default class MemoryNode implements NodeT {
  type: string;
  id: number;
  nodes: { [nodeId: number]: { id: string } };
  constructor(name: string) {
    this.name = name;
    this.id = 0;
    this.nodes = {};
  }

  getName() {
    return this.name;
  }

  async create(data: {}) {
    const stringId = this.id.toString(32);
    this.id += 1;

    data.id = stringId;

    this.nodes[stringId] = data;

    return stringId;
  }

  async read(ids: Array<string>) {
    return ids.map((id) => this.nodes[parseInt(id, 32)]);
  }

  async delete(id: string) {
    delete this.nodes[id];
  }

  async update(id: string, node: NodeDataT /* , updateId */) {
    this.nodes[parseInt(id, 32)] = node;
  }
}

