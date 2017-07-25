/* @flow */

export default class MemoryEdge implements EdgeT {
  name: string;
  nodeName: string;
  forward: boolean;
  id: number;
  edges: { [leftId: string]: Array<EdgeDataT> };

  constructor(name: string, nodeName: string, options: { forward?: boolean } = {}) {
    this.name = name;
    this.nodeName = nodeName;
    this.edges = {};
    this.forward = options.forward !== false;
    this.id = 0;
  }

  getName() {
    return this.name;
  }

  getNodeName() {
    return this.nodeName;
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

  async delete(leftId: string, id: number) {
    const index = this.edges[leftId].findIndex((edge) => edge.id === id);
    this.edges[leftId].splice(index, 1);
  }
}
