
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

  const _loadProjectsFromStorage = useCallback(() => {
    try {
      const storedProjects = localStorage.getItem(APP_STORAGE_KEYS.PROJECT_COLLECTION);
      if (storedProjects) {
        const parsed = JSON.parse(storedProjects);
        if (Array.isArray(parsed) && parsed.every(p => p.id && p.name && p.treeData && p.lastModified)) {
          return parsed.map(p => ({ ...p, treeData: initializeNodes(p.treeData) }));
        }
      }
    } catch (e) {
      console.error("Error loading projects from storage:", e);
      addHistoryEntry('PROJECT_LOADED', 'Failed to load projects from storage.', { error: e.message });
    }
    return [];
  }, [addHistoryEntry]);

  const _addMissingExampleProjects = useCallback((projectsList) => {
      let newProjects = [...projectsList];
      const examplesData = [
          { parsedData: JSON.parse(ELF_WARFARE_STRUCTURE_JSON_STRING), name: "Elven Warfare Doctrines" },
          { parsedData: JSON.parse(ADVANCED_NATURE_MAGIC_JSON_STRING), name: "Advanced Nature Magic" },
      ];

      examplesData.forEach(example => {
          const exampleExists = newProjects.some(p => p.isExample && p.treeData.id === example.parsedData.tree.id);
          if (!exampleExists) {
              newProjects.push({
                  id: generateUUID(),
                  name: example.parsedData.tree.name || example.name,
                  treeData: initializeNodes(example.parsedData.tree),
                  lastModified: new Date().toISOString(),
                  isExample: true,
              });
          }
      });
      return newProjects;
  }, []);

  const _linkExampleProjects = useCallback((projectsList) => {
      let linkedProjects = [...projectsList];
      const ewProject = linkedProjects.find(p => p.isExample && p.treeData.id === 'elf-warfare-root-example-v1');
      const anmProject = linkedProjects.find(p => p.isExample && p.treeData.id === 'nature-magic-root-example-v1');

      if (!ewProject || !anmProject) return linkedProjects;
      
      let ewTree = ewProject.treeData;
      let anmTree = anmProject.treeData;
      let modified = false;

      const nodeToLinkInEW = findNodeById(ewTree, "natures-embrace");
      if (nodeToLinkInEW && nodeToLinkInEW.linkedProjectId !== anmProject.id) {
          ewTree = updateNodeInTree(ewTree, "natures-embrace", { linkedProjectId: anmProject.id, linkedProjectName: anmProject.name });
          modified = true;
      }
      
      if (anmTree.linkedProjectId !== ewProject.id) {
          anmTree = { ...anmTree, linkedProjectId: ewProject.id, linkedProjectName: ewProject.name };
          modified = true;
      }

      if (modified) {
          return linkedProjects.map(p => {
              if (p.id === ewProject.id) return { ...p, treeData: ewTree, lastModified: new Date().toISOString() };
              if (p.id === anmProject.id) return { ...p, treeData: anmTree, lastModified: new Date().toISOString() };
              return p;
          });
      }
      
      return linkedProjects;
  }, []);

  const _setActiveInitialProject = useCallback((allProjects) => {
    const startupLogged = localStorage.getItem(APP_STORAGE_KEYS.STARTUP_LOAD_LOGGED);
    const logId = `startup-project-load-${new Date().toISOString()}`;
    const storedActiveId = localStorage.getItem(APP_STORAGE_KEYS.ACTIVE_PROJECT_ID);

    const loadProjectState = (project, source) => {
      setActiveProjectId(project.isExample ? null : project.id);
      setTechTreeData(initializeNodes(project.treeData));
      setContextText(project.name);
      setInitialPromptFromHook(project.name);
      if (!startupLogged) addHistoryEntry('PROJECT_LOADED', `Loaded project "${project.name}".`, { source, logId, projectId: project.id });
    };

    if (storedActiveId) {
      const activeProj = allProjects.find(p => p.id === storedActiveId && !p.isExample);
      if (activeProj) {
        loadProjectState(activeProj, 'localStorage-active');
        return;
      }
    }

    const firstUserProject = allProjects.find(p => !p.isExample);
    if (firstUserProject) {
      loadProjectState(firstUserProject, 'fallback-first-user');
      return;
    }
    
    const elfExample = allProjects.find(p => p.isExample && p.treeData.id === 'elf-warfare-root-example-v1');
    if (elfExample) {
        viewStates?.commonViewResetLogic(false);
        loadProjectState(elfExample, 'fallback-example');
    }
  }, [setTechTreeData, setContextText, setInitialPromptFromHook, viewStates, addHistoryEntry]);


  const initializeDefaultProjects = useCallback(() => {
    const startupLogged = localStorage.getItem(APP_STORAGE_KEYS.STARTUP_LOAD_LOGGED);
    try {
      let projectsFromStorage = _loadProjectsFromStorage();
      let projectsWithExamples = _addMissingExampleProjects(projectsFromStorage);
      let allProjects = _linkExampleProjects(projectsWithExamples);
      
      setProjects(allProjects);
      _setActiveInitialProject(allProjects);
    } catch (e) {
      console.error("Error initializing projects:", e);
      setError("A critical error occurred while initializing projects.");
      addHistoryEntry('APP_ERROR_ENCOUNTERED', 'Project initialization failed.', { error: e.message });
    } finally {
        if (!startupLogged) localStorage.setItem(APP_STORAGE_KEYS.STARTUP_LOAD_LOGGED, 'true');
    }
  }, [_loadProjectsFromStorage, _addMissingExampleProjects, _linkExampleProjects, _setActiveInitialProject, setError, addHistoryEntry]);


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

  const saveNewProject = useCallback((treeToSave, name, isExample = false) => {
    if (!treeToSave) { setError("No tree data to save as project."); return null; }
    const newProject = {
      id: generateUUID(), name: name, treeData: treeToSave,
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
  }, [addHistoryEntry, setError, setContextText, setInitialPromptFromHook]);

  const internalCreateNewProject = useCallback((name) => {
    resetTreeForNewProjectContext();
    const newEmptyTree = initializeNodes({
      id: 'root-empty-' + generateUUID().substring(0,8), name: 'New Project Root', description: 'Start building your tech tree.', importance: 'common'
    });
    setTechTreeData(newEmptyTree); 
    setContextText(name);
    setInitialPromptFromHook(name);
    
    const savedProject = saveNewProject(newEmptyTree, name, false);
    closeProjectNameModal();
    if (viewStates && savedProject && savedProject.treeData.id) {
        viewStates.setYggdrasilViewMode('treeView');
        viewStates.setActiveOverlayPanel(null); // Ensure graph view is active
        viewStates.setSelectedGraphNodeId(savedProject.treeData.id); // Select the root node
    }
  }, [resetTreeForNewProjectContext, setTechTreeData, setContextText, setInitialPromptFromHook, saveNewProject, closeProjectNameModal, viewStates]);

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
          const newSavedProject = saveNewProject(currentTechTreeData, nameFromModal, false);
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
  }, [activeProjectId, currentTechTreeData, projects, currentContextText, addHistoryEntry, openProjectNameModal, saveNewProject, closeProjectNameModal, setContextText, setInitialPromptFromHook, setError]);

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
      confirmText: `Delete ${projectToDelete.isExample ? 'Example' : ''} Project`, cancelText: "Cancel", confirmButtonStyle: 'danger',
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
    saveNewProject(currentTechTreeData, name, true);
    closeProjectNameModal();
  }, [currentTechTreeData, saveNewProject, closeProjectNameModal, setError]);

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
    handleSetActiveProject, saveNewProject, handleCreateNewProject,
    handleAddNewProjectFromFile, handleSaveActiveProject, handleRenameActiveProject, handleRenameProject,
    handleDeleteProject, handleSaveCurrentTreeAsExampleProject, handleLoadAndGoToGraph,
    resetTreeForNewProjectContext, initializeDefaultProjects, saveProjectsToLocalStorage, internalRenameProject,
    updateProjectData, 
  };
};
