/* @flow */

export default class MemoryNode implements NodeT {
  name: string;
  id: number;
  nodes: { [nodeId: number]: { id: string, updateId: number } };
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

    this.nodes[id] = { id: stringId, updateId: 0, ...data };

    return this.nodes[id];
  }

  async evict() {
  }

  async read(ids: Array<string>) {
    return ids.map((id) => this.nodes[parseInt(id, 32)]);
  }

  async delete(id: string) {
    delete this.nodes[parseInt(id, 32)];
  }

  async update(node: NodeDataT) {
    const oldNode = this.nodes[parseInt(node.id, 32)];
    if (oldNode.updateId !== node.updateId) {
      return false;
    }
    node.updateId = node.updateId + 1;
    this.nodes[parseInt(node.id, 32)] = { ...node };
    return true;
  }
}

