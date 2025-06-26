import React, { useState, useCallback, useEffect } from 'react';
import { generateUUID, initializeNodes, findNodeById, updateNodeInTree, getAllNodesAsMap, downloadObjectAsJson, cleanTreeForExport } from '../utils.js';
import { APP_STORAGE_KEYS, ELF_WARFARE_STRUCTURE_JSON_STRING, ADVANCED_NATURE_MAGIC_JSON_STRING } from '../constants.js';

const downloadProjectFile = (project, addHistoryEntry) => {
    if (!project) return;
    const filename = `${project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.project.json`;
    downloadObjectAsJson(project, filename);
    if (addHistoryEntry) {
        addHistoryEntry('TREE_DOWNLOADED', `Project "${project.name}" downloaded.`);
    }
};

export const useProjectManagement = ({
  modalManager,
  historyManager,
  viewStates,
  currentTechTreeData,
  currentContextText,
  setTechTreeData,
  setInitialPrompt,
  setError,
}) => {
  const [projects, setProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(null);

  const { addHistoryEntry } = historyManager;
  const { openProjectNameModal, openConfirmModal, closeProjectNameModal, closeConfirmModal } = modalManager;
  
  const resetTreeForNewProjectContext = useCallback(() => {
    viewStates?.commonViewResetLogic(true); 
    setTechTreeData(null);
    setInitialPrompt('');
    setActiveProjectId(null);
  }, [viewStates, setTechTreeData, setInitialPrompt, setActiveProjectId]);

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
        setInitialPrompt(newName);
      }
    }
  }, [activeProjectId, setTechTreeData, setInitialPrompt]);

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



  const _setActiveInitialProject = useCallback((allProjects) => {
    const startupLogged = localStorage.getItem(APP_STORAGE_KEYS.STARTUP_LOAD_LOGGED);
    const logId = `startup-project-load-${new Date().toISOString()}`;

    const loadProjectState = (project, source) => {
      viewStates?.commonViewResetLogic(false); // Centralized view reset
      setActiveProjectId(project.isExample ? null : project.id);
      setTechTreeData(initializeNodes(project.treeData));
      setInitialPrompt(project.name);
      if (!startupLogged) {
        addHistoryEntry('PROJECT_LOADED', `Loaded project "${project.name}".`, { source, logId, projectId: project.id });
      }
    };
    
    const findAndLoadProject = () => {
        const storedActiveId = localStorage.getItem(APP_STORAGE_KEYS.ACTIVE_PROJECT_ID);
        if (storedActiveId) {
            const activeProj = allProjects.find(p => p.id === storedActiveId && !p.isExample);
            if (activeProj) {
                loadProjectState(activeProj, 'localStorage-active');
                return true;
            }
        }
    
        const firstUserProject = allProjects.find(p => !p.isExample);
        if (firstUserProject) {
            loadProjectState(firstUserProject, 'fallback-first-user');
            return true;
        }
        
        // If we reach here, there are no user projects.
        // We will let the WelcomeScreen show by not loading any project.
        return false;
    }

    if (!findAndLoadProject()) {
        // If no user project was loaded, we ensure the app is in a clean state
        // for the welcome screen.
        resetTreeForNewProjectContext();
        if (!startupLogged) {
            addHistoryEntry('PROJECT_LOADED', 'Welcome screen shown; no user projects found.', { source: 'initial-load', logId });
        }
    }

  }, [setTechTreeData, setInitialPrompt, viewStates, addHistoryEntry, setActiveProjectId, resetTreeForNewProjectContext]);


  const initializeDefaultProjects = useCallback(() => {
    const startupLogged = localStorage.getItem(APP_STORAGE_KEYS.STARTUP_LOAD_LOGGED);
    try {
      let projectsFromStorage = _loadProjectsFromStorage();
      let allProjects = _addMissingExampleProjects(projectsFromStorage);
      
      setProjects(allProjects);
      _setActiveInitialProject(allProjects);
    } catch (e) {
      console.error("Error initializing projects:", e);
      setError("A critical error occurred while initializing projects.");
      addHistoryEntry('APP_ERROR_ENCOUNTERED', 'Project initialization failed.', { error: e.message });
    } finally {
        if (!startupLogged) localStorage.setItem(APP_STORAGE_KEYS.STARTUP_LOAD_LOGGED, 'true');
    }
  }, [_loadProjectsFromStorage, _addMissingExampleProjects, _setActiveInitialProject, setError, addHistoryEntry]);


  const handleSetActiveProject = useCallback((projectId, fromExample = false) => {
    const projectToLoad = projects.find(p => p.id === projectId);
    if (projectToLoad) {
      viewStates?.commonViewResetLogic(false);
      const initializedTree = initializeNodes(projectToLoad.treeData);
      setTechTreeData(initializedTree);
      setInitialPrompt(projectToLoad.name);

      if (projectToLoad.isExample || fromExample) {
        setActiveProjectId(null); 
        addHistoryEntry('PROJECT_EXAMPLE_LOADED', `Started new project from example "${projectToLoad.name}". Save to keep changes.`);
      } else {
        setActiveProjectId(projectToLoad.id);
        addHistoryEntry('PROJECT_LOADED', `Project "${projectToLoad.name}" activated.`);
      }
      // Switch to graph view after loading a project from the workspace
      if (viewStates) {
        viewStates.setYggdrasilViewMode('graph');
      }
    } else {
      setError(`Project with ID ${projectId} not found.`);
    }
  }, [projects, viewStates, setTechTreeData, setInitialPrompt, addHistoryEntry, setError, setActiveProjectId]);

  const saveNewProject = useCallback((treeToSave, name, isExample = false) => {
    if (!treeToSave) { setError("No tree data to save as project."); return null; }
    const newProject = {
      id: generateUUID(), name: name, treeData: cleanTreeForExport(treeToSave),
      lastModified: new Date().toISOString(), isExample: isExample,
    };
    setProjects(prev => [...prev, newProject]);
    if (!isExample) {
        setActiveProjectId(newProject.id);
        setInitialPrompt(name);
    }
    addHistoryEntry('PROJECT_CREATED', `${isExample ? 'Example p' : 'P'}roject "${name}" saved.`);
    return newProject;
  }, [addHistoryEntry, setError, setInitialPrompt, setActiveProjectId]);

  const internalCreateNewProject = useCallback((name) => {
    if (projects.some(p => !p.isExample && p.name.toLowerCase() === name.toLowerCase())) {
        setError(`A project named "${name}" already exists. Please choose a unique name.`);
        closeProjectNameModal();
        return;
    }
    resetTreeForNewProjectContext();
    const newEmptyTree = initializeNodes({
      id: 'root-empty-' + generateUUID().substring(0,8), name: 'New Project Root', description: 'Start building your tech tree.', importance: 'common'
    });
    setTechTreeData(newEmptyTree); 
    setInitialPrompt(name);
    
    const savedProject = saveNewProject(newEmptyTree, name, false);
    closeProjectNameModal();
    if (viewStates && savedProject && savedProject.treeData.id) {
        viewStates.setYggdrasilViewMode('graph');
        viewStates.setSelectedGraphNodeId(savedProject.treeData.id); // Select the root node
    }
  }, [projects, setError, resetTreeForNewProjectContext, setTechTreeData, setInitialPrompt, saveNewProject, closeProjectNameModal, viewStates]);

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
        } catch (err) { setError(err); console.error("Project File Load Error:", err); }
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
          setInitialPrompt(nameFromModal);
          const newSavedProject = saveNewProject(currentTechTreeData, nameFromModal, false);
          if (newSavedProject && andDownload) {
            downloadProjectFile(newSavedProject, addHistoryEntry);
          }
          closeProjectNameModal();
        }
      }); return;
    }

    const projectIndex = projects.findIndex(p => p.id === effectiveActiveProjectId && !p.isExample);
    if (projectIndex === -1) { setError("Active user project not found for saving."); return; }
    
    const updatedProject = { 
        ...projects[projectIndex], 
        treeData: cleanTreeForExport(currentTechTreeData), 
        name: currentContextText, 
        lastModified: new Date().toISOString(), 
        isExample: false
    };
    setProjects(prev => { const newProjects = [...prev]; newProjects[projectIndex] = updatedProject; return newProjects; });
    addHistoryEntry('PROJECT_SAVED', `Project "${updatedProject.name}" saved.`);
    if (andDownload) {
      downloadProjectFile(updatedProject, addHistoryEntry);
    }
  }, [activeProjectId, currentTechTreeData, projects, currentContextText, addHistoryEntry, openProjectNameModal, saveNewProject, closeProjectNameModal, setInitialPrompt, setError]);

  const internalRenameProject = useCallback((projectId, newName) => {
    const oldProject = projects.find(p => p.id === projectId);
    if (!oldProject) return;

    if (projects.some(p => p.id !== projectId && !p.isExample && p.name.toLowerCase() === newName.toLowerCase())) {
        setError(`A project named "${newName}" already exists. Please choose a unique name.`);
        closeProjectNameModal();
        return;
    }

    // Find all projects that link to the project being renamed and update them.
    const projectsWithLinksUpdated = projects.map(proj => {
      if (proj.id === projectId) {
        // This is the project being renamed.
        return { ...proj, name: newName, lastModified: new Date().toISOString() };
      }

      // Check if this project has links to the renamed project.
      if (!proj.treeData) return proj;
      
      let treeData = proj.treeData;
      let wasModified = false;
      const nodesMap = getAllNodesAsMap(treeData);

      nodesMap.forEach(node => {
        if (node.linkedProjectId === projectId) {
          treeData = updateNodeInTree(treeData, node.id, { linkedProjectName: newName });
          wasModified = true;
        }
      });

      if (wasModified) {
        return { ...proj, treeData, lastModified: new Date().toISOString() };
      }
      
      return proj;
    });

    setProjects(projectsWithLinksUpdated);

    if (activeProjectId === projectId) { setInitialPrompt(newName); }
    addHistoryEntry('PROJECT_RENAMED', `Project "${oldProject.name}" renamed to "${newName}". Incoming links updated.`);
    closeProjectNameModal();
  }, [projects, activeProjectId, addHistoryEntry, closeProjectNameModal, setInitialPrompt]);

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
      title: `Delete ${projectToDelete.isExample ? 'Example' : ''} Project?`, message: `Delete "${projectToDelete.name}"? This will also remove any links pointing to it from other projects. This cannot be undone.`,
      confirmText: `Delete ${projectToDelete.isExample ? 'Example' : ''} Project`, cancelText: "Cancel", confirmButtonStyle: 'danger',
      onConfirm: () => {
        
        const projectsWithLinksCleaned = projects
          .filter(p => p.id !== projectId) // Remove the deleted project
          .map(p => { // Check every other project for links TO the deleted one
            if (!p.treeData) return p;
            let treeData = p.treeData;
            let wasModified = false;
            const nodesMap = getAllNodesAsMap(treeData);
            
            nodesMap.forEach(node => {
              if (node.linkedProjectId === projectId) {
                treeData = updateNodeInTree(treeData, node.id, { linkedProjectId: null, linkedProjectName: null });
                wasModified = true;
              }
            });
            
            return wasModified ? { ...p, treeData, lastModified: new Date().toISOString() } : p;
          });

        setProjects(projectsWithLinksCleaned);
        addHistoryEntry('PROJECT_DELETED', `${projectToDelete.isExample ? 'Example p' : 'P'}roject "${projectToDelete.name}" deleted. Dangling links cleaned.`);
        
        if (activeProjectId === projectId) {
            const nextUserProject = projectsWithLinksCleaned.find(p => !p.isExample);
            if(nextUserProject) {
                handleSetActiveProject(nextUserProject.id);
            } else {
                // No more user projects, go to welcome screen state.
                resetTreeForNewProjectContext();
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
         viewStates.setYggdrasilViewMode('graph'); 
        if (projectToLoad.treeData && projectToLoad.treeData.id) {
           viewStates.setSelectedGraphNodeId(projectToLoad.treeData.id); 
        }
    } else {
        setError(`Project with ID ${projectId} not found or view system not ready.`);
    }
  }, [projects, viewStates, handleSetActiveProject, setError]);

  const handlePasteNewProject = useCallback(() => {
    let pastedJson = '';
    const handleInputChange = (e) => {
      pastedJson = e.target.value;
    };

    const parseAndLoad = (jsonString) => {
      try {
        const parsedJson = JSON.parse(jsonString);
        let newProject;

        if (parsedJson.id && parsedJson.name && parsedJson.treeData && parsedJson.lastModified) {
          newProject = { ...parsedJson, treeData: initializeNodes(parsedJson.treeData), isExample: parsedJson.isExample || false };
        } else if (parsedJson.name && (Array.isArray(parsedJson.children) || parsedJson.children === undefined)) {
          newProject = {
            id: generateUUID(), name: parsedJson.name || "Pasted Project",
            treeData: initializeNodes(parsedJson), lastModified: new Date().toISOString(), isExample: false
          };
        } else {
          throw new Error("Invalid JSON structure for a project or tree. It must be a full project object or a single tree node object.");
        }
        
        const existingProjectIndex = projects.findIndex(p => p.id === newProject.id);
        if (existingProjectIndex !== -1) {
          setProjects(prev => { const updated = [...prev]; updated[existingProjectIndex] = newProject; return updated; });
          addHistoryEntry('PROJECT_IMPORTED', `Project "${newProject.name}" updated from pasted JSON.`);
        } else {
          setProjects(prev => [...prev, newProject]);
          addHistoryEntry('PROJECT_IMPORTED', `Project "${newProject.name}" created from pasted JSON.`);
        }
        
        handleSetActiveProject(newProject.id, newProject.isExample);
        setError(null);
        closeConfirmModal();

      } catch (err) {
        setError({ message: err.message, details: err.stack });
        // Don't close the modal on error
      }
    };
    
    openConfirmModal({
      title: "Paste Project JSON",
      message: React.createElement('div', null,
        React.createElement('p', {style: {marginBottom: '10px'}}, 'Paste the complete JSON from your external AI tool below. This can be a full project object or just the root tree node object.'),
        React.createElement('textarea', {
          onChange: handleInputChange,
          style: { width: '100%', minHeight: '200px', resize: 'vertical', fontFamily: 'monospace' },
          placeholder: '{"id": "root...", "name": "...", "children": [...]}'
        })
      ),
      confirmText: "Create Project from JSON",
      onConfirm: () => {
        if (!pastedJson.trim()) {
          setError({ message: "Pasted content is empty." });
          return;
        }
        parseAndLoad(pastedJson);
      },
    });
  }, [projects, setProjects, addHistoryEntry, handleSetActiveProject, setError, openConfirmModal, closeConfirmModal]);

  return {
    projects, activeProjectId, setActiveProjectId,
    handleSetActiveProject, saveNewProject, handleCreateNewProject,
    handleAddNewProjectFromFile, handleSaveActiveProject, handleRenameProject,
    handleDeleteProject, handleSaveCurrentTreeAsExampleProject, handleLoadAndGoToGraph,
    handlePasteNewProject,
    resetTreeForNewProjectContext, initializeDefaultProjects, saveProjectsToLocalStorage, internalRenameProject,
    updateProjectData, 
  };
};