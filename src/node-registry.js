/* @flow */

export default class NodeRegistry {
  names: {[name: string]: NodeT };
  static names = {};
  static register(node: NodeT) {
    this.types[node.getName()] = node;
  }

  static getNodeTypeByName(name: string) {
    return this.names[name];
  }
}
