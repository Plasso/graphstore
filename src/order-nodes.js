export default function orderNodes(ids, nodes) {
  const idMap = {};
  const orderedNodes = [];

  ids.forEach((id, idx) => { idMap[id] = idx; });

  nodes.forEach((node) => { orderedNodes[idMap[node.id]] = node; });

  return orderedNodes;
}

