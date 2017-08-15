/* @flow */

export default class MemoryEdge implements EdgeT {
  name: string;
  nodeName: string;
  forward: boolean;
  id: number;
  edges: { [leftId: string]: Array<EdgeDataT> };

  constructor(name: string, options: { forward?: boolean } = {}) {
    this.name = name;
    this.edges = {};
    this.forward = options.forward !== false;
    this.id = 0;
  }

  getName() {
    return this.name;
  }

  async getCount(leftId: string) {
    return this.edges[leftId] ? this.edges[leftId].length : 0;
  }

  async create(leftNodeId: string, rightNodeId: string, data: ?{}) {
    this.edges[leftNodeId] = this.edges[leftNodeId] || [];

    const id = this.id;
    this.id += 1;

    if (this.forward) {
      this.edges[leftNodeId].push({ id, nodeId: rightNodeId, data });
    } else {
      this.edges[leftNodeId].unshift({ id, nodeId: rightNodeId, data });
    }

    return id;
  }

  async update(leftId: string, id: number, data: ?{}) {
    const offset = this.edges[leftId].findIndex((edge) => edge.id === id);
    this.edges[leftId][offset].data = data;
  }

  async getFirstAfter(leftId: string, { after, first }: EdgeFirstAfterT) {
    if (this.edges[leftId] == null) {
      return {
        hasNextPage: false,
        edges: [],
      };
    }

    const offset = after != null ? this.edges[leftId].findIndex((edge) => edge.id === after) + 1 : 0;

    const edges = this.edges[leftId].slice(offset, offset + first);
    const hasNextPage = first + offset < this.edges[leftId].length;

    return {
      hasNextPage,
      edges,
    };
  }

  async delete(leftId: string, id: number) {
    const index = this.edges[leftId].findIndex((edge) => edge.id === id);
    this.edges[leftId].splice(index, 1);
  }
}
