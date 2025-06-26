import React, { useState, useEffect, useRef } from 'react';
import * as geminiService from '../services/geminiService.js';
import { initializeNodes, isValidTechTreeNodeShape } from '../utils.js';
import LoadingSpinner from './LoadingSpinner.js';
import ErrorMessage from './ErrorMessage.js';
import TechExtractionModal from './TechExtractionModal.js';

const DiffItem = ({ label, from, to }) => {
  if (from === to) return null;

  return (
    React.createElement("div", { className: "quick-edit-diff-item" },
      React.createElement("div", { className: "quick-edit-diff-label" }, label),
      React.createElement("div", { className: "quick-edit-diff-content" },
        React.createElement("div", { className: "diff-from" },
          React.createElement("span", { className: "diff-tag" }, "FROM"),
          React.createElement("pre", null, from || React.createElement("i", null, "(empty)"))
        ),
        React.createElement("div", { className: "diff-to" },
          React.createElement("span", { className: "diff-tag" }, "TO"),
          React.createElement("pre", null, to || React.createElement("i", null, "(empty)"))
        )
      )
    )
  );
};




const ChildrenDiff = ({ from, to }) => {
  const fromIds = new Set(from.map(c => c.id));
  const toIds = new Set(to.map(c => c.id));
  const fromNames = new Map(from.map(c => [c.id, c.name]));
  const toNames = new Map(to.map(c => [c.id, c.name]));

  const added = to.filter(c => !fromIds.has(c.id));
  const removed = from.filter(c => !toIds.has(c.id));
  const changed = to.filter(c => fromIds.has(c.id) && fromNames.get(c.id) !== c.name);

  if (added.length === 0 && removed.length === 0 && changed.length === 0) return null;

  return (
    React.createElement("div", { className: "quick-edit-diff-item" },
      React.createElement("div", { className: "quick-edit-diff-label" }, "Children"),
      React.createElement("div", { className: "quick-edit-children-diff" },
        added.map(c => React.createElement("p", { key: c.id, className: "diff-child-added" }, `+ ${c.name}`)),
        removed.map(c => React.createElement("p", { key: c.id, className: "diff-child-removed" }, `- ${c.name}`)),
        changed.map(c => React.createElement("p", { key: c.id, className: "diff-child-changed" }, `~ ${fromNames.get(c.id)} → ${c.name}`))
      )
    )
  );
};

