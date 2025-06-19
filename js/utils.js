<<<<<<< SEARCH
export const getAncestorIds = (nodeId, tree) => {
  if (!tree || !nodeId) return [];
  const nodeMap = getAllNodesAsMap(tree);
  const ancestors = [];
  
  const startNode = nodeMap.get(nodeId);
  if (!startNode) {
    return []; // Node not in tree
  }
  
  // Start walking up from the node's parent.
  let currentId = startNode._parentId;

  while (currentId) {
    const node = nodeMap.get(currentId);
    if (node) {
      ancestors.unshift(node.id); // Add parent ID to the start of the array
      currentId = node._parentId;
    } else {
      break; // Should not happen in a consistent tree
    }
  }
  
  return ancestors; 
};
=======
export const getAncestorIds = (nodeId, tree) => {
  if (!tree || !nodeId) return [];
  const nodeMap = getAllNodesAsMap(tree);
  const ancestors = [];
  
  const startNode = nodeMap.get(nodeId);
  if (!startNode) {
    return []; // Node not in tree
  }
  
  // Start walking up from the node's parent.
  let currentId = startNode._parentId;

  while (currentId) {
    const node = nodeMap.get(currentId);
    if (node) {
      ancestors.unshift(node.id); // Add parent ID to the start of the array
      currentId = node._parentId;
    } else {
      break; // Should not happen in a consistent tree
    }
  }
  
  return ancestors; 
};
>>>>>>> REPLACE
