export const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const initializeNodes = (node, parentId = null) => {
  if (typeof node !== 'object' || node === null) {
    console.error("InitializeNodes received invalid node data:", node);
    return { 
      id: generateUUID(), name: "Error: Invalid Node Data", 
      description: "The original data provided to initialize this node was not a valid object.", 
      children: [], isLocked: false, importance: 'common',
      _changeStatus: 'unchanged'
    };
  }

  const isPlaceholderId = typeof node.id === 'string' && ['NEW_NODE', 'NEW_NODE_ROOT_WRAPPER'].includes(node.id);
  const newId = (typeof node.id === 'string' && node.id && !isPlaceholderId) ? node.id : generateUUID();
  
  let newName = (typeof node.name === 'string' && node.name.trim()) 
                ? node.name.trim().substring(0, 100) 
                : `Unnamed Node ${newId.substring(0,4)}`;
  
  const newDescription = (typeof node.description === 'string') 
                         ? node.description.substring(0, 500) 
                         : "";

  const newNode = {
    id: newId,
    name: newName,
    description: newDescription,
    isLocked: typeof node.isLocked === 'boolean' ? node.isLocked : false,
    importance: (typeof node.importance === 'string' && ['minor', 'common', 'major'].includes(node.importance)) 
              ? node.importance 
              : 'common',
    children: [], 
    linkedProjectId: node.linkedProjectId || null, 
    linkedProjectName: node.linkedProjectName || null, 
    _changeStatus: node._changeStatus || 'unchanged', 
    _modificationDetails: node._modificationDetails || [],
    _oldParentId: node._oldParentId, 
  };

  if (Array.isArray(node.children)) {
    newNode.children = node.children
      .filter(child => typeof child === 'object' && child !== null) 
      .map(child => initializeNodes(child, newNode.id));
  } else if (node.children !== undefined && node.children !== null) {
     // console.warn(`Node "${newNode.name}" (ID: ${newNode.id}) has non-array 'children' property. Treating as empty. Children:`, node.children);
  }
  
  return newNode;
};

export const findNodeById = (node, id) => {
  if (!node) return null;
  if (node.id === id) return node;
  if (node.children) {
    for (const child of node.children) {
      const found = findNodeById(child, id);
      if (found) return found;
    }
  }
  return null;
};

export const updateNodeInTree = (
  rootNode, 
  nodeId,
  updates 
) => {
  let hasChangedOverall = false;

  function updateRecursive(node) {
    let currentHasChanged = false;
    let newChildrenArray = node.children; 

    if (node.id === nodeId) {
      const updatedNodeShallow = { ...node }; 
      for (const key in updates) {
        if (Object.prototype.hasOwnProperty.call(updates, key)) {
          const typedKey = key;
          if (updatedNodeShallow[typedKey] !== updates[typedKey]) {
            updatedNodeShallow[typedKey] = updates[typedKey];
            currentHasChanged = true;
          }
        }
      }
      if (currentHasChanged) {
        hasChangedOverall = true;
        return updatedNodeShallow; 
      }
      return node; 
    }

    if (Array.isArray(node.children) && node.children.length > 0) {
      let childrenChangedInMap = false;
      const mappedChildren = node.children.map(child => {
        const updatedChild = updateRecursive(child);
        if (updatedChild !== child) childrenChangedInMap = true; 
        return updatedChild;
      });

      if (childrenChangedInMap) {
        hasChangedOverall = true;
        newChildrenArray = mappedChildren;
        return { ...node, children: newChildrenArray }; 
      }
    }
    return node; 
  }
  
  const potentiallyUpdatedRoot = updateRecursive(rootNode);
  return hasChangedOverall ? potentiallyUpdatedRoot : rootNode;
};

