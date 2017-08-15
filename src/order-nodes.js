export default function orderNodes(ids, nodes) {
  const idMap = {};
  const orderedNodes = [];

  ids.forEach((id, idx) => {
    idMap[id] = idx;
    orderedNodes[idx] = null;
  });

  nodes.forEach((node) => {
    if (node) {
      orderedNodes[idMap[node.id]] = node;
    }
  });

  return orderedNodes;
}

