
import { useState, useCallback } from 'react';
import * as geminiService from '../services/geminiService.js';
import { findNodeById, updateNodeInTree, addNodeToParent } from '../utils.js';

export const useAiInsights = ({
  apiKeyIsSet,
  selectedModel,
  historyManager,
  techTreeData,
  contextText,
  setTechTreeData,
  modalManager,
}) => {
  const [aiInsightsIsLoading, setAiInsightsIsLoading] = useState(false);
  const [aiInsightsData, setAiInsightsData] = useState(null);
  const [aiInsightsError, setAiInsightsError] = useState(null);

  const { addHistoryEntry } = historyManager;
  const { openNodeEditModal } = modalManager;

  const handleGenerateProjectInsights = useCallback(async () => {
    if (!apiKeyIsSet || !techTreeData) {
      setAiInsightsError({ message: !apiKeyIsSet ? "API Key not set for insights." : "Project data missing for insights." });
      setAiInsightsData(null);
      return;
    }
    setAiInsightsIsLoading(true);
    setAiInsightsData(null);
    setAiInsightsError(null);
    try {
      const insights = await geminiService.generateProjectInsights(techTreeData, contextText, selectedModel);
      setAiInsightsData(insights);
      addHistoryEntry('NODE_INSIGHTS_GENERATED', `AI project insights generated for "${contextText}".`);
    } catch (e) {
      console.error("Error generating AI project insights:", e);
      setAiInsightsError({ message: e.message || "Failed to generate AI project insights.", details: e.stack });
    } finally {
      setAiInsightsIsLoading(false);
    }
  }, [apiKeyIsSet, selectedModel, techTreeData, contextText, addHistoryEntry]);

  const handleUseSuggestedDescription = useCallback((nodeId, suggestedDescription) => {
    setTechTreeData(prevTree => {
      if (!prevTree) return null;
      const nodeToUpdate = findNodeById(prevTree, nodeId);
      if (nodeToUpdate) {
        const updatedTree = updateNodeInTree(prevTree, nodeId, { description: suggestedDescription });
        addHistoryEntry('NODE_UPDATED', `Node "${nodeToUpdate.name}" description updated via AI insight.`);
        return updatedTree;
      }
      return prevTree;
    });
  }, [setTechTreeData, addHistoryEntry]);
  
  const handleAddSuggestedChildToNode = useCallback((nodeId, childName, childDescription) => {
    const parentNode = findNodeById(techTreeData, nodeId);
    if (parentNode) {
      openNodeEditModal({
        mode: 'addChild', targetNodeId: nodeId, parentNodeName: parentNode.name,
        title: `Add Suggested Child to: ${parentNode.name}`, label: "New Child Name", placeholder: "Confirm or edit child name",
        initialValue: childName, initialDescription: childDescription,
      });
    }
  }, [techTreeData, openNodeEditModal]);

  const handleAddNewBranchToRoot = useCallback((branchName, branchDescription) => {
    if (techTreeData) {
        const updatedTree = addNodeToParent(techTreeData, techTreeData.id, branchName, branchDescription);
        setTechTreeData(updatedTree);
        addHistoryEntry('NODE_CREATED', `New branch "${branchName}" added to root via AI insight.`);
    }
  }, [techTreeData, setTechTreeData, addHistoryEntry]);

  const clearAiInsights = useCallback(() => {
    setAiInsightsData(null);
    setAiInsightsError(null);
  }, []);

  const handleApplyManualInsights = useCallback((jsonString) => {
    try {
      const insights = JSON.parse(jsonString);
      // Basic validation
      if (typeof insights !== 'object' || insights === null || typeof insights.overall_summary !== 'string' || !Array.isArray(insights.key_node_insights) || !Array.isArray(insights.suggested_new_branches)) {
        throw new Error("Invalid JSON structure for project insights.");
      }
      setAiInsightsData(insights);
      setAiInsightsError(null);
      addHistoryEntry('NODE_INSIGHTS_GENERATED', 'AI project insights applied from manual input.');
    } catch (e) {
      console.error("Error applying manual AI project insights:", e);
      setAiInsightsError({ message: `Failed to apply manual insights. ${e.message}`, details: e.stack });
      setAiInsightsData(null);
    }
  }, [addHistoryEntry]);

  return {
    aiInsightsIsLoading, aiInsightsData, aiInsightsError,
    handleGenerateProjectInsights,
    handleUseSuggestedDescription,
    handleAddSuggestedChildToNode,
    handleAddNewBranchToRoot,
    clearAiInsights,
    handleApplyManualInsights,
  };
};
