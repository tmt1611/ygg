
import React, { useMemo, useEffect, useRef, useState } from 'react';
import { compareAndAnnotateTree, countNodesInTree } from '../utils.js';
import AiSuggestionPreviewListItem from './AiSuggestionPreviewListItem.js';
import ModificationPromptInput from './ModificationPromptInput.js'; 

const AiSuggestionModal = ({
  isOpen,
  currentTreeForDiff,
  suggestion, 
  onConfirm,
  onCancel,
  onRefineSuggestion,
  isRefining,
  apiKeyIsSet,
}) => {
  const applyButtonRef = useRef(null);
  const [followUpPrompt, setFollowUpPrompt] = useState('');

  const comparisonResult = useMemo(() => {
    if (!isOpen || !suggestion) return null;
    
    if (typeof suggestion !== 'object' || suggestion === null || typeof suggestion.name !== 'string' || 
        (suggestion.children !== undefined && suggestion.children !== null && !Array.isArray(suggestion.children))) {
        console.error("Invalid raw suggestion structure passed to AiSuggestionModal:", suggestion);
        const errorNode = { 
            id: 'error-root-' + Date.now(), name: 'Invalid AI Suggestion Structure', 
            description: 'AI returned data that is malformed or not a valid tree structure. Cannot display detailed preview.',
            children: [], isLocked: false, importance: 'common', _changeStatus: 'unchanged', 
            _modificationDetails: ["The AI's suggestion was not a valid tree object."] 
        };
        return { 
            annotatedTree: errorNode, 
            removedNodes: currentTreeForDiff ? [currentTreeForDiff] : [], 
            newNodes: [errorNode], 
            modifiedContentNodes: [], 
            lockedContentChangedNodes: [], 
            structureModifiedNodes: [], 
            reparentedNodes: []
        };
    }
    return compareAndAnnotateTree(currentTreeForDiff, suggestion); 
  }, [currentTreeForDiff, suggestion, isOpen]);

  useEffect(() => {
    if (isOpen) {
      applyButtonRef.current?.focus(); 
      setFollowUpPrompt(''); 
      const handleEscape = (event) => { if (event.key === 'Escape') onCancel(); };
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onCancel]);

  if (!isOpen || !comparisonResult) return null;

  const { annotatedTree, removedNodes, newNodes, modifiedContentNodes, lockedContentChangedNodes, structureModifiedNodes, reparentedNodes } = comparisonResult;
  
  const currentTotalNodes = currentTreeForDiff ? countNodesInTree(currentTreeForDiff) : 0;
  const suggestedTotalNodes = annotatedTree ? countNodesInTree(annotatedTree) : 0; 
  const netChange = suggestedTotalNodes - currentTotalNodes;

  const netChangeStyle = { color: netChange > 0 ? 'var(--success-color)' : netChange < 0 ? 'var(--error-color)' : 'var(--text-secondary)', fontWeight: 'bold' };
  
  const summarySectionStyle = { fontSize: '0.9em', padding: '10px', background: 'var(--panel-alt-bg)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius)' };
  const refinementSectionStyle = { paddingTop: '0px' }; 

  const renderSummaryItem = (label, count, color) => count > 0 && (
    React.createElement(React.Fragment, { key: label },
      React.createElement("div", { style: {color} }, label),
      React.createElement("div", { style: { fontWeight: 'bold', color, textAlign: 'right'}}, count)
    )
  );

  const handleInternalRefine = () => {
    if (followUpPrompt.trim()) {
      onRefineSuggestion(followUpPrompt);
    }
  };

  return (
    React.createElement("div", { className: "modal-overlay-basic", role: "dialog", "aria-modal": "true", "aria-labelledby": "ai-suggestion-modal-title", "aria-describedby": "ai-suggestion-summary" },
      React.createElement("div", { className: "modal-content-basic", style: { display: 'flex', flexDirection: 'column', width: 'clamp(600px, 80vw, 1000px)', maxHeight: '85vh' }},
        React.createElement("h2", { id: "ai-suggestion-modal-title", style: { fontSize: '1.4em', color: 'var(--text-primary)', marginBottom: '15px', flexShrink: 0 }},
          "AI Modification Preview"
        ),
        
        React.createElement("div", { style: { display: 'flex', flexGrow: 1, gap: '20px', overflow: 'hidden' }},
          React.createElement("div", { style: { flex: '0 0 60%', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius)', background: 'var(--app-bg)' }},
            React.createElement("h3", { style: { fontSize: '1.15em', fontWeight: '600', color: 'var(--text-primary)', padding: '10px', margin: 0, borderBottom: '1px solid var(--border-color)', flexShrink: 0 }},
              "Suggested Structure (Visual Diff):"
            ),
            React.createElement("div", { style: { flexGrow: 1, overflowY: 'auto', padding: '10px' }, "aria-live": "polite", "aria-atomic": "true" },
              annotatedTree && annotatedTree.id !== 'error-root-' + Date.now() ? (
                React.createElement("ul", { style: { listStyle: 'none', padding: 0, margin: 0 }},
                    React.createElement(AiSuggestionPreviewListItem, { node: annotatedTree, level: 0, isVisualDiff: true })
                )
              ) : (
                React.createElement("p", {style: {color: 'var(--error-color)', fontWeight: 'bold', padding: '10px'}}, annotatedTree?.description || "Could not display preview due to malformed AI suggestion.")
              ),
              removedNodes.length > 0 && (
                React.createElement("div", { style: { marginTop: '15px', paddingTop: '10px', borderTop: '1px solid var(--border-color)' }},
                    React.createElement("h4", { style: { fontSize: '0.95em', fontWeight: '600', color: 'var(--error-color)', marginBottom: '8px' }}, "Nodes To Be Removed (", removedNodes.length, "):"),
                    React.createElement("ul", { style: { fontSize: '0.85em', color: 'var(--text-secondary)', listStyle: 'none', padding: 0, maxHeight: '120px', overflowY: 'auto' }},
                        removedNodes.map(node => (
                            React.createElement("li", { key: `removed-${node.id}`, style: { padding: '3px 0', borderBottom: '1px dotted var(--border-color)', textDecoration: 'line-through' }}, 
                              React.createElement("strong", null, node.name), " ", node.description && `- "${node.description.substring(0, 40)}${node.description.length > 40 ? '...' : ''}"`,
                              React.createElement("span", {style: {color: 'var(--error-color)', fontSize: '0.8em'}}, " (ID: ", node.id.substring(0,8), "...)")
                            )
                        ))
                    )
                )
              )
            )
          ),

          React.createElement("div", { style: { flex: '1 1 40%', display: 'flex', flexDirection: 'column', gap: '15px', overflowY: 'auto', padding: '0 5px 5px 0' }},
            React.createElement("div", { id: "ai-suggestion-summary", style: summarySectionStyle },
              React.createElement("p", { style: { fontWeight: '600', fontSize: '1.0em', marginBottom: '8px', color: 'var(--text-primary)' }}, "Summary of Changes:"),
              React.createElement("div", { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 10px', alignItems: 'center' }},
                React.createElement("div", null, React.createElement("strong", null, "Node Count:")),
                React.createElement("div", { style: {textAlign: 'right'} }, currentTotalNodes, " → ", suggestedTotalNodes, " (", React.createElement("span", { style: netChangeStyle }, netChange >= 0 ? '+' : '', netChange), ")"),

                renderSummaryItem("➕ Added", newNodes.length, 'var(--success-color)'),
                renderSummaryItem("➖ Removed", removedNodes.length, 'var(--error-color)'),
                renderSummaryItem("✏️ Modified", modifiedContentNodes.length, 'var(--primary-accent)'),
                renderSummaryItem("📂 Structure", structureModifiedNodes.length, 'var(--secondary-accent-dark)'),
                renderSummaryItem("↪️ Moved", reparentedNodes.length, 'var(--warning-color)')
              ),
              lockedContentChangedNodes.length > 0 && 
                React.createElement("p", { style: { fontWeight: 'bold', color: 'var(--error-color)', padding: '8px', background: 'var(--error-bg)', border: '1px solid var(--error-color)', borderRadius: 'var(--border-radius)', marginTop: '10px' }},
                  "CRITICAL: Locked Node Content Modified: ", React.createElement("span", { style: { fontSize: '1.1em', marginLeft:'5px' }}, lockedContentChangedNodes.length)
                )
            ),
            
            React.createElement("div", { style: refinementSectionStyle },
                React.createElement(ModificationPromptInput, {
                    prompt: followUpPrompt,
                    setPrompt: setFollowUpPrompt,
                    onModify: handleInternalRefine,
                    isLoading: isRefining,
                    disabled: !apiKeyIsSet || isRefining || annotatedTree?.id.startsWith('error-root-'),
                    isApiKeySet: apiKeyIsSet,
                    hasTreeData: !!suggestion, 
                    labelOverride: "Refine This Suggestion:"
                })
            ),
            
            React.createElement("p", { style: { fontSize: '0.85em', color: 'var(--text-secondary)', marginTop: 'auto', flexShrink: 0 }},
              "Review carefully. Applying overwrites the current state. Locked node content should NOT be changed."
            )
          )
        ),
        
        React.createElement("div", { style: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', paddingTop: '15px', borderTop: '1px solid var(--border-color)', flexShrink: 0 }},
          React.createElement("button", { type: "button", onClick: onCancel, className: "secondary" }, "Reject Suggestion"),
          React.createElement("button", { ref: applyButtonRef, type: "button", onClick: onConfirm, className: "primary",
            style: { background: 'var(--success-color)', borderColor: 'var(--success-color)' },
            disabled: annotatedTree?.id.startsWith('error-root-') || isRefining
            },
            "Apply Changes to Project"
          )
        )
      )
    )
  );
};
export default AiSuggestionModal;
