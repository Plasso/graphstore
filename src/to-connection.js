/* @flow */

export default async function toConnection(node: NodeT, edges: EdgesT, reverse: boolean = false) {
  const hasNextPage = reverse ? false : edges.hasNextPage;
  const hasPreviousPage = reverse ? edges.hasNextPage : false;
  const nodeIds = edges.edges.map((edge) => edge.nodeId);
  const nodes = await node.read(nodeIds);
  const connectionEdges = nodes.map((node, idx) => {
    if (edges.edges[idx] == null) {
      return null;
    }
    return {
      cursor: edges.edges[idx].id.toString(32),
      node,
    };
  });

  return { hasNextPage, hasPreviousPage, edges: connectionEdges };
}
