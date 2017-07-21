/* @flow */

export default class MemoryEdge implements EdgeT {
  name: string;
  edges: { [leftId: string]: Array<EdgeDataT> };

  constructor(name: string, forward: boolean = true) {
    this.name = name;
    this.edges = {};
    this.forward = forward;
    this.id = 0;
  }

  getName() {
    return this.name;
  }

  async getCount(leftId: string) {
    return this.edges[leftId] ? this.edges[leftId].length : 0;
  }

  async create(leftNodeId: string, rightNodeId: string) {
    this.edges[leftNodeId] = this.edges[leftNodeId] || [];

    const id = this.id;
    this.id += 1;

    if (this.forward) {
      this.edges[leftNodeId].push({ id, nodeId: rightNodeId });
    } else {
      this.edges[leftNodeId].unshift({ id, nodeId: rightNodeId });
    }

    return id;
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

  async delete(leftId: string, id: string) {
    this.edges[leftId].splice(parseInt(id, 32), 1);
  }
}
