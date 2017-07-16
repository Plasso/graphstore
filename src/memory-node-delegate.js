/* @flow */

export default class MemoryNodeDelegate implements NodeDelegate {
  type: string;
  id: number;
  nodes: { [nodeId: number]: {} };
  constructor(type: string) {
    this.type = type;
    this.id = 0;
    this.nodes = {};
  }

  getNodeType() {
    return this.type;
  }

  async createNode(data: {}) {
    const id = this.id;
    this.id += 1;

    this.nodes[id] = data;

    return id.toString(32);
  }

  async readNode(id: string) {
    return this.nodes[parseInt(id, 32)];
  }

  async deleteNode(id: string) {
    delete this.nodes[parseInt(id, 32)];
  }

  async updateNode(id: string, newNode: {} /* , updateId */) {
    this.nodes[parseInt(id, 32)] = newNode;
  }
}

