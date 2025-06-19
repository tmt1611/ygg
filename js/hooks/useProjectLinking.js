
import { useCallback } from 'react';
import { findNodeById, updateNodeInTree, getAllNodesAsMap } from '../utils.js';

export const useProjectLinking = ({
  techTreeData,
  setTechTreeData,
  projectManager,
  modalManager,
  historyManager,
  viewStates,
  yggdrasilViewMode, 
  activeOverlayPanel, 
}) => {
  const { projects, activeProjectId: currentActiveProjectIdFromPM, handleSaveActiveProject, updateProjectData } = projectManager;
  const { openLinkProjectModal, closeLinkProjectModal } = modalManager;
  const { addHistoryEntry } = historyManager;

  const findLinkSource = useCallback((targetProjectId, allProjects) => {
    if (!targetProjectId) return null;
    for (const project of allProjects) {
      if (project.id === targetProjectId || !project.treeData) continue; 

      const nodesMap = getAllNodesAsMap(project.treeData);
      for (const node of nodesMap.values()) {
        if (node.linkedProjectId === targetProjectId) {
          return {
            sourceProjectId: project.id,
            sourceProjectName: project.name,
            sourceNodeId: node.id,
            sourceNodeName: node.name,
          };
        }
      }
    }
    return null;
  }, []);

  const handleOpenLinkProjectModal = useCallback((sourceNodeId) => {
    const sourceNode = findNodeById(techTreeData, sourceNodeId);
    if (!sourceNode) return;
    openLinkProjectModal({
      sourceNodeId: sourceNode.id, sourceNodeName: sourceNode.name,
      currentProjects: projects, activeProjectId: currentActiveProjectIdFromPM,
    });
  }, [techTreeData, projects, currentActiveProjectIdFromPM, openLinkProjectModal]);

  const handleConfirmLinkProject = useCallback((sourceNodeId, targetProjectId, targetProjectName) => {
    if (!techTreeData || !currentActiveProjectIdFromPM) return;

    const sourceProject = projects.find(p => p.id === currentActiveProjectIdFromPM);
    const targetProject = projects.find(p => p.id === targetProjectId);

    if (!sourceProject || !targetProject) {
      console.error("Source or target project not found for linking.");
      return;
    }

    const updatedSourceTree = updateNodeInTree(techTreeData, sourceNodeId, {
      linkedProjectId: targetProjectId, linkedProjectName: targetProjectName,
    });
    setTechTreeData(updatedSourceTree);
    handleSaveActiveProject(false); 

    const updatedTargetRootTreeData = {
      ...targetProject.treeData,
      linkedProjectId: sourceProject.id,
      linkedProjectName: sourceProject.name,
    };
    updateProjectData(targetProjectId, updatedTargetRootTreeData, targetProject.name); 

    const sourceNode = findNodeById(updatedSourceTree, sourceNodeId);
    addHistoryEntry('NODE_PROJECT_LINK_CREATED', `Node "${sourceNode?.name || 'Unknown'}" in "${sourceProject.name}" linked to project "${targetProjectName}". Reciprocal link created.`);
    closeLinkProjectModal();
  }, [techTreeData, setTechTreeData, handleSaveActiveProject, addHistoryEntry, closeLinkProjectModal, projects, currentActiveProjectIdFromPM, updateProjectData]);

  const handleUnlinkProjectFromNode = useCallback((nodeId) => {
    if (!techTreeData || !currentActiveProjectIdFromPM) return;
    
    const sourceNode = findNodeById(techTreeData, nodeId);
    if (!sourceNode || !sourceNode.linkedProjectId) return;

    const targetProjectIdToClear = sourceNode.linkedProjectId;
    const sourceProject = projects.find(p => p.id === currentActiveProjectIdFromPM);
    const targetProjectToClear = projects.find(p => p.id === targetProjectIdToClear);

    const updatedSourceTree = updateNodeInTree(techTreeData, nodeId, {
      linkedProjectId: null, linkedProjectName: null,
    });
    setTechTreeData(updatedSourceTree);
    handleSaveActiveProject(false); 

    if (targetProjectToClear && targetProjectToClear.treeData.linkedProjectId === sourceProject?.id) {
      const updatedTargetRootTreeData = {
        ...targetProjectToClear.treeData,
        linkedProjectId: null,
        linkedProjectName: null,
      };
      updateProjectData(targetProjectToClear.id, updatedTargetRootTreeData, targetProjectToClear.name);
    }
    addHistoryEntry('NODE_PROJECT_LINK_REMOVED', `Project link removed from node "${sourceNode.name}". Reciprocal link also cleared.`);
  }, [techTreeData, setTechTreeData, handleSaveActiveProject, addHistoryEntry, projects, currentActiveProjectIdFromPM, updateProjectData]);
  

  const navigateToProjectAndNode = useCallback((targetProjectId, targetNodeIdForFocus) => {
    const targetProject = projectManager.projects.find(p => p.id === targetProjectId);
    if (targetProject) {
      projectManager.handleSetActiveProject(targetProjectId, targetProject.isExample);
      const currentGlobalViewMode = yggdrasilViewMode;
      const currentTreeOverlayPanel = activeOverlayPanel;
      
      const nodeToFocusId = targetNodeIdForFocus || targetProject.treeData?.id;

      if (nodeToFocusId) {
        if (currentGlobalViewMode === 'treeView') {
          viewStates.setYggdrasilViewMode('treeView');
          if (currentTreeOverlayPanel === null) { 
            viewStates.setActiveOverlayPanel(null);
            viewStates.setSelectedGraphNodeId(nodeToFocusId);
          } else if (currentTreeOverlayPanel === 'list') { 
            viewStates.setActiveOverlayPanel('list');
          } else if (currentTreeOverlayPanel === 'focus') { 
            viewStates.setActiveOverlayPanel('focus');
            viewStates.setFocusNodeId(nodeToFocusId);
            viewStates.setSelectedNodeInFocusPanelId(nodeToFocusId);
          } else { 
            viewStates.setActiveOverlayPanel(null);
            viewStates.setSelectedGraphNodeId(nodeToFocusId);
          }
        } else { 
          viewStates.setYggdrasilViewMode('treeView');
          viewStates.setActiveOverlayPanel(null);
          viewStates.setSelectedGraphNodeId(nodeToFocusId);
        }
      } else {
        const errorMsg = `Target project "${targetProject.name}" has no valid root node or specified node for focus.`;
        console.error(errorMsg);
        if (typeof projectManager.setError === 'function') { projectManager.setError(errorMsg); }
        viewStates.setYggdrasilViewMode('workspace'); viewStates.setActiveOverlayPanel(null);
      }
    } else {
      const errorMsg = `Failed to navigate: Project with ID ${targetProjectId} not found.`;
      console.error(errorMsg);
      if (typeof projectManager.setError === 'function') { projectManager.setError(errorMsg); }
    }
  }, [projectManager, viewStates, yggdrasilViewMode, activeOverlayPanel]);


  const handleNavigateToLinkedProject = useCallback((targetProjectId) => {
    navigateToProjectAndNode(targetProjectId);
  }, [navigateToProjectAndNode]);

  const handleNavigateToSourceNode = useCallback((sourceProjectId, sourceNodeId) => {
    navigateToProjectAndNode(sourceProjectId, sourceNodeId);
  }, [navigateToProjectAndNode]);


  return {
    handleOpenLinkProjectModal,
    handleConfirmLinkProject,
    handleUnlinkProjectFromNode,
    handleNavigateToLinkedProject,
    findLinkSource,
    handleNavigateToSourceNode,
  };
};
