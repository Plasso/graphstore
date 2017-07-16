/* @flow */
import type Node from './node';

export default class NodeFetcher {
  types: {[type: string]: Node };
  static types = {};
  static register(node: Node) {
    const nodeType = node.getNodeType();
    this.types[nodeType] = node;
  }

  static getNodeByType(type: string) {
    return this.types[type];
  }
}
