import React, { useState, useEffect } from 'react';
import ProjectManagementPanel from '../panels/ProjectManagementPanel.js';
import ApiKeySetupPanel from '../panels/ApiKeySetupPanel.js';
import AiGenerationPanel from '../panels/AiGenerationPanel.js';
import DataOperationsPanel from '../panels/DataOperationsPanel.js';
import CollapsiblePanel from '../CollapsiblePanel.js';
import ContextualHelpTooltip from '../ContextualHelpTooltip.js';
import { APP_STORAGE_KEYS } from '../../constants.js';
import { getPromptTextFor } from '../../services/geminiService.js';

const StatDisplay = ({ label, value, valueClassName }) => (
  React.createElement("div", { className: "stat-item" },
    React.createElement("span", { className: "stat-label" }, label),
    React.createElement("span", { className: `stat-value ${valueClassName || ''}` }, value)
  )
);

const WorkspaceTabContent = ({
  projects, activeProjectId, onLoadProject, onRenameProject, onDeleteProject, onAddNewProjectFromFile, onCreateEmptyProject, onSaveAsExample, onLoadAndGoToGraph, onPasteNewProject,
  initialPrompt, setInitialPrompt, handleGenerateTree, isLoadingInitial, handleDownloadTree,
  apiKeyHook,
  onExtractData, extractionMode, setExtractionMode, isSummarizing,
  isAppBusy,
  currentTreeStats,
  contextText,
  techTreeData,
  handleToggleAllLock,
  modalManager,
}) => {

  const [collapsedPanels, setCollapsedPanels] = useState(() => {
    const savedState = localStorage.getItem(APP_STORAGE_KEYS.WORKSPACE_PANEL_STATES);
    try {
        if (savedState) {
            const parsed = JSON.parse(savedState);
            return new Set(Array.isArray(parsed) ? parsed : []);
        }
    } catch (e) {
        console.error("Failed to parse workspace panel states from localStorage", e);
    }
    return new Set([]); // Keep panels open by default
  });

  const handleShowGenerationPrompt = () => {
    if (!initialPrompt.trim()) return;
    const promptText = getPromptTextFor('generateTree', { prompt: initialPrompt });
    modalManager.openTechExtractionModal(promptText, "AI Structure Generation Prompt");
  };

  useEffect(() => {
    localStorage.setItem(APP_STORAGE_KEYS.WORKSPACE_PANEL_STATES, JSON.stringify(Array.from(collapsedPanels)));
  }, [collapsedPanels]);

  const handleTogglePanel = (panelId) => {
    setCollapsedPanels(prev => {
      const newSet = new Set(prev);
      if (newSet.has(panelId)) {
        newSet.delete(panelId);
      } else {
        newSet.add(panelId);
      }
      return newSet;
    });
  };

  const controlsDisabled = isAppBusy; 
  const generateUIDisabled = controlsDisabled || !apiKeyHook.status.isSet;
  const activeUserProjectExists = !!(activeProjectId && projects.find(p => p.id === activeProjectId && !p.isExample)); 
  const currentTreeExists = !!(projects.find(p => p.id === activeProjectId));

  return (
    React.createElement("div", { className: "workspace-tab-container" },
      React.createElement("div", { className: "workspace-content-area", style: { display: 'flex', flexDirection: 'column', gap: '15px' }}, 
          React.createElement("div", { className: "panel panel-variant-workspace" },
            React.createElement("div", { className: "collapsible-panel-header", style: { cursor: 'default' } },
              React.createElement("span", { className: "panel-header-icon" }, "🔑"),
              React.createElement("h3", null, "API Key Setup"),
              React.createElement("div", { style: { marginLeft: 'auto' } },
                React.createElement(ContextualHelpTooltip, { helpText: "Configure your Gemini API Key to enable all AI-powered features in the application." })
              )
            ),
            React.createElement("div", { className: "panel-content-wrapper" },
              React.createElement(ApiKeySetupPanel, { apiKeyHook, controlsDisabled })
            )
          ),
          React.createElement(CollapsiblePanel, {
            panelId: "project-management",
            title: "Project Management",
            icon: "🗂️",
            variant: "workspace",
            isCollapsed: collapsedPanels.has('project-management'),
            onToggle: handleTogglePanel,
            headerActions: React.createElement(ContextualHelpTooltip, { helpText: "Manage your saved projects and examples. Create new projects, import from files, or load existing work." })
          },
            React.createElement(ProjectManagementPanel, {
              projects, activeProjectId, onLoadProject, onRenameProject, onDeleteProject, 
              onAddNewProjectFromFile, onCreateEmptyProject, onSaveAsExample, onLoadAndGoToGraph,
              onPasteNewProject: projectManager.handlePasteNewProject,
              isAppBusy, currentTreeExists
            })
          ),
          React.createElement(CollapsiblePanel, {
            panelId: "ai-generation",
            title: "AI Structure Generation",
            icon: "🧠",
            variant: "workspace",
            isCollapsed: collapsedPanels.has('ai-generation'),
            onToggle: handleTogglePanel,
            headerActions: React.createElement(ContextualHelpTooltip, { helpText: "Use AI to generate a new tree structure from a topic or regenerate the structure for the current project's context." })
          },
            React.createElement(AiGenerationPanel, {
              initialPrompt, setInitialPrompt, handleGenerateTree, isLoadingInitial,
              generateUIDisabled, activeUserProjectExists, apiKeyIsSet: apiKeyHook.status.isSet,
              handleShowPrompt: handleShowGenerationPrompt
            })
          ),
          React.createElement(CollapsiblePanel, {
            panelId: "project-overview",
            title: "Project Overview",
            icon: "📊",
            variant: "workspace",
            isCollapsed: collapsedPanels.has('project-overview'),
            onToggle: handleTogglePanel
          },
            currentTreeStats ? (
              React.createElement(React.Fragment, null,
                React.createElement("div", { style: {display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}},
                    React.createElement("h3", { className: "panel-header", style: {margin: 0, fontSize: '1.2em'}},
                      "Overview: ", contextText || 'Current Project'
                    ),
                    React.createElement("button", { 
                        onClick: handleToggleAllLock, 
                        disabled: isAppBusy, 
                        className: "secondary panel-button",
                        style: {padding: '5px 10px', fontSize: '0.9em'},
                        title: currentTreeStats.isAllLocked ? 'Unlock all nodes in the current project' : 'Lock all nodes in the current project to prevent changes'
                    },
                        currentTreeStats.isAllLocked ? '🔓 Unlock All' : '🔒 Lock All'
                    )
                ),
                React.createElement("div", { className: "project-stats-grid" },
                  React.createElement(StatDisplay, { label: "Total Nodes", value: currentTreeStats.totalNodes }),
                  React.createElement(StatDisplay, { label: "Maximum Depth", value: currentTreeStats.depth }),
                  React.createElement(StatDisplay, { label: "Locked Nodes", value: currentTreeStats.lockedCount, valueClassName: currentTreeStats.lockedCount > 0 ? 'locked' : '' }),
                  React.createElement(StatDisplay, { label: "Minor Nodes", value: currentTreeStats.importanceCounts.minor, valueClassName: "importance-minor" }),
                  React.createElement(StatDisplay, { label: "Common Nodes", value: currentTreeStats.importanceCounts.common, valueClassName: "importance-common" }),
                  React.createElement(StatDisplay, { label: "Major Nodes", value: currentTreeStats.importanceCounts.major, valueClassName: "importance-major" })
                )
              )
            ) : (
              React.createElement("p", { style: { color: 'var(--text-secondary)', textAlign: 'center', padding: '10px 0' }},
                "Load or create a project to view its statistics."
              )
            )
          ),
          React.createElement(CollapsiblePanel, {
            panelId: "data-operations",
            title: "Data Operations",
            icon: "📤",
            variant: "workspace",
            isCollapsed: collapsedPanels.has('data-operations'),
            onToggle: handleTogglePanel,
            headerActions: React.createElement(ContextualHelpTooltip, { helpText: "Save and download the active project, or extract data as raw text or an AI-generated summary." })
          },
            React.createElement(DataOperationsPanel, {
              handleDownloadTree, onExtractData, extractionMode, setExtractionMode, isSummarizing,
              currentTreeExists, controlsDisabled, apiKeyIsSet: apiKeyHook.status.isSet,
              modalManager,
              techTreeData: techTreeData,
              contextText: contextText
            })
          )
      )
    )
  );
};

export default WorkspaceTabContent;