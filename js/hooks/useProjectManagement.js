
import { useState, useCallback, useEffect } from 'react';
import { generateUUID, initializeNodes, findNodeById, updateNodeInTree } from '../utils.js';
import { APP_STORAGE_KEYS, ELF_WARFARE_STRUCTURE_JSON_STRING, ADVANCED_NATURE_MAGIC_JSON_STRING } from '../constants.js';

export const useProjectManagement = ({
  modalManager,
  historyManager,
  viewStates,
  currentTechTreeData,
  currentContextText,
  setTechTreeData,
  setContextText,
  setInitialPromptFromHook,
  setError,
}) => {
  const [projects, setProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(null);

  const { addHistoryEntry } = historyManager;
  const { openProjectNameModal, openConfirmModal, closeProjectNameModal, closeConfirmModal } = modalManager;
  
  const resetTreeForNewProjectContext = useCallback(() => {
    viewStates?.commonViewResetLogic(true); 
    setTechTreeData(null);
    setContextText('');
    setInitialPromptFromHook('');
    setActiveProjectId(null);
  }, [viewStates, setTechTreeData, setContextText, setInitialPromptFromHook]);

  const saveProjectsToLocalStorage = useCallback(() => {
    if (projects.length > 0) localStorage.setItem(APP_STORAGE_KEYS.PROJECT_COLLECTION, JSON.stringify(projects));
    else localStorage.removeItem(APP_STORAGE_KEYS.PROJECT_COLLECTION);
    if (activeProjectId) localStorage.setItem(APP_STORAGE_KEYS.ACTIVE_PROJECT_ID, activeProjectId);
    else localStorage.removeItem(APP_STORAGE_KEYS.ACTIVE_PROJECT_ID);
  }, [projects, activeProjectId]);

  useEffect(() => { saveProjectsToLocalStorage(); }, [saveProjectsToLocalStorage]);

  const updateProjectData = useCallback((projectId, newTreeData, newName) => {
    setProjects(prevProjects => {
      const projectIndex = prevProjects.findIndex(p => p.id === projectId);
      if (projectIndex === -1) {
        console.warn(`updateProjectData: Project with ID ${projectId} not found.`);
        return prevProjects;
      }
      const updatedProjects = [...prevProjects];
      const projectToUpdate = updatedProjects[projectIndex];
      updatedProjects[projectIndex] = {
        ...projectToUpdate,
        name: newName || projectToUpdate.name,
        treeData: newTreeData,
        lastModified: new Date().toISOString(),
      };
      return updatedProjects;
    });
    if (projectId === activeProjectId) {
      setTechTreeData(newTreeData);
      if (newName) {
        setContextText(newName);
        setInitialPromptFromHook(newName);
      }
    }
  }, [activeProjectId, setTechTreeData, setContextText, setInitialPromptFromHook]);


  const initializeDefaultProjects = useCallback(() => {
    const startupLogged = localStorage.getItem(APP_STORAGE_KEYS.STARTUP_LOAD_LOGGED);
    const logId = `startup-project-load-${new Date().toISOString()}`;
    let loadedProjects = [];
    let activeProjectHasBeenSet = false;

    try {
      const storedProjects = localStorage.getItem(APP_STORAGE_KEYS.PROJECT_COLLECTION);
      if (storedProjects) {
        const parsed = JSON.parse(storedProjects);
        if (Array.isArray(parsed) && parsed.every(p => p.id && p.name && p.treeData && p.lastModified)) {
          loadedProjects = parsed.map(p => ({ ...p, treeData: initializeNodes(p.treeData) }));
        } else {
          if (!startupLogged) addHistoryEntry('PROJECT_LOADED', 'Invalid project collection found, reset.', { source: 'localStorage-error', logId });
        }
      }

      const elfDataParsed = JSON.parse(ELF_WARFARE_STRUCTURE_JSON_STRING);
      const natureMagicDataParsed = JSON.parse(ADVANCED_NATURE_MAGIC_JSON_STRING);

      let elfWarfareProject = loadedProjects.find(p => p.treeData.id === elfDataParsed.tree.id && p.isExample);
      if (!elfWarfareProject) {
        elfWarfareProject = {
          id: generateUUID(), name: elfDataParsed.tree.name || "Elven Warfare Doctrines",
          treeData: initializeNodes(elfDataParsed.tree), lastModified: new Date().toISOString(), isExample: true,
        };
        loadedProjects.push(elfWarfareProject);
        if (!startupLogged) addHistoryEntry('PROJECT_CREATED', `Initialized example: "${elfWarfareProject.name}".`, { source: 'auto-init', logId });
      }

      let natureMagicProject = loadedProjects.find(p => p.treeData.id === natureMagicDataParsed.tree.id && p.isExample);
      if (!natureMagicProject) {
        natureMagicProject = {
          id: generateUUID(), name: natureMagicDataParsed.tree.name || "Advanced Nature Magic",
          treeData: initializeNodes(natureMagicDataParsed.tree), lastModified: new Date().toISOString(), isExample: true,
        };
        loadedProjects.push(natureMagicProject);
        if (!startupLogged) addHistoryEntry('PROJECT_CREATED', `Initialized example: "${natureMagicProject.name}".`, { source: 'auto-init', logId });
      }
      
      let finalLoadedProjects = [...loadedProjects]; 

      const ewProject = finalLoadedProjects.find(p => p.id === elfWarfareProject.id);
      const anmProject = finalLoadedProjects.find(p => p.id === natureMagicProject.id);

      if (ewProject && anmProject) {
        const nodeToLinkInEW = findNodeById(ewProject.treeData, "natures-embrace");
        if (nodeToLinkInEW) {
          if (nodeToLinkInEW.linkedProjectId !== anmProject.id || nodeToLinkInEW.linkedProjectName !== anmProject.name) {
            const updatedEWTree = updateNodeInTree(ewProject.treeData, "natures-embrace", {
              linkedProjectId: anmProject.id,
              linkedProjectName: anmProject.name,
            });
            const ewIndex = finalLoadedProjects.findIndex(p => p.id === ewProject.id);
            finalLoadedProjects[ewIndex] = { ...ewProject, treeData: updatedEWTree, lastModified: new Date().toISOString() };
          }
        }

        if (anmProject.treeData.linkedProjectId !== ewProject.id || anmProject.treeData.linkedProjectName !== ewProject.name) {
            const updatedANMRootTree = {
                ...anmProject.treeData,
                linkedProjectId: ewProject.id,
                linkedProjectName: ewProject.name,
            };
            const anmIndex = finalLoadedProjects.findIndex(p => p.id === anmProject.id);
            finalLoadedProjects[anmIndex] = { ...anmProject, treeData: updatedANMRootTree, lastModified: new Date().toISOString() };
        }
        
        const currentEWProjectForRootUpdate = finalLoadedProjects.find(p => p.id === ewProject.id);
        if (currentEWProjectForRootUpdate && (currentEWProjectForRootUpdate.treeData.linkedProjectId !== anmProject.id || currentEWProjectForRootUpdate.treeData.linkedProjectName !== anmProject.name)) {
            const updatedEWRootTree = {
                ...currentEWProjectForRootUpdate.treeData,
                linkedProjectId: anmProject.id,
                linkedProjectName: anmProject.name,
            };
            const ewIndex = finalLoadedProjects.findIndex(p => p.id === ewProject.id);
            finalLoadedProjects[ewIndex] = { ...currentEWProjectForRootUpdate, treeData: updatedEWRootTree, lastModified: new Date().toISOString() };
        }
      }

      setProjects(finalLoadedProjects); 

      const storedActiveId = localStorage.getItem(APP_STORAGE_KEYS.ACTIVE_PROJECT_ID);
      if (storedActiveId) {
        const activeProj = finalLoadedProjects.find(p => p.id === storedActiveId && !p.isExample);
        if (activeProj) {
          setActiveProjectId(activeProj.id); setTechTreeData(activeProj.treeData);
          setContextText(activeProj.name); setInitialPromptFromHook(activeProj.name);
          if (!startupLogged) addHistoryEntry('PROJECT_LOADED', `Loaded project "${activeProj.name}".`, { source: 'localStorage-active', logId, projectId: activeProj.id });
          activeProjectHasBeenSet = true;
        }
      }

      if (!activeProjectHasBeenSet) {
        const firstUserProject = finalLoadedProjects.find(p => !p.isExample);
        if (firstUserProject) {
          setActiveProjectId(firstUserProject.id); setTechTreeData(firstUserProject.treeData);
          setContextText(firstUserProject.name); setInitialPromptFromHook(firstUserProject.name);
          if (!startupLogged) addHistoryEntry('PROJECT_LOADED', `Loaded first available project "${firstUserProject.name}".`, { source: 'localStorage-fallback', logId, projectId: firstUserProject.id });
          activeProjectHasBeenSet = true;
        }
      }
      if (!activeProjectHasBeenSet && finalLoadedProjects.some(p => p.isExample)) {
        const exampleToLoad = finalLoadedProjects.find(p => p.isExample && p.name === "Elven Warfare Doctrines"); 
        if (exampleToLoad) {
          viewStates?.commonViewResetLogic(false); setTechTreeData(exampleToLoad.treeData);
          setContextText(exampleToLoad.name); setInitialPromptFromHook(exampleToLoad.name); setActiveProjectId(null);
          if (!startupLogged) addHistoryEntry('PROJECT_EXAMPLE_LOADED', `Started with example: "${exampleToLoad.name}".`, { source: 'auto-example-load', logId, exampleProjectId: exampleToLoad.id });
        }
      }
    } catch (e) {
      console.error("Error loading projects:", e); setError("Failed to load projects.");
      if (!startupLogged) addHistoryEntry('PROJECT_LOADED', 'Error loading projects.', { error: e.message, logId });
    } finally {
      if (!startupLogged) localStorage.setItem(APP_STORAGE_KEYS.STARTUP_LOAD_LOGGED, 'true');
    }
  }, [addHistoryEntry, viewStates, setContextText, setError, setInitialPromptFromHook, setTechTreeData]);


  const handleSetActiveProject = useCallback((projectId, fromExample = false) => {
    const projectToLoad = projects.find(p => p.id === projectId);
    if (projectToLoad) {
      viewStates?.commonViewResetLogic(false);
      const initializedTree = initializeNodes(projectToLoad.treeData);
      setTechTreeData(initializedTree);
      setContextText(projectToLoad.name);
      setInitialPromptFromHook(projectToLoad.name);

      if (projectToLoad.isExample || fromExample) {
        setActiveProjectId(null); 
        addHistoryEntry('PROJECT_EXAMPLE_LOADED', `Started new project from example "${projectToLoad.name}". Save to keep changes.`);
      } else {
        setActiveProjectId(projectToLoad.id);
        addHistoryEntry('PROJECT_LOADED', `Project "${projectToLoad.name}" activated.`);
      }
    } else {
      setError(`Project with ID ${projectId} not found.`);
    }
  }, [projects, viewStates, setTechTreeData, setContextText, setInitialPromptFromHook, addHistoryEntry, setError]);

  const saveCurrentTreeAsProject = useCallback((name, isExample = false) => {
    if (!currentTechTreeData) { setError("No tree data to save as project."); return null; }
    const newProject = {
      id: generateUUID(), name: name, treeData: currentTechTreeData,
      lastModified: new Date().toISOString(), isExample: isExample,
    };
    setProjects(prev => [...prev, newProject]);
    if (!isExample) {
        setActiveProjectId(newProject.id);
        setContextText(name); 
        setInitialPromptFromHook(name);
    }
    addHistoryEntry('PROJECT_CREATED', `${isExample ? 'Example p' : 'P'}roject "${name}" saved.`);
    return newProject;
  }, [currentTechTreeData, addHistoryEntry, setError, setContextText, setInitialPromptFromHook]);

  const internalCreateNewProject = useCallback((name) => {
    resetTreeForNewProjectContext();
    const newEmptyTree = initializeNodes({
      id: 'root-empty-' + generateUUID().substring(0,8), name: 'New Project Root', description: 'Start building your tech tree.', importance: 'common'
    });
    setTechTreeData(newEmptyTree); 
    setContextText(name);
    setInitialPromptFromHook(name);
    
    const savedProject = saveCurrentTreeAsProject(name, false);
    closeProjectNameModal();
    if (viewStates && savedProject && savedProject.treeData.id) {
        viewStates.setYggdrasilViewMode('treeView');
        viewStates.handleSwitchToFocusView(savedProject.treeData.id);
    }
  }, [resetTreeForNewProjectContext, setTechTreeData, setContextText, setInitialPromptFromHook, saveCurrentTreeAsProject, closeProjectNameModal, viewStates]);

  const handleCreateNewProject = useCallback(() => {
    openProjectNameModal({ mode: 'create', onConfirm: internalCreateNewProject });
  }, [openProjectNameModal, internalCreateNewProject]);

  const handleAddNewProjectFromFile = useCallback((event) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result; 
          const parsedJson = JSON.parse(content);
          let newProject;
          if (parsedJson.id && parsedJson.name && parsedJson.treeData && parsedJson.lastModified) {
            newProject = { ...parsedJson, treeData: initializeNodes(parsedJson.treeData), isExample: parsedJson.isExample || false };
          } else if (parsedJson.name && parsedJson.tree) { 
            newProject = {
              id: generateUUID(), name: parsedJson.context || parsedJson.name || file.name.replace(/\.json$|\.project\.json$/i, '') || "Imported Project",
              treeData: initializeNodes(parsedJson.tree), lastModified: new Date().toISOString(), isExample: false,
            };
          } else { throw new Error("Invalid JSON structure for project import."); }
          
          const existingProjectIndex = projects.findIndex(p => p.id === newProject.id);
          if (existingProjectIndex !== -1) {
             setProjects(prev => { const updated = [...prev]; updated[existingProjectIndex] = newProject; return updated; });
             addHistoryEntry('PROJECT_IMPORTED', `Project "${newProject.name}" updated from ${file.name}.`);
          } else {
            setProjects(prev => [...prev, newProject]);
            addHistoryEntry('PROJECT_IMPORTED', `Project "${newProject.name}" imported from ${file.name}.`);
          }
          handleSetActiveProject(newProject.id, newProject.isExample);
          setError(null);
        } catch (err) { setError(`Error loading project from file: ${err.message}`); console.error("Project File Load Error:", err); }
        finally { event.target.value = ''; }
      };
      reader.readAsText(file);
    }
  }, [projects, addHistoryEntry, handleSetActiveProject, setError]);

  const handleSaveActiveProject = useCallback((andDownload = false) => {
    if (!currentTechTreeData) { setError("No tree data to save."); return; }
    let effectiveActiveProjectId = activeProjectId;
    const currentActiveProjectDetails = projects.find(p => p.id === activeProjectId);
    
    if (currentActiveProjectDetails?.isExample) {
        effectiveActiveProjectId = null; 
    }

    if (!effectiveActiveProjectId) {
      openProjectNameModal({
        mode: 'create', currentName: currentContextText || "New Project",
        onConfirm: (nameFromModal) => {
          setContextText(nameFromModal); setInitialPromptFromHook(nameFromModal);
          const newSavedProject = saveCurrentTreeAsProject(nameFromModal, false);
          if (newSavedProject && andDownload) { 
            const filename = `${newSavedProject.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.project.json`;
            const jsonStr = JSON.stringify(newSavedProject, null, 2);
            const blob = new Blob([jsonStr], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url; link.download = filename; document.body.appendChild(link);
            link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
            addHistoryEntry('TREE_DOWNLOADED', `Project "${newSavedProject.name}" downloaded.`);
          }
          closeProjectNameModal();
        }
      }); return;
    }

    const projectIndex = projects.findIndex(p => p.id === effectiveActiveProjectId && !p.isExample);
    if (projectIndex === -1) { setError("Active user project not found for saving."); return; }
    
    const updatedProject = { 
        ...projects[projectIndex], 
        treeData: currentTechTreeData, 
        name: currentContextText, 
        lastModified: new Date().toISOString(), 
        isExample: false
    };
    setProjects(prev => { const newProjects = [...prev]; newProjects[projectIndex] = updatedProject; return newProjects; });
    addHistoryEntry('PROJECT_SAVED', `Project "${updatedProject.name}" saved.`);
    if (andDownload) { 
        const filename = `${updatedProject.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.project.json`;
        const jsonStr = JSON.stringify(updatedProject, null, 2);
        const blob = new Blob([jsonStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url; link.download = filename; document.body.appendChild(link);
        link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
        addHistoryEntry('TREE_DOWNLOADED', `Project "${updatedProject.name}" downloaded.`);
    }
  }, [activeProjectId, currentTechTreeData, projects, currentContextText, addHistoryEntry, openProjectNameModal, saveCurrentTreeAsProject, closeProjectNameModal, setContextText, setInitialPromptFromHook, setError]);

  const internalRenameProject = useCallback((projectId, newName) => {
    const oldProject = projects.find(p => p.id === projectId);
    setProjects(prevProjects => prevProjects.map(p => p.id === projectId ? { ...p, name: newName, lastModified: new Date().toISOString() } : p));
    if (activeProjectId === projectId) { setContextText(newName); setInitialPromptFromHook(newName); }
    addHistoryEntry('PROJECT_RENAMED', `Project "${oldProject?.name}" renamed to "${newName}".`);
    closeProjectNameModal();
  }, [projects, activeProjectId, addHistoryEntry, closeProjectNameModal, setContextText, setInitialPromptFromHook]);

  const handleRenameActiveProject = useCallback(() => { 
    const projectToRename = projects.find(p => p.id === activeProjectId && !p.isExample);
    if(projectToRename){
        openProjectNameModal({ mode: 'rename', projectId: projectToRename.id, currentName: projectToRename.name, onConfirm: (newName) => internalRenameProject(projectToRename.id, newName) });
    } else {
        setError("No active user project selected to rename, or it's an example.");
    }
  }, [projects, activeProjectId, openProjectNameModal, internalRenameProject, setError]);

  const handleRenameProject = useCallback((projectIdToRename, currentName) => { 
    const projectToRename = projects.find(p => p.id === projectIdToRename && !p.isExample);
    if(projectToRename){
        openProjectNameModal({ mode: 'rename', projectId: projectToRename.id, currentName: projectToRename.name, onConfirm: (newName) => internalRenameProject(projectToRename.id, newName) });
    } else {
        setError("Project not found for renaming or it's an example.");
    }
  }, [projects, openProjectNameModal, internalRenameProject, setError]);


  const handleDeleteProject = useCallback((projectId) => {
    const projectToDelete = projects.find(p => p.id === projectId);
    if (!projectToDelete) { setError("Project not found for deletion."); return; }
    openConfirmModal({
      title: `Delete ${projectToDelete.isExample ? 'Example' : ''} Project?`, message: `Delete "${projectToDelete.name}"? This cannot be undone.`,
      confirmText: `Delete ${projectToDelete.isExample ? 'Example' : ''} Project`, cancelText: "Cancel", confirmButtonStyle: { backgroundColor: 'var(--error-color)', borderColor: 'var(--error-color)' },
      onConfirm: () => {
        const remainingProjects = projects.filter(p => p.id !== projectId);
        setProjects(remainingProjects);
        addHistoryEntry('PROJECT_DELETED', `${projectToDelete.isExample ? 'Example p' : 'P'}roject "${projectToDelete.name}" deleted.`);
        
        if (activeProjectId === projectId) {
            const nextUserProject = remainingProjects.find(p => !p.isExample);
            if(nextUserProject) handleSetActiveProject(nextUserProject.id);
            else {
                const nextExampleProject = remainingProjects.find(p => p.isExample);
                if (nextExampleProject) handleSetActiveProject(nextExampleProject.id, true);
                else resetTreeForNewProjectContext();
            }
        }
        closeConfirmModal();
      },
      onCancel: () => { 
        closeConfirmModal();
      }
    });
  }, [projects, activeProjectId, addHistoryEntry, openConfirmModal, closeConfirmModal, setError, handleSetActiveProject, resetTreeForNewProjectContext]);
  
  const internalSaveAsExample = useCallback((name) => {
    if (!currentTechTreeData) { setError("No tree data to save as example."); return; }
    saveCurrentTreeAsProject(name, true);
    closeProjectNameModal();
  }, [currentTechTreeData, saveCurrentTreeAsProject, closeProjectNameModal, setError]);

  const handleSaveCurrentTreeAsExampleProject = useCallback(() => {
    if (!currentTechTreeData) { setError("No active tree data to save as an example."); return; }
    openProjectNameModal({ mode: 'createExample', currentName: `Example: ${currentContextText || 'My Custom Structure'}`, onConfirm: internalSaveAsExample });
  }, [currentTechTreeData, currentContextText, openProjectNameModal, internalSaveAsExample, setError]);

  const handleLoadAndGoToGraph = useCallback((projectId) => {
    const projectToLoad = projects.find(p => p.id === projectId);
    if (projectToLoad && viewStates) {
        handleSetActiveProject(projectId, projectToLoad.isExample);
         viewStates.setYggdrasilViewMode('treeView'); 
        if (projectToLoad.treeData && projectToLoad.treeData.id) {
           viewStates.setSelectedGraphNodeId(projectToLoad.treeData.id); 
        }
    } else {
        setError(`Project with ID ${projectId} not found or view system not ready.`);
    }
  }, [projects, viewStates, handleSetActiveProject, setError]);

  return {
    projects, activeProjectId, setActiveProjectId,
    handleSetActiveProject, saveCurrentTreeAsProject, handleCreateNewProject,
    handleAddNewProjectFromFile, handleSaveActiveProject, handleRenameActiveProject, handleRenameProject,
    handleDeleteProject, handleSaveCurrentTreeAsExampleProject, handleLoadAndGoToGraph,
    resetTreeForNewProjectContext, initializeDefaultProjects, saveProjectsToLocalStorage, internalRenameProject,
    updateProjectData, 
  };
};
