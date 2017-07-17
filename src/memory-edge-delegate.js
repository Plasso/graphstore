/* @flow */

export default class MemoryEdgeDelegate implements EdgeDelegate {
  name: string;
  edges: { [leftId: string]: Array<EdgeRecord> };

  constructor(name: string) {
    this.name = name;
    this.edges = {};
  }

  async edgeName(leftId: string) {
    return `${this.name}_${leftId}`;
  }

  async edgeCount(leftId: string) {
    return this.edges[leftId] ? this.edges[leftId].length : 0;
  }

  async createEdge(leftNodeId: string, rightNodeId: string) {
    this.edges[leftNodeId] = this.edges[leftNodeId] || [];

    const id = this.edges[leftNodeId].length;

    this.edges[leftNodeId].push({ id, leftNodeId, rightNodeId });

    return id.toString(32);
  }

  async getEdgesForward(leftId: string, { offset, limit }: EdgeLimitOffset) {
    return this.edges[leftId].slice(offset, offset + limit);
  }

  async getEdgesBackwards(leftId: string, { offset, limit }: EdgeLimitOffset) {
    const length = this.edges[leftId].length;
    const endIndex = length - offset;
    const startIndex = length - limit;

    return this.edges[leftId].slice(startIndex, endIndex).reverse();
  }

  async getEdgesAfterId(leftId: string, { after, first }: EdgeAfterFirst) {
    const offset = parseInt(after, 32) + 1;
    const start = offset || 0;

    return this.edges[leftId].slice(start, start + first);
  }

  async getEdgesBeforeId(leftId: string, { before, last }: EdgeBeforeLast) {
    const length = this.edges[leftId].length;
    const offset = parseInt(before, 32);
    const endIndex = length - (length - offset);
    const startIndex = endIndex - (last || 0);

    return this.edges[leftId].slice(startIndex, endIndex).reverse();
  }
}
