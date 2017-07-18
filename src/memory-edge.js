/* @flow */

export default class MemoryEdge implements EdgeT {
  name: string;
  edges: { [leftId: string]: Array<EdgeDataT> };

  constructor(name: string) {
    this.name = name;
    this.edges = {};
  }

  async getName() {
    return this.name;
  }

  async getCount(leftId: string) {
    return this.edges[leftId] ? this.edges[leftId].length : 0;
  }

  async create(leftNodeId: string, rightNodeId: string) {
    this.edges[leftNodeId] = this.edges[leftNodeId] || [];

    const id = this.edges[leftNodeId].length;

    this.edges[leftNodeId].push({ id, nodeId: rightNodeId });

    return id.toString(32);
  }

  async getLimitOffset(leftId: string, { offset, limit }: EdgeLimitOffsetT) {
    const edges = this.edges[leftId].slice(offset, offset + limit);
    const hasNextPage = limit + offset < this.edges[leftId].length;

    return {
      hasNextPage,
      edges,
    };
  }

  async getFirstAfter(leftId: string, { after, first }: EdgeFirstAfterT) {
    const offset = after ? parseInt(after, 32) + 1 : 0;
    const start = offset || 0;

    const edges = this.edges[leftId].slice(start, start + first);
    const hasNextPage = first + offset < this.edges[leftId].length;

    return {
      hasNextPage,
      edges,
    };
  }

  async delete(leftId: string, id: string) {
    this.edges[leftId] = this.edges[leftId].splice(parseInt(id, 32), 1);
  }
}
