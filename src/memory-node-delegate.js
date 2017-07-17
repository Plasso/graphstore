/* @flow */

export default class MemoryNodeDelegate implements NodeDelegate {
  type: string;
  id: number;
  nodes: { [nodeId: number]: { id: string } };
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
    const stringId = id.toString(32);
    this.id += 1;

    this.nodes[id] = { id: stringId, ...data };

    return stringId;
  }

  async readNodes(ids: Array<string>) {
    return ids.map((id) => this.nodes[parseInt(id, 32)]);
  }

  async deleteNode(id: string) {
    delete this.nodes[parseInt(id, 32)];
  }

  async updateNode(id: string, newNode: { id: string } /* , updateId */) {
    this.nodes[parseInt(id, 32)] = newNode;
  }
}

