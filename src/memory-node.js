/* @flow */

export default class MemoryNode implements NodeT {
  name: string;
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
    const id = this.id;
    const stringId = id.toString(32);
    this.id += 1;

    this.nodes[id] = { id: stringId, ...data };

    return stringId;
  }

  async read(ids: Array<string>) {
    return ids.map((id) => this.nodes[parseInt(id, 32)]);
  }

  async delete(id: string) {
    delete this.nodes[parseInt(id, 32)];
  }

  async update(id: string, node: NodeDataT /* , updateId */) {
    this.nodes[parseInt(id, 32)] = { id, ...node };
  }
}
