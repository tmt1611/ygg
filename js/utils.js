import { v4 as uuidv4 } from 'uuid';
import { select } from 'd3';

export const generateUUID = () => uuidv4();

export const initializeNodes = (node, parentId = null) => {
  if (typeof node !== 'object' || node === null) {
    // If the input is not a valid object, return null. This prevents errors from malformed
    // `children` arrays, e.g., [{}, null, {}]. The caller should filter out nulls.
    console.warn("initializeNodes received invalid input, returning null. Input:", node);
    return null;
  }
  
  // Assign a new UUID if the node has no ID or has the placeholder ID from AI.
  const newId = (!node.id || node.id === 'NEW_NODE') ? generateUUID() : node.id;
  
  const newNode = {
    // Start with a clean slate of defaults to guarantee all fields exist.
    id: newId,
    name: "Untitled Node",
    description: "",
    isLocked: false,
    importance: 'common',
    children: [],
    linkedProjectId: null,
    linkedProjectName: null,
    _parentId: parentId,
    // Safely spread the provided node properties.
    ...node,
    // Re-validate and sanitize critical properties after spreading,
    // ensuring they have the correct type and fallbacks.
    id: newId, // Ensure the ID is not overwritten by the spread.
    name: (typeof node.name === 'string' && node.name.trim()) ? node.name.trim() : "Untitled Node",
    description: typeof node.description === 'string' ? node.description : "",
    isLocked: typeof node.isLocked === 'boolean' ? node.isLocked : false,
    importance: ['minor', 'common', 'major'].includes(node.importance) ? node.importance : 'common',
    linkedProjectId: node.linkedProjectId || null,
    linkedProjectName: node.linkedProjectName || null,
  };
  
  // Recursively initialize children, ensuring it's an array and filtering out any nulls.
  if (Array.isArray(node.children)) {
    newNode.children = node.children
      .map(child => initializeNodes(child, newNode.id))
      .filter(Boolean); // Filter out any null children resulting from invalid input.
  } else {
    newNode.children = [];
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

export const getAllNodesAsMap = (tree) => {
  const nodeMap = new Map();
  const traverse = (node, parentId = null) => {
    if (!node) return;
    const nodeWithParent = { ...node, _parentId: parentId };
    nodeMap.set(node.id, nodeWithParent);
    if (node.children) {
      node.children.forEach(child => traverse(child, node.id));
    }
  };
  traverse(tree);
  return nodeMap;
};

export const updateNodeInTree = (node, nodeId, updates) => {
  if (!node) return null;
  if (node.id === nodeId) {
    return { ...node, ...updates };
  }
  if (node.children) {
    return { ...node, children: node.children.map(child => updateNodeInTree(child, nodeId, updates)) };
  }
  return node;
};

export const addNodeToParent = (tree, parentId, newNodeName, newNodeDescription) => {
    const addRecursively = (node) => {
        if (node.id === parentId) {
            const newNode = initializeNodes({
                id: 'NEW_NODE', name: newNodeName, description: newNodeDescription,
                isLocked: false, importance: 'common', children: []
            }, node.id);
            return { ...node, children: [...(node.children || []), newNode] };
        }
        if (node.children) {
            return { ...node, children: node.children.map(child => addRecursively(child)) };
        }
        return node;
    };

    if (!parentId) parentId = tree.id;
    return addRecursively(tree);
};

export const removeNodeAndChildrenFromTree = (tree, nodeIdToRemove) => {
    if (!tree) return null;
    if (tree.id === nodeIdToRemove) {
      // This case should ideally not happen for the root, but as a safeguard:
      console.warn("Attempted to remove the root node. Operation aborted.");
      return tree;
    }
    const removeRecursively = (node) => {
        if (!node.children) return node;
        const newChildren = node.children
            .filter(child => child.id !== nodeIdToRemove)
            .map(child => removeRecursively(child));
        return { ...node, children: newChildren };
    };
    return removeRecursively(tree);
};

export const updateAllChildren = (tree, parentId, updates) => {
    const updateRecursively = (node) => {
        if (node.id === parentId) {
            if (!node.children || node.children.length === 0) return node;
            const updatedChildren = node.children.map(child => ({ ...child, ...updates }));
            return { ...node, children: updatedChildren };
        }
        if (node.children) {
            return { ...node, children: node.children.map(child => updateRecursively(child)) };
        }
        return node;
    };
    return updateRecursively(tree);
};

export const deleteAllChildren = (tree, parentId) => {
    return updateNodeInTree(tree, parentId, { children: [] });
};

export const lockAllNodesInTree = (tree) => {
    const lockRecursively = (node) => {
        const lockedNode = { ...node, isLocked: true };
        if (lockedNode.children) {
            lockedNode.children = lockedNode.children.map(lockRecursively);
        }
        return lockedNode;
    };
    return lockRecursively(tree);
};

export const unlockAllNodesInTree = (tree) => {
    const unlockRecursively = (node) => {
        const unlockedNode = { ...node, isLocked: false };
        if (unlockedNode.children) {
            unlockedNode.children = unlockedNode.children.map(unlockRecursively);
        }
        return unlockedNode;
    };
    return unlockRecursively(tree);
};

export const areAllNodesLocked = (tree) => {
    let allLocked = true;
    const checkRecursively = (node) => {
        if (!node.isLocked) {
            allLocked = false;
        }
        if (allLocked && node.children) {
            for (const child of node.children) {
                checkRecursively(child);
                if (!allLocked) break;
            }
        }
    };
    checkRecursively(tree);
    return allLocked;
};

export const getLockedNodeIds = (tree) => {
    const lockedIds = [];
    const findLocked = (node) => {
        if (node.isLocked) {
            lockedIds.push(node.id);
        }
        if (node.children) {
            node.children.forEach(findLocked);
        }
    };
    findLocked(tree);
    return lockedIds;
};

export const countNodesInTree = (node) => {
  if (!node) return 0;
  let count = 1;
  if (node.children) {
    count += node.children.reduce((acc, child) => acc + countNodesInTree(child), 0);
  }
  return count;
};

export const countNodesByImportance = (tree) => {
    const counts = { minor: 0, common: 0, major: 0 };
    const traverse = (node) => {
        if (node) {
            const importance = node.importance || 'common';
            if (counts[importance] !== undefined) {
                counts[importance]++;
            }
            if (node.children) {
                node.children.forEach(traverse);
            }
        }
    };
    traverse(tree);
    return counts;
};


export const getTreeDepth = (node) => {
    if (!node || !node.children || node.children.length === 0) {
        return 1;
    }
    return 1 + Math.max(...node.children.map(getTreeDepth));
};

export const filterTree = (node, searchTerm) => {
    if (!searchTerm?.trim()) return node;
    const lowerCaseSearchTerm = searchTerm.toLowerCase();

    const matches = (n) => 
        n.name.toLowerCase().includes(lowerCaseSearchTerm) || 
        (n.description && n.description.toLowerCase().includes(lowerCaseSearchTerm));
    
    if (matches(node)) return node; 

    if (node.children) {
        const filteredChildren = node.children
            .map(child => filterTree(child, searchTerm))
            .filter(child => child !== null);
        
        if (filteredChildren.length > 0) {
            return { ...node, children: filteredChildren };
        }
    }
    
    return null;
};

export const getAncestorIds = (nodeId, tree) => {
  if (!tree || !nodeId) return [];
  const nodeMap = getAllNodesAsMap(tree);
  const ancestors = [];
  const visitedIds = new Set(); // To detect cycles
  
  const startNode = nodeMap.get(nodeId);
  if (!startNode) {
    return []; // Node not in tree
  }
  
  // Start walking up from the node's parent.
  let currentId = startNode._parentId;

  while (currentId) {
    if (visitedIds.has(currentId)) {
      console.error("Cycle detected in parent hierarchy starting from node ID:", nodeId, "at cycle ID:", currentId);
      break; // Break the loop to prevent infinite recursion
    }
    visitedIds.add(currentId);

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

export const getNodePathString = (nodeId, tree) => {
    if (!tree || !nodeId) return "";
    const nodeMap = getAllNodesAsMap(tree);
    const ancestorIds = getAncestorIds(nodeId, tree);

    const pathNames = ancestorIds.map(id => nodeMap.get(id)?.name).filter(Boolean);
    
    const currentNode = nodeMap.get(nodeId);
    if (currentNode) {
        pathNames.push(currentNode.name);
    }

    return pathNames.join(' / ');
};

export const getAllExpandableNodeIds = (node) => {
    let ids = new Set();
    const traverse = (n) => {
        if (n && n.children && n.children.length > 0) {
            ids.add(n.id);
            n.children.forEach(traverse);
        }
    };
    traverse(node);
    return Array.from(ids);
};

export const areAllNodesExpanded = (node, collapsedNodeIds) => {
    if (!node) return true;
    const expandableIds = getAllExpandableNodeIds(node);
    return expandableIds.every(id => !collapsedNodeIds.has(id));
};

export const isValidTechTreeNodeShape = (node) => {
    if (typeof node !== 'object' || node === null) return false;
    // A node is structurally valid if it has a name.
    // We are lenient on `children` because a leaf node might be missing it, and `initializeNodes` will add an empty array.
    const hasName = typeof node.name === 'string' && node.name.trim() !== '';

    // If children exist, they must be an array and their contents must be valid.
    if (node.children) {
        if (!Array.isArray(node.children)) return false;
        return hasName && node.children.every(isValidTechTreeNodeShape);
    }

    return hasName; // It's a valid leaf node if it has a name.
};

export const reinitializeNodeIds = (node, newParentId = null) => {
  if (!node) return null;
  // Create a new ID for the current node
  const newId = generateUUID();
  
  // Create a new node object with the new ID, parent ID, and all defaults.
  // This ensures that pasted nodes are fully compliant with the app's data structure.
  const newNode = {
    ...node, // Keep any other properties from the paste
    id: newId,
    _parentId: newParentId,
    name: node.name || "Pasted Node",
    description: node.description ?? "",
    isLocked: node.isLocked ?? false,
    importance: ['minor', 'common', 'major'].includes(node.importance) ? node.importance : 'common',
    children: Array.isArray(node.children) ? node.children : [],
    linkedProjectId: node.linkedProjectId ?? null, // Preserve links if they exist, but they might be invalid in the new context.
    linkedProjectName: node.linkedProjectName ?? null,
  };
  
  // If there are children, recursively call this function for each child,
  // passing the new ID of the current node as their new parent ID.
  if (newNode.children.length > 0) {
    newNode.children = newNode.children.map(child => reinitializeNodeIds(child, newId));
  }
  
  return newNode;
};

export const addPastedNodeToParent = (tree, parentId, nodeToPaste) => {
    // First, create a deep copy of the node to paste with all new IDs
    const reinitializedNode = reinitializeNodeIds(nodeToPaste, parentId);

    const addRecursively = (node) => {
        if (node.id === parentId) {
            return {
                ...node,
                children: [...(node.children || []), reinitializedNode]
            };
        }
        if (node.children) {
            return { ...node, children: node.children.map(child => addRecursively(child)) };
        }
        return node;
    };
    return addRecursively(tree);
};

export const downloadObjectAsJson = (exportObj, exportName) => {
  const jsonStr = JSON.stringify(exportObj, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = exportName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const cleanTreeForExport = (nodeToClean) => {
    if (!nodeToClean) return null;
    const { _parentId, _changeStatus, _modificationDetails, _oldParentId, ...rest } = nodeToClean;
    const cleanedNode = { ...rest };
    if (cleanedNode.children && Array.isArray(cleanedNode.children)) {
        cleanedNode.children = cleanedNode.children.map(cleanTreeForExport);
    }
    return cleanedNode;
};

export const cleanTreeForState = (nodeToClean) => {
    if (!nodeToClean) return null;
    // This function specifically removes annotation properties but keeps internal ones like _parentId and temporary status for highlighting.
    const { _modificationDetails, _oldParentId, ...rest } = nodeToClean;
    const cleanedNode = { ...rest };
    if (cleanedNode.children && Array.isArray(cleanedNode.children)) {
        cleanedNode.children = cleanedNode.children.map(cleanTreeForState);
    }
    return cleanedNode;
};

// wrapSvgText has been removed in favor of using <foreignObject> for more robust text wrapping.

export const compareAndAnnotateTree = (originalTree, modifiedTree) => {
    if (!originalTree) {
        const markAllNew = (node) => {
            if (!node) return null;
            const newNode = { ...node, _changeStatus: 'new', _modificationDetails: [{label: 'Status', type: 'critical', to: 'Newly created node'}] };
            if (newNode.children) {
                newNode.children = newNode.children.map(markAllNew);
            }
            return newNode;
        };
        const annotated = markAllNew(modifiedTree);
        return {
            annotatedTree: annotated,
            removedNodes: [],
            newNodes: annotated ? [...getAllNodesAsMap(annotated).values()] : [],
            modifiedContentNodes: [],
            lockedContentChangedNodes: [],
            structureModifiedNodes: [],
            reparentedNodes: [],
            lockedNodesRemoved: []
        };
    }
    const originalNodesMap = getAllNodesAsMap(originalTree);
    // We only need the modified map to check for new parents, not for the main loop.
    const modifiedNodesMap = getAllNodesAsMap(modifiedTree);

    const removedNodes = [];
    const newNodes = [];
    const modifiedContentNodes = [];
    const lockedContentChangedNodes = [];
    const structureModifiedNodes = [];
    const reparentedNodes = [];
    const lockedNodesRemoved = [];

    originalNodesMap.forEach((originalNode, id) => {
        if (!modifiedNodesMap.has(id)) {
            removedNodes.push(originalNode);
            if (originalNode.isLocked) {
                lockedNodesRemoved.push(originalNode);
            }
        }
    });

    const annotateRecursively = (modNode) => {
        if (!modNode) return null;
        
        // This is the definitive check for a new node.
        if (!originalNodesMap.has(modNode.id)) {
            const newNode = { ...modNode, _changeStatus: 'new', _modificationDetails: [{label: 'Status', type: 'critical', to: 'Newly created node'}] };
            newNodes.push(newNode);
            // If the parent is new, all its children must also be new.
            if (newNode.children) {
                newNode.children = newNode.children.map(child => annotateRecursively(child));
            }
            return newNode;
        }

        // If we reach here, the node existed before.
        const originalNode = originalNodesMap.get(modNode.id);
        const modDetails = [];
        
        let status = 'unchanged';
        let contentModified = false;
        let structureModified = false;

        if (originalNode.isLocked) {
            if (originalNode.name !== modNode.name) { modDetails.push({label: 'Name', from: originalNode.name, to: modNode.name, type: 'critical'}); }
            if (originalNode.description !== modNode.description) { modDetails.push({label: 'Description', from: originalNode.description, to: modNode.description, type: 'critical'}); }
            if (originalNode.importance !== modNode.importance) { modDetails.push({label: 'Importance', from: originalNode.importance, to: modNode.importance, type: 'critical'}); }
            if (modDetails.length > 0) {
                status = 'locked_content_changed';
                lockedContentChangedNodes.push(modNode);
            }
        } else {
             if (originalNode.name !== modNode.name) {
                modDetails.push({label: 'Name', from: originalNode.name, to: modNode.name});
                contentModified = true;
            }
            if (originalNode.description !== modNode.description) {
                modDetails.push({label: 'Description', from: originalNode.description, to: modNode.description});
                contentModified = true;
            }
            if (originalNode.importance !== modNode.importance) {
                modDetails.push({label: 'Importance', from: originalNode.importance, to: modNode.importance});
                contentModified = true;
            }
            if (originalNode.linkedProjectId !== modNode.linkedProjectId || originalNode.linkedProjectName !== modNode.linkedProjectName) {
                modDetails.push({label: 'Link', from: originalNode.linkedProjectName || '(none)', to: modNode.linkedProjectName || '(none)'});
                contentModified = true;
            }
        }

        if (contentModified && status !== 'locked_content_changed') {
            status = 'content_modified';
            modifiedContentNodes.push(modNode);
        }

        const originalChildrenIds = (originalNode.children || []).map(c => c.id).sort();
        const modifiedChildrenIds = (modNode.children || []).map(c => c.id).sort();

        if (originalChildrenIds.join(',') !== modifiedChildrenIds.join(',')) {
            if (status === 'unchanged') status = 'structure_modified'; 
            structureModified = true;
            structureModifiedNodes.push(modNode);
        }
        
        if (originalNode._parentId !== modNode._parentId) {
            const oldParent = originalNodesMap.get(originalNode._parentId);
            const newParent = modifiedNodesMap.get(modNode._parentId);
            modDetails.push({label: 'Parent', from: oldParent?.name || 'Root', to: newParent?.name || 'Root' });
            if (status === 'unchanged') status = 'reparented';
            reparentedNodes.push(modNode);
        }
        
        const annotatedNode = {
            ...modNode,
            _changeStatus: status,
            _modificationDetails: modDetails,
            _oldParentId: originalNode._parentId,
        };

        if (annotatedNode.children) {
            annotatedNode.children = annotatedNode.children.map(child => annotateRecursively(child));
        }

        return annotatedNode;
    };
    
    const annotatedTree = annotateRecursively(modifiedTree);
    
    return {
        annotatedTree,
        removedNodes,
        newNodes,
        modifiedContentNodes,
        lockedContentChangedNodes,
        structureModifiedNodes,
        reparentedNodes,
        lockedNodesRemoved,
    };
};