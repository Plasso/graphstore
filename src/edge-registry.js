/* @flow */

export default class EdgeRegistry {
  names: {[name: string]: { edge: EdgeT, node: NodeT} };
  static types = {};
  static register(edge: EdgeT, node: NodeT) {
    this.names[edge.getName()] = { edge, node };
  }

  getNodeAndEdgeByName(name: string) {
    return this.names[name];
  }
}
