import React, { useState, useCallback, useEffect } from 'react';
import { generateUUID, initializeNodes, findNodeById, updateNodeInTree, getAllNodesAsMap, downloadObjectAsJson, cleanTreeForExport, isValidTechTreeNodeShape } from '../utils.js';
import { APP_STORAGE_KEYS, ELF_WARFARE_STRUCTURE_JSON_STRING, ADVANCED_NATURE_MAGIC_JSON_STRING } from '../constants.js';

const downloadProjectFile = (project, addHistoryEntry) => {
    if (!project) return;
    const filename = `${project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.project.json`;
    downloadObjectAsJson(project, filename);
    if (addHistoryEntry) {
        addHistoryEntry('TREE_DOWNLOADED', `Project "${project.name}" downloaded.`);
    }
};

const _parseImportedJson = (parsedJson) => {
    if (parsedJson.id && parsedJson.name && parsedJson.treeData && parsedJson.lastModified) { // Full project object
        return {
            id: parsedJson.id,
            name: parsedJson.name,
            treeData: parsedJson.treeData,
            isExample: parsedJson.isExample || false,
        };
    }
    if (parsedJson.tree) { // Older project object with context
        return {
            name: parsedJson.context || parsedJson.name,
            treeData: parsedJson.tree,
        };
    }
    if (isValidTechTreeNodeShape(parsedJson)) { // Just a tree node
        return {
            name: parsedJson.name,
            treeData: parsedJson,
        };
    }
    return null;
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
    if (projects.length > 0) {
        localStorage.setItem(APP_STORAGE_KEYS.PROJECT_COLLECTION, JSON.stringify(projects));
    } else {
        localStorage.removeItem(APP_STORAGE_KEYS.PROJECT_COLLECTION);
    }
    if (activeProjectId) {
        localStorage.setItem(APP_STORAGE_KEYS.ACTIVE_PROJECT_ID, activeProjectId);
    } else {
        localStorage.removeItem(APP_STORAGE_KEYS.ACTIVE_PROJECT_ID);
    }
  }, [projects, activeProjectId]);

  useEffect(() => { saveProjectsToLocalStorage(); }, [saveProjectsToLocalStorage]);
  
  const upsertProject = useCallback((project) => {
    setProjects(prev => {
        const index = prev.findIndex(p => p.id === project.id);
        if (index > -1) {
            const updated = [...prev];
            updated[index] = project;
            return updated;
        }
        return [...prev, project];
    });
  }, [setProjects]);
  
  const _updateCrossProjectLinks = useCallback((projectsToUpdate, targetProjectId, linkUpdates) => {
    return projectsToUpdate.map(p => {
        if (!p.treeData) return p;

        let treeData = p.treeData;
        let wasModified = false;
        const nodesMap = getAllNodesAsMap(treeData);

        nodesMap.forEach(node => {
            if (node.linkedProjectId === targetProjectId) {
                treeData = updateNodeInTree(treeData, node.id, linkUpdates);
                wasModified = true;
            }
        });

        return wasModified ? { ...p, treeData, lastModified: new Date().toISOString() } : p;
    });
  }, []);

  const updateProjectData = useCallback((projectId, newTreeData, newName) => {
    setProjects(prevProjects => {
      const projectIndex = prevProjects.findIndex(p => p.id === projectId);
      if (projectIndex === -1) {
        console.warn('updateProjectData: Project not found. ID:', projectId);

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
  }, [activeProjectId, setTechTreeData, setInitialPrompt, setProjects]);

  const handleSetActiveProject = useCallback((projectId, fromExample = false, projectObject = null) => {
    // If a projectObject is provided, use it. Otherwise, find from the projects state array.
    const projectToLoad = projectObject || projects.find(p => p.id === projectId);
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
      if (viewStates) {
        viewStates.setYggdrasilViewMode('graph');
      }
    } else {
      setError({ message: `Project with ID ${projectId} not found.` });
    }
  }, [projects, viewStates, setTechTreeData, setInitialPrompt, addHistoryEntry, setError, setActiveProjectId]);

  const saveNewProject = useCallback((treeToSave, name, isExample = false) => {
    if (!treeToSave) {
        setError({ message: "No tree data to save as project." });
        return null;
    }
    const newProject = {
      id: generateUUID(), name, treeData: cleanTreeForExport(treeToSave),
      lastModified: new Date().toISOString(), isExample,
    };
    setProjects(prev => [...prev, newProject]);
    if (!isExample) {
        setActiveProjectId(newProject.id);
        setInitialPrompt(name);
    }
    addHistoryEntry('PROJECT_CREATED', `${isExample ? 'Example p' : 'P'}roject "${name}" saved.`);
    return newProject;
  }, [addHistoryEntry, setError, setInitialPrompt, setProjects, setActiveProjectId]);

  const internalCreateNewProject = useCallback((name) => {
    if (projects.some(p => !p.isExample && p.name.toLowerCase() === name.toLowerCase())) {
        setError({ message: `A project named "${name}" already exists. Please choose a unique name.` });
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
    if (viewStates && savedProject?.treeData.id) {
        viewStates.setYggdrasilViewMode('graph');
        viewStates.setSelectedGraphNodeId(savedProject.treeData.id);
    }
  }, [projects, setError, resetTreeForNewProjectContext, setTechTreeData, setInitialPrompt, saveNewProject, closeProjectNameModal, viewStates]);
  
  const handleCreateNewProject = useCallback(() => {
    openProjectNameModal({ mode: 'create', onConfirm: internalCreateNewProject });
  }, [openProjectNameModal, internalCreateNewProject]);

  const _loadProjectsFromStorage = useCallback(() => {
    try {
      const storedProjects = localStorage.getItem(APP_STORAGE_KEYS.PROJECT_COLLECTION);
      if (storedProjects) {
        const parsed = JSON.parse(storedProjects);
        if (Array.isArray(parsed) && parsed.every(p => p.id && p.name && p.treeData)) {
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
      if (!newProjects.some(p => p.isExample && p.treeData.id === example.parsedData.tree.id)) {
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
      viewStates?.commonViewResetLogic(false);
      setActiveProjectId(project.isExample ? null : project.id);
      setTechTreeData(initializeNodes(project.treeData));
      setInitialPrompt(project.name);
      if (!startupLogged) {
        addHistoryEntry('PROJECT_LOADED', `Loaded project "${project.name}".`, { source, logId, projectId: project.id });
      }
    };
    
    const storedActiveId = localStorage.getItem(APP_STORAGE_KEYS.ACTIVE_PROJECT_ID);
    const activeProj = storedActiveId ? allProjects.find(p => p.id === storedActiveId && !p.isExample) : null;
    const firstUserProject = allProjects.find(p => !p.isExample);

    if (activeProj) {
      loadProjectState(activeProj, 'localStorage-active');
    } else if (firstUserProject) {
      loadProjectState(firstUserProject, 'fallback-first-user');
    } else {
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
      setError({ message: "A critical error occurred while initializing projects." });
      addHistoryEntry('APP_ERROR_ENCOUNTERED', 'Project initialization failed.', { error: e.message });
    } finally {
        if (!startupLogged) localStorage.setItem(APP_STORAGE_KEYS.STARTUP_LOAD_LOGGED, 'true');
    }
  }, [_loadProjectsFromStorage, _addMissingExampleProjects, _setActiveInitialProject, setProjects, setError, addHistoryEntry]);

  const handleAddNewProjectFromFile = useCallback((event) => {
    const fileInput = event.target;
    const file = fileInput.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result;
          const parsedData = _parseImportedJson(JSON.parse(content));

          if (!parsedData) {
              throw new Error("Invalid JSON structure.");
          }

          const newProject = {
            id: parsedData.id || generateUUID(),
            name: parsedData.name || file.name.replace(/\.json$|\.project\.json$/i, '') || "Imported Project",
            treeData: initializeNodes(parsedData.treeData),
            lastModified: new Date().toISOString(),
            isExample: parsedData.isExample || false,
          };
          
          const isUpdate = projects.some(p => p.id === newProject.id);
          upsertProject(newProject);
          addHistoryEntry('PROJECT_IMPORTED', `Project "${newProject.name}" ${isUpdate ? 'updated' : 'imported'} from ${file.name}.`);
          
          handleSetActiveProject(newProject.id, newProject.isExample, newProject);
          setError(null);
        } catch (err) {
          setError({ message: `Failed to import project: ${err.message}` });
          console.error("Project File Load Error:", err);
        }
      };
      reader.readAsText(file);
    }
    // Reset the input value. This allows selecting the same file again
    // if the user cancels and re-opens the dialog. It must be done
    // after we have the `file` object but before the handler exits.
    fileInput.value = '';
  }, [projects, addHistoryEntry, handleSetActiveProject, setError, upsertProject]);

  const handleSaveActiveProject = useCallback((andDownload = false) => {
    if (!currentTechTreeData) { setError({ message: "No tree data to save." }); return; }
    
    const currentActiveProjectDetails = projects.find(p => p.id === activeProjectId);
    const isSavingExample = currentActiveProjectDetails?.isExample;

    if (!activeProjectId || isSavingExample) {
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
      });
      return;
    }

    const updatedProject = { 
        ...currentActiveProjectDetails, 
        treeData: cleanTreeForExport(currentTechTreeData), 
        name: currentContextText, 
        lastModified: new Date().toISOString(),
    };
    upsertProject(updatedProject);
    addHistoryEntry('PROJECT_SAVED', `Project "${updatedProject.name}" saved.`);
    if (andDownload) {
      downloadProjectFile(updatedProject, addHistoryEntry);
    }
  }, [activeProjectId, currentTechTreeData, projects, currentContextText, addHistoryEntry, openProjectNameModal, saveNewProject, closeProjectNameModal, setInitialPrompt, setError, upsertProject]);

  const internalRenameProject = useCallback((projectId, newName) => {
    const oldProject = projects.find(p => p.id === projectId);
    if (!oldProject) return;

    if (projects.some(p => p.id !== projectId && !p.isExample && p.name.toLowerCase() === newName.toLowerCase())) {
        setError({ message: `A project named "${newName}" already exists. Please choose a unique name.`});
        closeProjectNameModal();
        return;
    }
    
    let updatedProjects = projects.map(proj =>
        proj.id === projectId
            ? { ...proj, name: newName, lastModified: new Date().toISOString() }
            : proj
    );
    updatedProjects = _updateCrossProjectLinks(updatedProjects, projectId, { linkedProjectName: newName });

    setProjects(updatedProjects);

    if (activeProjectId === projectId) { setInitialPrompt(newName); }
    addHistoryEntry('PROJECT_RENAMED', `Project "${oldProject.name}" renamed to "${newName}". Incoming links updated.`);
    closeProjectNameModal();
  }, [projects, activeProjectId, addHistoryEntry, closeProjectNameModal, setInitialPrompt, setProjects, setError, _updateCrossProjectLinks]);

  const handleRenameProject = useCallback((projectIdToRename) => { 
    const projectToRename = projects.find(p => p.id === projectIdToRename && !p.isExample);
    if(projectToRename){
        openProjectNameModal({
            mode: 'rename',
            projectId: projectToRename.id,
            currentName: projectToRename.name,
            onConfirm: (newName) => internalRenameProject(projectToRename.id, newName)
        });
    } else {
        setError({ message: "Project not found for renaming or it's an example." });
    }
  }, [projects, openProjectNameModal, internalRenameProject, setError]);

  const handleDeleteProject = useCallback((projectId) => {
    const projectToDelete = projects.find(p => p.id === projectId);
    if (!projectToDelete) { setError({ message: "Project not found for deletion." }); return; }
    
    openConfirmModal({
      title: `Delete ${projectToDelete.isExample ? 'Example' : ''} Project?`,
      message: `Delete "${projectToDelete.name}"? This will also remove any links pointing to it from other projects. This cannot be undone.`,
      confirmText: `Delete ${projectToDelete.isExample ? 'Example' : ''} Project`,
      cancelText: "Cancel",
      confirmButtonStyle: 'danger',
      onConfirm: () => {
        let remainingProjects = projects.filter(p => p.id !== projectId);
        const projectsWithLinksCleaned = _updateCrossProjectLinks(remainingProjects, projectId, { linkedProjectId: null, linkedProjectName: null });

        setProjects(projectsWithLinksCleaned);
        addHistoryEntry('PROJECT_DELETED', `${projectToDelete.isExample ? 'Example p' : 'P'}roject "${projectToDelete.name}" deleted. Dangling links cleaned.`);
        
        if (activeProjectId === projectId) {
            const nextUserProject = projectsWithLinksCleaned.find(p => !p.isExample);
            if(nextUserProject) {
                handleSetActiveProject(nextUserProject.id, false, nextUserProject);
            } else {
                resetTreeForNewProjectContext();
            }
        }
        closeConfirmModal();
      },
      onCancel: closeConfirmModal,
    });
  }, [projects, activeProjectId, addHistoryEntry, openConfirmModal, closeConfirmModal, setError, handleSetActiveProject, resetTreeForNewProjectContext, setProjects, _updateCrossProjectLinks]);
  
  const internalSaveAsExample = useCallback((name) => {
    if (!currentTechTreeData) { setError({ message: "No tree data to save as example." }); return; }
    saveNewProject(currentTechTreeData, name, true);
    closeProjectNameModal();
  }, [currentTechTreeData, saveNewProject, closeProjectNameModal, setError]);

  const handleSaveCurrentTreeAsExampleProject = useCallback(() => {
    if (!currentTechTreeData) { setError({ message: "No active tree data to save as an example." }); return; }
    openProjectNameModal({ mode: 'createExample', currentName: `Example: ${currentContextText || 'My Custom Structure'}`, onConfirm: internalSaveAsExample });
  }, [currentTechTreeData, currentContextText, openProjectNameModal, internalSaveAsExample, setError]);

  const handleLoadAndGoToGraph = useCallback((projectId) => {
    const projectToLoad = projects.find(p => p.id === projectId);
    if (projectToLoad && viewStates) {
        handleSetActiveProject(projectId, projectToLoad.isExample);
        viewStates.setYggdrasilViewMode('graph'); 
        if (projectToLoad.treeData?.id) {
           viewStates.setSelectedGraphNodeId(projectToLoad.treeData.id); 
        }
    } else {
        setError({ message: `Project with ID ${projectId} not found or view system not ready.` });
    }
  }, [projects, viewStates, handleSetActiveProject, setError]);

  const handlePasteNewProject = useCallback(() => {
    let pastedJson = '';

    const parseAndLoad = (jsonString) => {
      try {
        const parsedData = _parseImportedJson(JSON.parse(jsonString));
        if (!parsedData) {
          throw new Error("Invalid JSON structure for a project or tree.");
        }
        
        const newProject = {
          id: parsedData.id || generateUUID(),
          name: parsedData.name || "Pasted Project",
          treeData: initializeNodes(parsedData.treeData),
          lastModified: new Date().toISOString(),
          isExample: parsedData.isExample || false,
        };
        
        const isUpdate = projects.some(p => p.id === newProject.id);
        upsertProject(newProject);
        addHistoryEntry('PROJECT_IMPORTED', `Project "${newProject.name}" ${isUpdate ? 'updated' : 'created'} from pasted JSON.`);
        
        handleSetActiveProject(newProject.id, newProject.isExample);
        setError(null);
        closeConfirmModal();
      } catch (err) {
        setError({ message: err.message, details: err.stack });
      }
    };
    
    openConfirmModal({
      title: "Paste Project JSON",
      message: React.createElement('div', null,
        React.createElement('p', {style: {marginBottom: '10px'}}, 'Paste the complete JSON below. This can be a full project object or just the root tree node object.'),
        React.createElement('textarea', {
          onChange: e => pastedJson = e.target.value,
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
  }, [projects, upsertProject, addHistoryEntry, handleSetActiveProject, setError, openConfirmModal, closeConfirmModal]);

  return {
    projects, activeProjectId, setActiveProjectId,
    handleSetActiveProject, saveNewProject, handleCreateNewProject,
    handleAddNewProjectFromFile, handleSaveActiveProject, handleRenameProject,
    handleDeleteProject, handleSaveCurrentTreeAsExampleProject, handleLoadAndGoToGraph,
    handlePasteNewProject,
    resetTreeForNewProjectContext, initializeDefaultProjects, saveProjectsToLocalStorage,
    updateProjectData
  };
};