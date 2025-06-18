
import { useState, useCallback } from 'react';
import * as geminiService from '../services/geminiService.js';
import { getAllNodesAsMap, findNodeById, updateNodeInTree } from '../utils.js';

export const useAiInsights = ({
  apiKeyIsSet,
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

  const handleGenerateAiInsights = useCallback(async (nodeToGetInsightsFor) => {
    if (!nodeToGetInsightsFor || !apiKeyIsSet || !techTreeData) {
      setAiInsightsError(!apiKeyIsSet ? "API Key not set for insights." : "Node data or project context missing for insights.");
      setAiInsightsData(null); return;
    }
    setAiInsightsIsLoading(true); setAiInsightsData(null); setAiInsightsError(null);
    try {
      const allNodes = getAllNodesAsMap(techTreeData);
      const nodeFromMap = allNodes.get(nodeToGetInsightsFor.id);
      if (!nodeFromMap) throw new Error("Focused node not found in the internal node map.");
      const parentNode = nodeFromMap._parentId ? allNodes.get(nodeFromMap._parentId) || null : null;
      const siblingNodes = [];
      if (parentNode && parentNode.children) {
        parentNode.children.forEach(childRef => {
          if (childRef.id !== nodeFromMap.id) { const sibling = allNodes.get(childRef.id); if (sibling) siblingNodes.push(sibling); }
        });
      }
      const childNodes = (nodeFromMap.children || []).map(childRef => allNodes.get(childRef.id)).filter(Boolean);
      const insights = await geminiService.generateNodeInsights(nodeToGetInsightsFor, parentNode, siblingNodes, childNodes, contextText);
      setAiInsightsData(insights);
      addHistoryEntry('NODE_INSIGHTS_GENERATED', `AI insights generated for "${nodeToGetInsightsFor.name}".`);
    } catch (e) { console.error("Error generating AI insights:", e); setAiInsightsError(e.message || "Failed to generate AI insights."); }
    finally { setAiInsightsIsLoading(false); }
  }, [apiKeyIsSet, techTreeData, contextText, addHistoryEntry]);

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
    // No longer clearing the suggestion, the user can see it matches the new description.
  }, [setTechTreeData, addHistoryEntry]);

  const handleUseAlternativeName = useCallback((nodeId, alternativeName) => {
    setTechTreeData(prevTree => {
        if (!prevTree) return null;
        const nodeToUpdate = findNodeById(prevTree, nodeId);
        if (nodeToUpdate) {
            const oldName = nodeToUpdate.name;
            const updatedTree = updateNodeInTree(prevTree, nodeId, { name: alternativeName });
            addHistoryEntry('NODE_UPDATED', `Node "${oldName}" renamed to "${alternativeName}" via AI insight.`);
            return updatedTree;
        }
        return prevTree;
    });
    // No longer removing the name from the list. If the user undoes, the suggestion is still there.
  }, [setTechTreeData, addHistoryEntry]);

  const handleAddSuggestedChildFromInsight = useCallback((parentNodeId, childName, childDescription) => {
    const parentNode = findNodeById(techTreeData, parentNodeId);
    if (parentNode) {
      openNodeEditModal({
        mode: 'addChild', targetNodeId: parentNodeId, parentNodeName: parentNode.name,
        title: `Add Suggested Child to: ${parentNode.name}`, label: "New Child Name", placeholder: "Confirm or edit child name",
        initialValue: childName, initialDescription: childDescription,
      });
    }
  }, [techTreeData, openNodeEditModal]);

  const clearAiInsights = useCallback(() => {
    setAiInsightsData(null);
    setAiInsightsError(null);
  }, []);

  return {
    aiInsightsIsLoading, aiInsightsData, aiInsightsError,
    handleGenerateAiInsights, handleUseSuggestedDescription, handleUseAlternativeName,
    handleAddSuggestedChildFromInsight, clearAiInsights,
  };
};