export const addNodeToParent = (
  rootNode,
  parentId,
  newNodeName,
  newNodeDescription 
) => {
  const newActualNode = initializeNodes({ 
    name: newNodeName.trim() || "New Node",
    description: newNodeDescription?.trim() || "" 
  });

  let parentFoundAndModified = false;

  function addChildRecursive(node) {
    if (node.id === parentId) {
      parentFoundAndModified = true;
      const newChildren = [...(node.children || []), newActualNode];
      return { ...node, children: newChildren };
    }
    if (Array.isArray(node.children) && node.children.length > 0) {
      let childrenChanged = false;
      const newMappedChildren = node.children.map(child => {
        const updatedChild = addChildRecursive(child);
        if (updatedChild !== child) childrenChanged = true;
        return updatedChild;
      });
      if (childrenChanged) {
         return { ...node, children: newMappedChildren };
      }
    }
    return node;
  }
  const updatedRoot = addChildRecursive(rootNode);
  return parentFoundAndModified ? updatedRoot : rootNode;
};

export const getLockedNodeIds = (node) => {
    if (!node) return [];
    let ids = [];
    function recurse(currentNode) {
        if (currentNode.isLocked && currentNode.id) ids.push(currentNode.id);
        currentNode.children?.forEach(recurse);
    }
    recurse(node);
    return ids;
};

const applyToAllNodes = (node, updateFn) => {
  const updatedPart = updateFn(node); 
  let childrenChanged = false;
  let newChildren = node.children;

  if (Array.isArray(node.children) && node.children.length > 0) {
    const mappedChildren = node.children.map(child => applyToAllNodes(child, updateFn));
    if (mappedChildren.some((child, idx) => child !== node.children[idx])) {
        childrenChanged = true;
        newChildren = mappedChildren;
    }
  }

  if (Object.keys(updatedPart).length > 0 || childrenChanged) {
      return { ...node, ...updatedPart, children: newChildren };
  }
  return node; 
};

export const lockAllNodesInTree = (node) => applyToAllNodes(node, () => ({ isLocked: true }));
export const unlockAllNodesInTree = (node) => applyToAllNodes(node, () => ({ isLocked: false }));

export const areAllNodesLocked = (rootNode) => {
  if (!rootNode) return true; 
  function recurse(node) {
    if (!node.isLocked) return false;
    return node.children?.every(recurse) ?? true; 
  }
  return recurse(rootNode);
};

export const areAllNodesExpanded = (rootNode, collapsedIds) => {
    if (!rootNode) return true; 
    const expandableNodes = getAllExpandableNodeIds(rootNode);
    if (expandableNodes.length === 0) return true; 
    return expandableNodes.every(nodeId => !collapsedIds.has(nodeId));
};

export const getAllNodesAsMap = (node, parentId = null) => {
  const map = new Map();
  function recurse(currentNode, currentParentId) {
    if (!currentNode || typeof currentNode !== 'object' || typeof currentNode.id !== 'string') return; 
    map.set(currentNode.id, { ...currentNode, _parentId: currentParentId });
    currentNode.children?.forEach(child => recurse(child, currentNode.id));
  }
  recurse(node, parentId);
  return map;
};

export const countNodesInTree = (node) => {
  if (!node) return 0;
  return 1 + (node.children?.reduce((sum, child) => sum + countNodesInTree(child), 0) ?? 0);
};

