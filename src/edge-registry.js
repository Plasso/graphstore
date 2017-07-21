/* @flow */

export default class EdgeRegistry {
  names: {[name: string]: { edge: EdgeT, node: NodeT} };
  static names = {};
  static register(edge: EdgeT, node: NodeT) {
    this.names[edge.getName()] = { edge, node };
  }

  getNodeAndEdgeByName(name: string) {
    return this.names[name];
  }
}
