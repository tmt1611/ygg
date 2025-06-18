
import React, { useState, useCallback, useEffect, useMemo } from 'react';

// Components
import KnowledgeBranchSidebar from './components/KnowledgeBranchSidebar.js';
import YggdrasilTopBar from './components/YggdrasilTopBar.js'; 
import LoadingSpinner from './components/LoadingSpinner.js';
import ErrorMessage from './components/ErrorMessage.js';
import MainContentRouter from './components/MainContentRouter.js'; 
import AppModals from './components/AppModals.js'; 
import WhisperingRunesPanel from './components/WhisperingRunesPanel.js';


// Hooks
import { useAppThemeAndLayout } from './hooks/useAppThemeAndLayout.js';
import { useHistoryManager } from './hooks/useHistoryManager.js';
import { useModalManager } from './hooks/useModalManager.js';
import { useProjectManagement } from './hooks/useProjectManagement.js';
import { useViewStates } from './hooks/useViewStates.js';
import { useNodeOperations } from './hooks/useNodeOperations.js';
import { useTreeOperationsAI } from './hooks/useTreeOperationsAI.js';
import { useAiInsights } from './hooks/useAiInsights.js';
import { useProjectLinking } from './hooks/useProjectLinking.js';
import { useApiKey } from './hooks/useApiKey.js';

// Services & Utils
import * as geminiService from './services/geminiService.js';
import { findNodeById, countNodesInTree, getTreeDepth, getLockedNodeIds, countNodesByImportance } from './utils.js';