export const compareAndAnnotateTree = (
  currentTree,
  suggestionTreeInput 
) => {
  const initializedSuggestionTree = initializeNodes(suggestionTreeInput); 
  const currentNodesMap = getAllNodesAsMap(currentTree);
  const suggestionNodesMap = getAllNodesAsMap(initializedSuggestionTree); 

  const result = {
    annotatedTree: { ...initializedSuggestionTree }, 
    removedNodes: [], newNodes: [], modifiedContentNodes: [],
    lockedContentChangedNodes: [], structureModifiedNodes: [], reparentedNodes: [],
  };

  currentNodesMap.forEach((cNode, id) => {
     if (!suggestionNodesMap.has(id)) { 
        result.removedNodes.push({...cNode, _changeStatus: 'removed', _modificationDetails: ['Node removed from tree.']});
     }
  });

  function annotateNodeRecursive(sNode, sParentIdInSuggestion) {
    const annotatedSNode = { 
      ...sNode, 
      _modificationDetails: sNode._modificationDetails ? [...sNode._modificationDetails] : [], 
      children: Array.isArray(sNode.children) ? [...sNode.children] : [] 
    };
    
    const cNodeData = currentNodesMap.get(sNode.id);
    let primaryChangeType = sNode._changeStatus || 'unchanged'; 
    const details = annotatedSNode._modificationDetails || [];

    if (!cNodeData) { 
      primaryChangeType = 'new';
      details.push('Newly added node.');
      if (!result.newNodes.find(n => n.id === annotatedSNode.id)) result.newNodes.push(annotatedSNode);
    } else { 
      if (cNodeData._parentId !== sParentIdInSuggestion) {
        primaryChangeType = 'reparented';
        annotatedSNode._oldParentId = cNodeData._parentId;
        details.push(`Moved (Parent changed from ${cNodeData._parentId || 'root'} to ${sParentIdInSuggestion || 'root'}).`);
        if (!result.reparentedNodes.find(n => n.id === annotatedSNode.id)) result.reparentedNodes.push(annotatedSNode);
      }

      const contentChanged = cNodeData.name !== sNode.name || 
                             cNodeData.description !== sNode.description ||
                             cNodeData.importance !== sNode.importance ||
                             (cNodeData.linkedProjectId || null) !== (sNode.linkedProjectId || null) ||
                             (cNodeData.linkedProjectName || null) !== (sNode.linkedProjectName || null);

      if (contentChanged) {
        const addDetail = (type, from, to, label) => details.push({ type, from, to, label });
        
        if (cNodeData.isLocked) { 
          primaryChangeType = primaryChangeType === 'reparented' ? 'reparented' : 'locked_content_changed'; 
          addDetail('critical', null, 'Content of a locked node was modified by the AI.', 'CRITICAL');
          if (!result.lockedContentChangedNodes.find(n => n.id === annotatedSNode.id)) result.lockedContentChangedNodes.push(annotatedSNode);
        } else { 
          primaryChangeType = primaryChangeType === 'reparented' ? 'reparented' : 'content_modified';
          if (cNodeData.name !== sNode.name) addDetail('name', cNodeData.name, sNode.name, 'Name');
          if (cNodeData.description !== sNode.description) addDetail('description', cNodeData.description, sNode.description, 'Description');
          if (cNodeData.importance !== sNode.importance) addDetail('importance', cNodeData.importance || 'common', sNode.importance || 'common', 'Importance');
          if ((cNodeData.linkedProjectId || null) !== (sNode.linkedProjectId || null)) {
             addDetail('link', cNodeData.linkedProjectName || 'None', sNode.linkedProjectName || 'None', 'Link');
          }
          if (!result.modifiedContentNodes.find(n => n.id === annotatedSNode.id)) result.modifiedContentNodes.push(annotatedSNode);
        }
      }
      
      const cChildrenIds = cNodeData.children?.map(c => c.id).sort().join(',') || '';
      const sChildrenIds = sNode.children?.map(s_child => s_child.id).sort().join(',') || '';
      if (cChildrenIds !== sChildrenIds) {
        if (primaryChangeType === 'unchanged' || (primaryChangeType === 'reparented' && !contentChanged)) {
             primaryChangeType = 'structure_modified';
        }
        details.push(`Children list or order changed.`);
        if (primaryChangeType === 'structure_modified' && !result.structureModifiedNodes.find(n => n.id === annotatedSNode.id)) {
             result.structureModifiedNodes.push(annotatedSNode);
        }
      }
    }
    annotatedSNode._changeStatus = primaryChangeType;
    annotatedSNode._modificationDetails = Array.from(new Set(details));


    if (Array.isArray(sNode.children) && sNode.children.length > 0) {
      annotatedSNode.children = sNode.children.map(child => annotateNodeRecursive(child, sNode.id));
    }
    
    return annotatedSNode;
  }

  result.annotatedTree = annotateNodeRecursive(initializedSuggestionTree, null);
  return result;
};