const AiQuickEditModal = ({ isOpen, node, onConfirm, onCancel, apiKeyIsSet, selectedModel }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [diff, setDiff] = useState(null);
  const promptInputRef = useRef(null);
  const [showPromptModal, setShowPromptModal] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPrompt('');
      setDiff(null);
      setError(null);
      setTimeout(() => promptInputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (event) => {
      if (event.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onCancel]);

  const handleGenerateClick = async () => {
    if (!prompt.trim() || !node) return;
    setIsLoading(true);
    setError(null);
    setDiff(null);

    const trimmedPrompt = prompt.trim();
    const isJsonAttempt = trimmedPrompt.startsWith('{') && trimmedPrompt.endsWith('}');

    if (isJsonAttempt) {
      try {
        const parsedData = JSON.parse(prompt);
        if (typeof parsedData !== 'object' || parsedData === null || Array.isArray(parsedData)) {
            throw new Error("Pasted content must be a single JSON object.");
        }
        if (!isValidTechTreeNodeShape(parsedData)) {
            throw new Error("The pasted JSON is not a valid node object. It must have a 'name' property and an optional 'children' array.");
        }
        const initializedNode = initializeNodes(parsedData, node._parentId);
        const finalNode = { ...initializedNode, id: node.id }; // Enforce original ID
        setDiff({ from: node, to: finalNode });
      } catch (e) {
        setError({ message: `JSON Paste Error: ${e.message}. Please correct the JSON or enter a text prompt.` });
      } finally {
        setIsLoading(false);
      }
      return; // Stop here after handling JSON attempt.
    }

    // If it's not a JSON attempt, treat as a natural language prompt.
    if (!apiKeyIsSet) {
        setError({ message: "An API Key is required to use text prompts for AI edits. Please set one in the Workspace." });
        setIsLoading(false);
        return;
    }
    
    try {
      const suggestedNode = await geminiService.generateQuickEdit(node, prompt, selectedModel);
      setDiff({ from: node, to: suggestedNode });
    } catch (e) {
      setError(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShowPrompt = () => {
    let isLikelyJson = false;
    try {
        JSON.parse(prompt);
        isLikelyJson = true;
    } catch (e) { /* is not JSON */ }

    if (isLikelyJson) {
        setError({ message: "Cannot show prompt for JSON input. This feature is only for text-based instructions." });
        return;
    }

    if (!prompt.trim()) {
      setError({ message: "Please enter a prompt first to see what would be sent."});
      return;
    }
    setError(null);
    setShowPromptModal(true);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      if (!isLoading && prompt.trim()) {
        handleGenerateClick();
      }
    }
  };

  const handleConfirm = () => {
    if (diff && diff.to) {
      onConfirm(node.id, diff.to);
    }
  };

  if (!isOpen || !node) return null;

  const quickEditPrompt = showPromptModal ? geminiService.getPromptTextFor('quickEdit', { node: node, prompt: prompt }) : '';

  return (
    React.createElement(React.Fragment, null,
      React.createElement("div", { className: "modal-overlay-basic", onClick: (e) => { if (e.target === e.currentTarget) onCancel(); } },
        React.createElement("div", { className: "modal-content-basic", style: { width: 'clamp(500px, 70vw, 700px)' } },
          React.createElement("h2", { className: "modal-title" },
            React.createElement("span", { className: "modal-icon" }, "✍️"),
            "AI Quick Edit: ", node.name
          ),
          React.createElement("div", { className: "ai-quick-edit-layout" },
            React.createElement("div", { className: "ai-quick-edit-prompt-section" },
              React.createElement("label", { htmlFor: "ai-quick-edit-prompt" }, "1. Enter instructions or paste a JSON node object:"),
              React.createElement("p", { style: {fontSize: '0.8em', color: 'var(--text-tertiary)', margin: '0 0 5px 0'}},
                "Use natural language to have the AI edit the node, or paste a complete JSON object for the node to replace its content."
              ),
              React.createElement("textarea", {
                ref: promptInputRef,
                id: "ai-quick-edit-prompt",
                placeholder: "e.g., 'Fix typo in name and add a child for React Hooks'.\nOr, paste a single JSON node object here to replace the current node's data. (Ctrl+Enter to submit)",
                value: prompt,
                onChange: (e) => setPrompt(e.target.value),
                onKeyDown: handleKeyDown,
                disabled: isLoading,
                style: { minHeight: '120px' }
              }),
              React.createElement("div", { style: {display: 'flex', gap: '8px'}},
                React.createElement("button", {
                  onClick: handleGenerateClick,
                  disabled: !prompt.trim() || isLoading,
                  className: "primary",
                  style: {flex: 1}
                },
                  isLoading ? "Generating..." : "Generate Preview"
                ),
                React.createElement("button", {
                  onClick: handleShowPrompt,
                  disabled: isLoading || !prompt.trim() || (prompt.trim().startsWith('{') && prompt.trim().endsWith('}')),
                  className: "secondary",
                  title: "Show the full prompt that will be sent to the AI (only for text prompts)"
                }, '📋')
              ),
              !apiKeyIsSet && React.createElement("p", { style: { color: 'var(--text-secondary)', fontSize: '0.9em', textAlign: 'center' } }, "Pasting a JSON object works without an API key. For text prompts, a key is required.")
            ),
            
            React.createElement("hr", null),

            React.createElement("div", { className: "ai-quick-edit-preview-section" },
              React.createElement("h3", { className: "ai-quick-edit-preview-title" }, "2. Preview of Changes"),
              error && React.createElement(ErrorMessage, { error: error, onClose: () => setError(null), mode: "inline" }),
              isLoading && React.createElement(LoadingSpinner, { message: "Analyzing..." }),
              !isLoading && !diff && !error && React.createElement("p", { className: "ai-quick-edit-placeholder" }, "Preview will appear here after generation."),
              diff && (
                React.createElement("div", { className: "ai-quick-edit-diff-container" },
                  React.createElement(DiffItem, { label: "Name", from: diff.from.name, to: diff.to.name }),
                  React.createElement(DiffItem, { label: "Description", from: diff.from.description, to: diff.to.description }),
                  React.createElement(DiffItem, { label: "Importance", from: diff.from.importance, to: diff.to.importance }),
                  React.createElement(ChildrenDiff, { from: diff.from.children || [], to: diff.to.children || [] })
                )
              )
            )
          ),
          React.createElement("div", { className: "ai-suggestion-modal-footer-actions" },
            React.createElement("button", { type: "button", onClick: onCancel, className: "secondary" }, "Cancel"),
            React.createElement("button", {
              type: "button",
              onClick: handleConfirm,
              className: "primary",
              disabled: !diff || isLoading
            }, "Apply Changes")
          )
        )
      ),
      showPromptModal && (
        React.createElement(TechExtractionModal, {
          isOpen: showPromptModal,
          content: quickEditPrompt,
          title: "AI Quick Edit Prompt",
          onClose: () => setShowPromptModal(false)
        })
      )
    )
  );
};

export default AiQuickEditModal;