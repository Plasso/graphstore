/* @flow */

export default class EdgeRegistry {
  names: {[name: string]: EdgeT };
  static names = {};
  static register(edge: EdgeT) {
    this.names[edge.getName()] = edge;
  }

  getEdgeByName(name: string) {
    return this.names[name];
  }
}