export const filterTree = (node, searchTerm) => {
  if (!node) return null;
  const lowerSearchTerm = searchTerm.toLowerCase().trim();
  if (!lowerSearchTerm) return node; 

  const nameMatch = node.name.toLowerCase().includes(lowerSearchTerm);
  const descriptionMatch = node.description?.toLowerCase().includes(lowerSearchTerm) ?? false;
  const importanceMatch = node.importance?.toLowerCase().includes(lowerSearchTerm) ?? false;

  const filteredChildren = (node.children ?? [])
      .map(child => filterTree(child, searchTerm)) 
      .filter((child) => child !== null); 

  if (nameMatch || descriptionMatch || importanceMatch || filteredChildren.length > 0) {
    return { ...node, children: filteredChildren };
  }
  return null;
};

export const findNodesByTerm = (rootNode, searchTerm) => {
  const results = [];
  if (!rootNode || !searchTerm.trim()) return results;
  const lowerSearchTerm = searchTerm.toLowerCase();

  function recurse(node) {
    if (node.name.toLowerCase().includes(lowerSearchTerm) ||
        node.description?.toLowerCase().includes(lowerSearchTerm) ||
        node.importance?.toLowerCase().includes(lowerSearchTerm)) {
      results.push(node);
    }
    node.children?.forEach(recurse);
  }
  recurse(rootNode);
  return results;
};

export const getAllExpandableNodeIds = (node) => {
  const ids = [];
  if (!node) return ids;
  function recurse(currentNode) {
    if (Array.isArray(currentNode.children) && currentNode.children.length > 0 && currentNode.id) {
      ids.push(currentNode.id);
      currentNode.children.forEach(recurse); 
    }
  }
  recurse(node);
  return ids;
};

export const getAllDescendantNodeIds = (rootNode, parentNodeId) => {
  const ids = [];
  if (!rootNode) return ids;

  const parentNode = findNodeById(rootNode, parentNodeId);
  if (!parentNode) return ids;

  function recurse(currentNode) {
    currentNode.children?.forEach(child => {
      ids.push(child.id); 
      recurse(child);    
    });
  }

  recurse(parentNode); 
  return ids;
};

export const removeNodeAndChildrenFromTree = (rootNode, nodeIdToRemove) => {
  if (!rootNode) return null;
  if (rootNode.id === nodeIdToRemove) return null; 

  function filterRecursive(node) {
    if (node.id === nodeIdToRemove) return null; 

    let newChildren = undefined;
    if (Array.isArray(node.children) && node.children.length > 0) {
      const filtered = node.children
        .map(child => filterRecursive(child))
        .filter((child) => child !== null); 
      
      if (filtered.length !== node.children.length || filtered.some((child, idx) => child.id !== node.children[idx].id)) {
        newChildren = filtered.length > 0 ? filtered : null; 
      } else {
        newChildren = node.children; 
      }
    } else {
      newChildren = node.children; 
    }

    if (newChildren !== node.children) {
      return { ...node, children: newChildren };
    }
    return node;
  }

  return filterRecursive(rootNode);
};

export const getTreeDepth = (node) => {
  if (!node) return 0;
  if (!node.children || node.children.length === 0) return 1;
  return 1 + Math.max(...node.children.map(child => getTreeDepth(child)));
};

export const countNodesByImportance = (node) => {
  const counts = { minor: 0, common: 0, major: 0 };
  if (!node) return counts;

  function recurse(currentNode) {
    counts[currentNode.importance || 'common']++;
    currentNode.children?.forEach(recurse);
  }
  recurse(node);
  return counts;
};

export const getAncestorIds = (nodeId, tree) => {
  if (!tree || !nodeId) return [];
  const path = [];
  
  function findPath(currentNode, targetId, currentPath) {
    if (currentNode.id === targetId) return true; 

    if (currentNode.children) {
      for (const child of currentNode.children) {
        if (findPath(child, targetId, currentPath)) {
          currentPath.unshift(currentNode.id); 
          return true;
        }
      }
    }
    return false;
  }
  findPath(tree, nodeId, path);
  return path; 
};