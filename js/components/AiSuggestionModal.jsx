import React, { useMemo, useEffect, useRef, useState } from 'react';
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
  originalPrompt,
}) => {
  const applyButtonRef = useRef(null);
  const [followUpPrompt, setFollowUpPrompt] = useState('');
  const [isRemovedNodesCollapsed, setIsRemovedNodesCollapsed] = useState(true);
  const [isSummaryVisible, setIsSummaryVisible] = useState(true);
  const [showOnlyChanges, setShowOnlyChanges] = useState(true);

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
            reparentedNodes: [],
            lockedNodesRemoved: []
        };
    }
    return compareAndAnnotateTree(currentTreeForDiff, suggestion);
  }, [currentTreeForDiff, suggestion, isOpen]);

  const removedNodesTree = useMemo(() => {
    if (!comparisonResult || !comparisonResult.removedNodes.length) return [];
    
    // Add the status to every node first and prepare for tree building
    const removedNodesWithStatus = comparisonResult.removedNodes.map(n => ({
        ...n,
        _changeStatus: 'removed',
        children: []
    }));

    const removedNodesById = new Map(removedNodesWithStatus.map(n => [n.id, n]));
    const rootRemovedNodes = [];

    removedNodesById.forEach(node => {
        // A node is a root of a removed subtree if its parent is NOT in the removed list.
        if (!node._parentId || !removedNodesById.has(node._parentId)) {
            rootRemovedNodes.push(node);
        } else {
            // It's a child of another removed node.
            const parent = removedNodesById.get(node._parentId);
            if (parent) {
                // Ensure children are not duplicated if map iteration order is weird
                if (!parent.children.some(c => c.id === node.id)) {
                    parent.children.push(node);
                }
            }
        }
    });

    return rootRemovedNodes;
  }, [comparisonResult]);

  const displayTree = useMemo(() => {
    if (!comparisonResult) return null;
    const { annotatedTree } = comparisonResult;

    // The main display tree should only show the new state.
    // Errors and removed nodes are handled separately in the render logic.
    if (!annotatedTree || annotatedTree._isErrorNode) {
      return null;
    }
    
    if (!showOnlyChanges) return annotatedTree;

    // Filter the tree to only show nodes with changes
    const filterTree = (node) => {
        if (!node) return null;
        let filteredChildren = [];
        if (node.children) {
            filteredChildren = node.children.map(filterTree).filter(Boolean);
        }
        // Keep node if it has changes itself OR if it has children with changes
        if (node._changeStatus !== 'unchanged' || filteredChildren.length > 0) {
            return { ...node, children: filteredChildren };
        }
        return null;
    };
    
    return filterTree(annotatedTree);
  }, [comparisonResult, showOnlyChanges]);

  useEffect(() => {
    if (isOpen) {
      const hasCriticalIssues = comparisonResult?.lockedContentChangedNodes?.length > 0 || comparisonResult?.lockedNodesRemoved?.length > 0;
      if (hasCriticalIssues) {
        setIsSummaryVisible(true); // Force open on critical issues
      } else {
        // For non-critical cases, respect the stored preference
        const saved = sessionStorage.getItem('aiSuggestionModalSummaryVisible');
        setIsSummaryVisible(saved !== null ? JSON.parse(saved) : true);
      }
    }
  }, [isOpen, comparisonResult]);

  useEffect(() => {
    // Persist user's choice to storage
    if (isOpen) {
      sessionStorage.setItem('aiSuggestionModalSummaryVisible', JSON.stringify(isSummaryVisible));
    }
  }, [isSummaryVisible, isOpen]);

  useEffect(() => {
    if (isOpen) {
      applyButtonRef.current?.focus();
      setFollowUpPrompt('');
      
      const handleEscape = (event) => { if (event.key === 'Escape') onCancel(); };
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onCancel]);

  useEffect(() => {
    if (isOpen) {
      // Expand the removed nodes list if there are critical removals.
      if (comparisonResult?.lockedNodesRemoved?.length > 0) {
        setIsRemovedNodesCollapsed(false);
      } else {
        setIsRemovedNodesCollapsed(true);
      }
    }
  }, [isOpen, comparisonResult]);

  if (!isOpen || !comparisonResult) return null;

  const { annotatedTree, removedNodes, newNodes, modifiedContentNodes, lockedContentChangedNodes, structureModifiedNodes, reparentedNodes, lockedNodesRemoved } = comparisonResult;

  const currentTotalNodes = currentTreeForDiff ? countNodesInTree(currentTreeForDiff) : 0;
  const isError = !!comparisonResult?.annotatedTree?._isErrorNode;
  const suggestedTotalNodes = annotatedTree && !isError ? countNodesInTree(annotatedTree) : 0;
  const netChange = suggestedTotalNodes - currentTotalNodes;

  const netChangeStyle = { color: netChange > 0 ? 'var(--success-color)' : netChange < 0 ? 'var(--error-color)' : 'var(--text-secondary)'};

  const hasCriticalIssues = lockedContentChangedNodes.length > 0 || lockedNodesRemoved.length > 0;
  const applyButtonClass = hasCriticalIssues ? 'danger' : 'success';
  const applyButtonText = isRefining ? "Refining..." : (hasCriticalIssues ? "Apply (with Cautions)" : "Apply Changes to Project");
  const applyButtonTitle = hasCriticalIssues ? "Warning: This suggestion modifies or removes locked nodes. Proceed with caution." : "Apply these changes to your project.";

  const renderSummaryItem = (label, count, color, icon) => {
    if (count <= 0) return null;
    return (
      <div key={label} className="ai-suggestion-modal-summary-item" style={{ backgroundColor: color ? `${color}1A` : 'transparent' }}>
        <span className="summary-label">
          <span className="summary-icon" style={{ color: color || 'var(--text-secondary)' }}>{icon}</span>
          {label}
        </span>
        <span className="summary-value" style={{ color: color || 'var(--text-primary)' }}>{count}</span>
      </div>
    );
  };

  const handleInternalRefine = () => {
    if (followUpPrompt.trim()) {
      onRefineSuggestion(followUpPrompt, suggestion, originalPrompt);
    }
  };

  return (
    <div className="modal-overlay-basic" role="dialog" aria-modal="true" aria-labelledby="ai-suggestion-modal-title" aria-describedby="ai-suggestion-summary" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="modal-content-basic large">
        <h2 id="ai-suggestion-modal-title" className="modal-title">
          <span className="modal-icon" aria-hidden="true">🤖</span>
          AI Modification Preview
        </h2>

        <div className={`ai-suggestion-modal-layout ${!isSummaryVisible ? 'summary-hidden' : ''}`}>
          <div className="ai-suggestion-modal-preview-panel">
            <div className="ai-suggestion-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span>Preview of Changes</span>
                <div className="segmented-control">
                  <button
                    className={!showOnlyChanges ? 'active' : ''}
                    onClick={() => setShowOnlyChanges(false)}
                    title="Show the full tree with all nodes"
                  >
                    Full Tree
                  </button>
                  <button
                    className={showOnlyChanges ? 'active' : ''}
                    onClick={() => setShowOnlyChanges(true)}
                    title="Show only nodes that were added or modified, hiding unchanged branches"
                  >
                    Changes Only
                  </button>
                </div>
              </div>
              <button
                className={`base-icon-button toggle-summary-btn ${!isSummaryVisible ? 'collapsed' : ''}`}
                onClick={() => setIsSummaryVisible(!isSummaryVisible)}
                title={isSummaryVisible ? "Hide Summary Panel" : "Show Summary Panel"}
                aria-label={isSummaryVisible ? "Hide Summary Panel" : "Show Summary Panel"}
                aria-controls="ai-suggestion-summary-panel"
                aria-expanded={isSummaryVisible}
              >
                ❯
              </button>
            </div>
            <div className="ai-suggestion-modal-content-area" aria-live="polite" aria-atomic="true">
              {displayTree ? (
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    <AiSuggestionPreviewListItem node={displayTree} level={0} isVisualDiff />
                </ul>
              ) : isError ? (
                <div className="error-message-inline" style={{ margin: '1em', padding: '15px', alignItems: 'flex-start' }}>
                  <span className="error-icon" style={{ fontSize: '1.5em', marginTop: '3px' }}>⚠️</span>
                  <div>
                    <strong style={{ display: 'block', marginBottom: '5px' }}>AI Suggestion Error</strong>
                    <p style={{ margin: 0, lineHeight: 1.4, fontSize: '0.95em' }}>
                      {comparisonResult.annotatedTree.description || "Could not display preview due to a malformed AI suggestion. The AI may have returned data that is not a valid tree structure (e.g. missing required fields). You can try refining your prompt or reject this suggestion."}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="placeholder-center-content" style={{ minHeight: '150px' }}>
                  <span className="placeholder-icon" style={{ fontSize: '2.5em' }}>🍃</span>
                  <p style={{ color: 'var(--text-secondary)' }}>No additions or modifications to display in the tree view.</p>
                  <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9em' }}>Check the 'Removed Nodes' section below for deletions.</p>
                </div>
              )}
            </div>
            {removedNodesTree.length > 0 && (
                <div className="ai-suggestion-modal-summary-section" style={{ marginTop: '15px' }}>
                    <h4
                        className="ai-suggestion-modal-summary-title"
                        onClick={() => setIsRemovedNodesCollapsed(!isRemovedNodesCollapsed)}
                        style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: isRemovedNodesCollapsed ? 0 : '8px' }}
                    >
                        <span style={{ transform: isRemovedNodesCollapsed ? 'rotate(-90deg)' : 'none', transition: 'transform 0.2s', display: 'inline-block' }}>▼</span>
                        {`Removed Branches (${comparisonResult.removedNodes.length} total nodes)`}
                    </h4>
                    {!isRemovedNodesCollapsed && (
                        <ul style={{ listStyle: 'none', padding: 0, margin: '10px 0 0 0' }}>
                            {removedNodesTree.map(removedRoot => (
                                <AiSuggestionPreviewListItem key={removedRoot.id} node={removedRoot} level={0} isVisualDiff />
                            ))}
                        </ul>
                    )}
                </div>
            )}
          </div>

          <div id="ai-suggestion-summary-panel" className="ai-suggestion-modal-summary-panel">
            <div id="ai-suggestion-summary" className="ai-suggestion-modal-summary-section">
              <h4 className="ai-suggestion-modal-summary-title">Summary of Changes</h4>
              {!isError ? (
                <div className="ai-suggestion-modal-summary-grid">
                  <div><strong>Node Count:</strong></div>
                  <div className="summary-value">
                    {currentTotalNodes} → {suggestedTotalNodes} (
                    <span style={netChangeStyle} className="ai-suggestion-modal-summary-net-change">
                      {`${netChange >= 0 ? '+' : ''}${netChange}`}
                    </span>)
                  </div>

                  {renderSummaryItem("Added", newNodes.length, 'var(--success-color)', '➕')}
                  {renderSummaryItem("Removed", removedNodes.length, 'var(--error-color)', '➖')}
                  {renderSummaryItem("Content Modified", modifiedContentNodes.length, 'var(--primary-accent)', '✏️')}
                  {renderSummaryItem("Structure Modified", structureModifiedNodes.length, 'var(--secondary-accent-dark)', '📂')}
                  {renderSummaryItem("Moved / Reparented", reparentedNodes.length, 'var(--warning-color)', '↪️')}
                </div>
              ) : (
                <p style={{ fontStyle: 'italic', color: 'var(--text-secondary)'}}>Summary unavailable due to suggestion error.</p>
              )}
              {lockedContentChangedNodes.length > 0 &&
                <div className="ai-suggestion-modal-critical-warning">
                  <strong>CRITICAL: Locked Node Content Modified: <span className="count">{lockedContentChangedNodes.length}</span></strong>
                </div>
              }
              {lockedNodesRemoved.length > 0 &&
                <div className="ai-suggestion-modal-critical-warning">
                  <strong>CRITICAL: Locked Nodes REMOVED: <span className="count">{lockedNodesRemoved.length}</span></strong>
                </div>
              }
            </div>
          </div>
        </div>

        <div className="ai-suggestion-modal-refinement-section">
            <ModificationPromptInput
                prompt={followUpPrompt}
                setPrompt={setFollowUpPrompt}
                onModify={handleInternalRefine}
                isLoading={isRefining}
                disabled={!apiKeyIsSet || isRefining || isError}
                isApiKeySet={apiKeyIsSet}
                hasTreeData={!!suggestion}
                labelOverride="Refine This Suggestion:"
                buttonText="Refine"
            />
        </div>

        <p className="ai-suggestion-modal-footer-note">
          {isError
            ? "An error occurred with the AI suggestion. Please refine your prompt or reject this suggestion."
            : "Review carefully. Applying overwrites the current state. Locked node content should NOT be changed."
          }
        </p>

        <div className="ai-suggestion-modal-footer-actions">
          <button type="button" onClick={onCancel} className="secondary">Reject Suggestion</button>
          <button
            ref={applyButtonRef}
            type="button"
            onClick={onConfirm}
            className={applyButtonClass}
            disabled={isError || isRefining}
            title={applyButtonTitle}
          >
            {applyButtonText}
          </button>
        </div>
      </div>
    </div>
  );
};
export default AiSuggestionModal;