
import React, { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import { compareAndAnnotateTree, countNodesInTree, isValidTechTreeNodeShape, getAllNodesAsMap } from '../utils.js';
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
  const [isRemovedNodesCollapsed, setIsRemovedNodesCollapsed] = useState(true);

  const comparisonResult = useMemo(() => {
    if (!isOpen || !suggestion) return null;

    if (!isValidTechTreeNodeShape(suggestion)) {
        console.error("Invalid raw suggestion structure passed to AiSuggestionModal:", suggestion);
        const errorNode = {
            id: 'error-root-' + Date.now(), name: 'Invalid AI Suggestion Structure',
            description: 'AI returned data that is malformed or not a valid tree structure. This can happen if the AI fails to generate a response with all the required fields (like name, description, children, etc.).',
            children: [], isLocked: false, importance: 'common', _changeStatus: 'unchanged',
            _modificationDetails: ["The AI's suggestion was not a valid tree object."],
            _isErrorNode: true
        };
        return {
            annotatedTree: errorNode,
            removedNodes: currentTreeForDiff ? [...getAllNodesAsMap(currentTreeForDiff).values()] : [],
            newNodes: [],
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

  const { annotatedTree, removedNodes, newNodes, modifiedContentNodes, lockedContentChangedNodes, structureModifiedNodes, reparentedNodes, lockedNodesRemoved } = comparisonResult;

  const currentTotalNodes = currentTreeForDiff ? countNodesInTree(currentTreeForDiff) : 0;
  const suggestedTotalNodes = annotatedTree ? countNodesInTree(annotatedTree) : 0;
  const netChange = suggestedTotalNodes - currentTotalNodes;

  const netChangeStyle = { color: netChange > 0 ? 'var(--success-color)' : netChange < 0 ? 'var(--error-color)' : 'var(--text-secondary)'};

  const renderSummaryItem = (label, count, color, icon) => {
    if (count <= 0) return null;
    return (
      React.createElement("div", { key: label, className: "ai-suggestion-modal-summary-item", style: { backgroundColor: color ? `${color}1A` : 'transparent' } },
        React.createElement("span", { className: "summary-label" },
          React.createElement("span", { className: "summary-icon", style: { color: color || 'var(--text-secondary)'} }, icon),
          label
        ),
        React.createElement("span", { className: "summary-value", style: { color: color || 'var(--text-primary)' } }, count)
      )
    );
  };

  const handleInternalRefine = () => {
    if (followUpPrompt.trim()) {
      onRefineSuggestion(followUpPrompt);
    }
  };

  return (
    React.createElement("div", { className: "modal-overlay-basic", role: "dialog", "aria-modal": "true", "aria-labelledby": "ai-suggestion-modal-title", "aria-describedby": "ai-suggestion-summary" },
      React.createElement("div", { className: "modal-content-basic large"},
        React.createElement("h2", { id: "ai-suggestion-modal-title", className: "modal-title"},
          "AI Modification Preview"
        ),

        React.createElement("div", { className: "ai-suggestion-modal-layout" },
          React.createElement("div", { className: "ai-suggestion-modal-preview-panel" },
            React.createElement("h3", { className: "ai-suggestion-modal-header" },
              "Preview of Changes"
            ),
            React.createElement("div", { className: "ai-suggestion-modal-content-area", "aria-live": "polite", "aria-atomic": "true" },
              annotatedTree && !annotatedTree._isErrorNode ? (
                React.createElement("ul", { style: { listStyle: 'none', padding: 0, margin: 0 }},
                    React.createElement(AiSuggestionPreviewListItem, { node: annotatedTree, level: 0, isVisualDiff: true })
                )
              ) : (
                React.createElement("div", { className: "error-message-inline", style: { margin: '1em' } },
                  React.createElement("div", { className: "error-icon" }, "⚠️"),
                  React.createElement("div", null,
                    React.createElement("strong", null, "AI Suggestion Error:"), " ",
                    annotatedTree?.description || "Could not display preview due to a malformed AI suggestion. The AI may have returned data that is not a valid tree structure (e.g. missing required fields). You can try refining your prompt."
                  )
                )
              ),
              removedNodes.length > 0 && (
                React.createElement("div", { className: "ai-suggestion-modal-removed-nodes-section" },
                    React.createElement("h4", { 
                      className: `ai-suggestion-modal-removed-nodes-title ${isRemovedNodesCollapsed ? 'collapsed' : ''}`,
                      onClick: () => setIsRemovedNodesCollapsed(!isRemovedNodesCollapsed),
                      "aria-expanded": !isRemovedNodesCollapsed,
                      role: "button",
                      tabIndex: 0,
                      onKeyDown: (e) => { if (e.key === 'Enter' || e.key === ' ') setIsRemovedNodesCollapsed(!isRemovedNodesCollapsed); }
                    }, "Nodes To Be Removed (", removedNodes.length, "):"),
                    React.createElement("ul", { className: `ai-suggestion-modal-removed-nodes-list ${isRemovedNodesCollapsed ? 'collapsed' : ''}` },
                        !isRemovedNodesCollapsed && removedNodes.map(node => (
                            React.createElement("li", { key: `removed-${node.id}`},
                              React.createElement("strong", null, node.name), " ", node.description && `- "${node.description.substring(0, 40)}${node.description.length > 40 ? '...' : ''}"`,
                              React.createElement("span", { className: "node-id" }, " (ID: ", node.id.substring(0,8), "...)")
                            )
                        ))
                    )
                )
              )
            )
          ),

          React.createElement("div", { className: "ai-suggestion-modal-summary-panel" },
            React.createElement("div", { id: "ai-suggestion-summary", className: "ai-suggestion-modal-summary-section" },
              React.createElement("h4", { className: "ai-suggestion-modal-summary-title" }, "Summary of Changes"),
              !annotatedTree?._isErrorNode ? (
                React.createElement("div", { className: "ai-suggestion-modal-summary-grid" },
                  React.createElement("div", null, React.createElement("strong", null, "Node Count:")),
                  React.createElement("div", { className: "summary-value" }, currentTotalNodes, " → ", suggestedTotalNodes, " (", React.createElement("span", { style: netChangeStyle, className: "ai-suggestion-modal-summary-net-change" }, netChange >= 0 ? '+' : '', netChange), ")"),

                  renderSummaryItem("Added", newNodes.length, 'var(--success-color)', '➕'),
                  renderSummaryItem("Removed", removedNodes.length, 'var(--error-color)', '➖'),
                  renderSummaryItem("Content Modified", modifiedContentNodes.length, 'var(--primary-accent)', '✏️'),
                  renderSummaryItem("Structure Modified", structureModifiedNodes.length, 'var(--secondary-accent-dark)', '📂'),
                  renderSummaryItem("Moved / Reparented", reparentedNodes.length, 'var(--warning-color)', '↪️')
                )
              ) : (
                React.createElement("p", { style: { fontStyle: 'italic', color: 'var(--text-secondary)'} }, "Summary unavailable due to suggestion error.")
              ),
              lockedContentChangedNodes.length > 0 &&
                React.createElement("div", { className: "ai-suggestion-modal-critical-warning" },
                  React.createElement("strong", null, "CRITICAL: Locked Node Content Modified: ", React.createElement("span", { className: "count" }, lockedContentChangedNodes.length))
                ),
              lockedNodesRemoved && lockedNodesRemoved.length > 0 &&
                React.createElement("div", { className: "ai-suggestion-modal-critical-warning" },
                  React.createElement("strong", null, "CRITICAL: Locked Nodes REMOVED: ", React.createElement("span", { className: "count" }, lockedNodesRemoved.length))
                )
            ),

            React.createElement("div", { className: "ai-suggestion-modal-refinement-section ai-suggestion-modal-summary-section" },
                React.createElement(ModificationPromptInput, {
                    prompt: followUpPrompt,
                    setPrompt: setFollowUpPrompt,
                    onModify: handleInternalRefine,
                    isLoading: isRefining,
                    disabled: !apiKeyIsSet || isRefining,
                    isApiKeySet: apiKeyIsSet,
                    hasTreeData: !!suggestion,
                    labelOverride: "Refine This Suggestion:"
                })
            ),

            React.createElement("p", { className: "ai-suggestion-modal-footer-note" },
              annotatedTree?._isErrorNode
                ? "An error occurred with the AI suggestion. Please refine your prompt or reject this suggestion."
                : "Review carefully. Applying overwrites the current state. Locked node content should NOT be changed."
            )
          )
        ),

        React.createElement("div", { className: "ai-suggestion-modal-footer-actions" },
          React.createElement("button", { type: "button", onClick: onCancel, className: "secondary" }, "Reject Suggestion"),
          React.createElement("button", { ref: applyButtonRef, type: "button", onClick: onConfirm, className: "success",
            disabled: !!annotatedTree?._isErrorNode || isRefining
            },
            isRefining ? "Refining..." : "Apply Changes to Project"
          )
        )
      )
    )
  );
};
export default AiSuggestionModal;