const App = () => {
  // --- STATE ---
  const [techTreeData, setTechTreeData] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isModifying, setIsModifying] = useState(false);
  const [initialPrompt, setInitialPrompt] = useState('');
  const [modificationPrompt, setModificationPrompt] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  
  const [previousTreeStateForUndo, setPreviousTreeStateForUndo] = useState(null);
  const [baseForModalDiff, setBaseForModalDiff] = useState(null); 

  const [selectedNodeForInsights, setSelectedNodeForInsights] = useState(null);
  const [isNodeActionsPanelVisible, setIsNodeActionsPanelVisible] = useState(true); 

  const [strategicSuggestions, setStrategicSuggestions] = useState(null);
  const [isFetchingStrategicSuggestions, setIsFetchingStrategicSuggestions] = useState(false);
  const [strategicSuggestionsError, setStrategicSuggestionsError] = useState(null);
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');


  // --- HOOKS ---
  const historyManager = useHistoryManager();
  const { addHistoryEntry } = historyManager;

  const appThemeAndLayout = useAppThemeAndLayout(addHistoryEntry);
  const {
    themeMode, isSidebarCollapsed, yggdrasilViewMode, activeOverlayPanel,
    toggleTheme, toggleSidebar, setYggdrasilViewMode, setActiveOverlayPanel
  } = appThemeAndLayout;
  
  const [activeSidebarTab, setActiveSidebarTab] = useState('ai-tools');


  const modalManager = useModalManager();
  const {
    pendingAiSuggestion, isAiSuggestionModalOpen,
    setPendingAiSuggestion 
  } = modalManager;

  const viewStates = useViewStates({
    techTreeData, setError, modalManager, addHistoryEntry,
    setYggdrasilViewMode, setActiveOverlayPanel
  });
  const { focusNodeId, selectedGraphNodeId, setSelectedGraphNodeId, handleSwitchToFocusView } = viewStates;

  const projectManager = useProjectManagement({
    modalManager, historyManager, viewStates,
    currentTechTreeData: techTreeData, currentContextText: initialPrompt,
    setTechTreeData, setContextText: setInitialPrompt,
    setInitialPromptFromHook: setInitialPrompt, setError
  });
  const { projects, activeProjectId } = projectManager;


  const nodeOperations = useNodeOperations({
    techTreeData, setTechTreeData, modalManager, historyManager, projectManager, viewStates
  });

  const apiKeyHook = useApiKey(addHistoryEntry); 

  const treeOperationsAI = useTreeOperationsAI({
    apiKeyIsSet: apiKeyHook.status.isSet,
    modalManager, historyManager, projectManager, viewStates, setError,
    techTreeData, setTechTreeData, contextText: initialPrompt, initialPrompt,
    previousTreeStateForUndoProp: previousTreeStateForUndo, setPreviousTreeStateForUndo,
    baseForModalDiffProp: baseForModalDiff, setBaseForModalDiff, 
    setIsLoading, setIsModifying, setModificationPromptFromHook: setModificationPrompt
  });

  const aiInsightsHook = useAiInsights({
    apiKeyIsSet: apiKeyHook.status.isSet,
    historyManager, techTreeData, contextText: initialPrompt, setTechTreeData,
    nodeOperationsHook: nodeOperations, modalManager
  });
  const { aiInsightsData, aiInsightsIsLoading, aiInsightsError, handleGenerateAiInsights } = aiInsightsHook;


  const projectLinkingHook = useProjectLinking({
    techTreeData, setTechTreeData, projectManager, modalManager, historyManager, viewStates,
    yggdrasilViewMode, activeOverlayPanel 
  });

  // --- EFFECTS ---
  useEffect(() => {
    projectManager.initializeDefaultProjects();
    if (!techTreeData && (pendingAiSuggestion || previousTreeStateForUndo || baseForModalDiff)) {
        setPendingAiSuggestion(null);
        setPreviousTreeStateForUndo(null);
        setBaseForModalDiff(null);
        setModificationPrompt(''); 
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  useEffect(() => {
    if (!techTreeData && (pendingAiSuggestion || previousTreeStateForUndo || baseForModalDiff)) {
        setPendingAiSuggestion(null);
        setPreviousTreeStateForUndo(null);
        setBaseForModalDiff(null);
        setModificationPrompt(''); 
        if (isAiSuggestionModalOpen) modalManager.closeAiSuggestionModal();
    }
  }, [techTreeData, pendingAiSuggestion, previousTreeStateForUndo, baseForModalDiff, isAiSuggestionModalOpen, modalManager.closeAiSuggestionModal, setPendingAiSuggestion]);


  // --- Event Handlers & Callbacks ---
  const handleDownloadTreeData = useCallback(() => {
    projectManager.handleSaveActiveProject(true);
  }, [projectManager]);

  const handleExtractData = useCallback(async () => {
    if (!techTreeData) { setError("No data to extract."); return; }
    let contentToDisplay = "";
    let title = "Extracted Data";
    if (modalManager.extractionMode === 'summary') {
      if (!apiKeyHook.status.isSet) { setError("API Key required for summary."); return; }
      setIsSummarizing(true); setError(null);
      try {
        const projectSummaryContext = `Project: ${initialPrompt || 'Unnamed Project'}\nContext: ${initialPrompt}\nNodes:\n${JSON.stringify(techTreeData, (key, value) => (key.startsWith('_') ? undefined : value), 2)}`;
        contentToDisplay = await geminiService.summarizeText(projectSummaryContext);
        title = "AI Generated Summary";
        addHistoryEntry('AI_SUMMARY_GEN', 'AI summary generated for the current tree.');
      } catch (e) { setError(e.message || "Failed to generate summary."); setIsSummarizing(false); return; }
      finally { setIsSummarizing(false); }
    } else { // raw
      title = "Raw Project Data (Text)";
      const projectData = {
        context: initialPrompt,
        tree: techTreeData,
      };
      contentToDisplay = JSON.stringify(projectData, null, 2);
      addHistoryEntry('TREE_DATA_EXTRACTED', 'Raw tree data extracted.');
    }
    modalManager.openTechExtractionModal(contentToDisplay, title, modalManager.extractionMode);
  }, [techTreeData, modalManager, initialPrompt, apiKeyHook.status.isSet, setError, addHistoryEntry, setIsSummarizing]);

  const handleNodeSelectedForInsightsOrActions = useCallback((nodeId) => {
    if (nodeId && techTreeData) {
      const node = findNodeById(techTreeData, nodeId);
      setSelectedNodeForInsights(node); 
      setSelectedGraphNodeId(nodeId); 
    } else {
      setSelectedNodeForInsights(null);
      setSelectedGraphNodeId(null);
      aiInsightsHook.clearAiInsights(); 
    }
  }, [techTreeData, setSelectedGraphNodeId, aiInsightsHook]); 

  const toggleNodeActionsPanelVisibility = useCallback(() => {
    setIsNodeActionsPanelVisible(prev => !prev);
  }, []);


  const currentTreeStats = useMemo(() => {
      if (!techTreeData) return null;
      return {
          totalNodes: techTreeData ? countNodesInTree(techTreeData) : 0,
          depth: techTreeData ? getTreeDepth(techTreeData) : 0,
          lockedCount: techTreeData ? getLockedNodeIds(techTreeData).length : 0,
          importanceCounts: techTreeData ? countNodesByImportance(techTreeData) : {minor:0, common:0, major:0},
      };
  }, [techTreeData]);

  const activeProjectNameForDisplay = useMemo(() => {
    if (activeProjectId) {
      return projects.find(p => p.id === activeProjectId)?.name || initialPrompt || "Unnamed Project";
    }
    return initialPrompt || "Unsaved Project";
  }, [activeProjectId, projects, initialPrompt]);

  const handleGenerateStrategicSuggestions = useCallback(async () => {
    if (!apiKeyHook.status.isSet || !initialPrompt.trim()) {
      setStrategicSuggestionsError("API Key must be set and project context (initial prompt) must be provided.");
      return;
    }
    setIsFetchingStrategicSuggestions(true);
    setStrategicSuggestions(null);
    setStrategicSuggestionsError(null);
    try {
      let treeSummary = "No current tree structure or it's empty.";
      if (techTreeData) {
        treeSummary = `Current main branches: ${techTreeData.children?.map(c => c.name).join(', ') || 'None (root only)'}. Total nodes: ${countNodesInTree(techTreeData)}.`;
      }
      const suggestions = await geminiService.generateStrategicSuggestions(initialPrompt, treeSummary);
      setStrategicSuggestions(suggestions);
      addHistoryEntry('AI_STRATEGY_GEN', 'AI strategic suggestions generated for project.');
    } catch (e) {
      console.error("Error generating strategic suggestions:", e);
      setStrategicSuggestionsError(e.message || "Failed to fetch strategic suggestions from AI.");
    } finally {
      setIsFetchingStrategicSuggestions(false);
    }
  }, [apiKeyHook.status.isSet, initialPrompt, techTreeData, addHistoryEntry]);

  const canUndoAiModForSidebar = !!previousTreeStateForUndo || !!pendingAiSuggestion;

  // --- RENDER ---
  return (
    React.createElement("div", { className: `yggdrasil-app-outer-wrapper theme-${themeMode}` },
      React.createElement(YggdrasilTopBar, {
        themeMode: themeMode,
        onToggleTheme: toggleTheme,
        apiKeyIsSet: apiKeyHook.status.isSet,
        activeProjectName: activeProjectNameForDisplay,
        onSaveActiveProject: () => projectManager.handleSaveActiveProject(false),
        onDownloadActiveProject: handleDownloadTreeData,
        isAppBusy: isLoading || isModifying || isFetchingStrategicSuggestions,
        hasTechTreeData: !!techTreeData,
        yggdrasilViewMode: yggdrasilViewMode,
        activeOverlayPanel: activeOverlayPanel,
        setYggdrasilViewMode: setYggdrasilViewMode,
        setActiveOverlayPanel: setActiveOverlayPanel,
        focusNodeId: focusNodeId,
        globalSearchTerm: globalSearchTerm,
        setGlobalSearchTerm: setGlobalSearchTerm
      }),
      React.createElement("div", { className: `yggdrasil-app-body theme-${themeMode} view-mode-${yggdrasilViewMode} ${isSidebarCollapsed ? 'sidebar-collapsed' : ''} ${activeOverlayPanel ? 'overlay-panel-active' : ''}` },
        React.createElement(KnowledgeBranchSidebar, {
          isCollapsed: isSidebarCollapsed,
          onToggleSidebar: toggleSidebar,
          activeSidebarTab: activeSidebarTab,
          setActiveSidebarTab: setActiveSidebarTab,
          themeMode: themeMode, 
          modificationPrompt: modificationPrompt,
          setModificationPrompt: setModificationPrompt,
          onModifyAiTree: () => treeOperationsAI.handleApplyAiModification(modificationPrompt),
          isAiModifying: isModifying,
          canUndoAiMod: canUndoAiModForSidebar,
          onUndoAiModification: treeOperationsAI.handleUndoAiModification,
          isAiSuggestionModalOpen: modalManager.isAiSuggestionModalOpen,
          initialPromptForStrategy: initialPrompt,
          techTreeDataForStrategy: techTreeData,
          strategicSuggestions: strategicSuggestions,
          isFetchingStrategicSuggestions: isFetchingStrategicSuggestions,
          strategicSuggestionsError: strategicSuggestionsError,
          onGenerateStrategicSuggestions: handleGenerateStrategicSuggestions,
          apiKeyIsSet: apiKeyHook.status.isSet,
          hasTechTreeData: !!techTreeData,
          isAppBusy: isLoading || isModifying || isFetchingStrategicSuggestions,
          selectedNodeForInsights: selectedNodeForInsights,
          aiInsightsData: aiInsightsData,
          aiInsightsIsLoading: aiInsightsIsLoading,
          aiInsightsError: aiInsightsError,
          onGenerateAiNodeInsights: () => handleGenerateAiInsights(selectedNodeForInsights),
          onUseSuggestedDescription: (desc) => aiInsightsHook.handleUseSuggestedDescription(selectedNodeForInsights.id, desc),
          onUseAlternativeName: (altName) => aiInsightsHook.handleUseAlternativeName(selectedNodeForInsights.id, altName),
          onAddSuggestedChildFromInsight: (name, desc) => aiInsightsHook.handleAddSuggestedChildFromInsight(selectedNodeForInsights.id, name, desc),
          history: historyManager.history
        }),
        
        React.createElement("main", { className: "yggdrasil-core-canvas" },
          isLoading && React.createElement(LoadingSpinner, { message: "Generating Structure..." }),
          isModifying && !isAiSuggestionModalOpen && React.createElement(LoadingSpinner, { message: "AI Applying Modifications..." }),
          error && React.createElement(ErrorMessage, { message: error }),

          React.createElement(MainContentRouter, {
            yggdrasilViewMode: yggdrasilViewMode,
            activeOverlayPanel: activeOverlayPanel,
            setActiveOverlayPanel: setActiveOverlayPanel,
            techTreeData: techTreeData,
            isLoading: isLoading,
            isModifying: isModifying,
            isAppBusy: isLoading || isModifying || isFetchingStrategicSuggestions,
            projectManager: projectManager,
            initialPrompt: initialPrompt,
            setInitialPrompt: setInitialPrompt,
            currentTreeStats: currentTreeStats,
            nodeOperations: nodeOperations,
            viewStates: { ...viewStates, globalSearchTerm },
            treeOperationsAI: treeOperationsAI,
            apiKeyHook: apiKeyHook,
            onExtractData: handleExtractData,
            extractionMode: modalManager.extractionMode,
            setExtractionMode: modalManager.setExtractionMode,
            isSummarizing: isSummarizing,
            projectLinkingHook: projectLinkingHook,
            handleNodeSelectedForInsightsOrActions: handleNodeSelectedForInsightsOrActions,
            onToggleNodeActionsPanel: toggleNodeActionsPanelVisibility,
            modalManager: modalManager
          })
        )
      ), 

      isNodeActionsPanelVisible && yggdrasilViewMode === 'treeView' && activeOverlayPanel === null && (
        React.createElement(WhisperingRunesPanel, {
          targetNodeId: selectedNodeForInsights?.id || null,
          treeData: techTreeData,
          onOpenNodeEditModal: modalManager.openNodeEditModal,
          onToggleLock: nodeOperations.handleToggleNodeLock,
          onNodeImportanceChange: nodeOperations.handleNodeImportanceChange,
          onLinkToProject: projectLinkingHook.handleOpenLinkProjectModal,
          onGoToLinkedProject: projectLinkingHook.handleNavigateToLinkedProject,
          onUnlinkProject: projectLinkingHook.handleUnlinkProjectFromNode,
          onDeleteNode: nodeOperations.handleDeleteNodeAndChildren,
          onSetFocusNode: viewStates.handleSwitchToFocusView,
          onGenerateInsights: handleGenerateAiInsights,
          isAppBusy: isLoading || isModifying || isFetchingStrategicSuggestions,
          activeOverlayPanel: activeOverlayPanel,
          yggdrasilViewMode: yggdrasilViewMode,
          projects: projectManager.projects,
          activeProjectId: projectManager.activeProjectId,
          currentProjectRootId: techTreeData?.id,
          findLinkSource: projectLinkingHook.findLinkSource,
          handleNavigateToSourceNode: projectLinkingHook.handleNavigateToSourceNode
        })
      ),

      React.createElement(AppModals, {
        modalManager: modalManager,
        pendingAiSuggestion: pendingAiSuggestion, 
        baseForModalDiff: baseForModalDiff,
        treeOperationsAI: treeOperationsAI,
        isModifying: isModifying,
        apiKeyIsSet: apiKeyHook.status.isSet,
        handleConfirmNodeEdit: nodeOperations.handleConfirmNodeEdit,
        projectLinkingHook: projectLinkingHook,
        techTreeData: techTreeData,
        nodeOperations: nodeOperations,
        handleSwitchToFocusView: viewStates.handleSwitchToFocusView,
        projects: projectManager.projects,
        activeProjectId: projectManager.activeProjectId
      })
    )
  );
};

export default App;
