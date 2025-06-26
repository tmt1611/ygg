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

    // Attempt to parse as JSON first. If it succeeds and is a valid node, treat it as manual input.
    try {
      // Use a raw parse, as our custom parser is too lenient for this initial check.
      const parsedData = JSON.parse(prompt);
      
      if (typeof parsedData === 'object' && parsedData !== null && !Array.isArray(parsedData)) {
        // It's a single object, now validate its shape.
        const initializedNode = initializeNodes(parsedData, null);
        
        if (!isValidTechTreeNodeShape(initializedNode)) {
          throw new Error("Pasted JSON does not have the required node structure (e.g., missing 'name').");
        }

        const finalNode = { ...initializedNode, id: node.id }; // Enforce original ID
        setDiff({ from: node, to: finalNode });
        setIsLoading(false);
        return; // Success, stop here.
      }
    } catch (e) {
      // It's not valid JSON, or failed validation. Fall through to treat as a text prompt.
      // If no API key is set, we can show the JSON error now.
      if (!apiKeyIsSet) {
        setError({ message: `Input is not valid JSON and no API key is set for text prompts. Error: ${e.message}` });
        setIsLoading(false);
        return;
      }
    }

    // Treat as a natural language prompt
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
              React.createElement("label", { htmlFor: "ai-quick-edit-prompt" }, "1. Describe your change or paste a JSON node object:"),
              React.createElement("textarea", {
                ref: promptInputRef,
                id: "ai-quick-edit-prompt",
                placeholder: "e.g., 'Fix typo in name', or paste a single JSON node object here. (Ctrl+Enter to submit)",
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
                  className: "secondary",
                  style: {flex: 1}
                },
                  isLoading ? "Generating..." : "Generate Preview"
                ),
                React.createElement("button", {
                  onClick: handleShowPrompt,
                  disabled: isLoading || !prompt.trim(),
                  className: "secondary",
                  title: "Show the full prompt that will be sent to the AI (only works for text prompts)"
                }, '📋')
              ),
              !apiKeyIsSet && React.createElement("p", { style: { color: 'var(--text-secondary)', fontSize: '0.9em', textAlign: 'center' } }, "API Key not set. AI prompt features are disabled, but you can still paste a JSON node object.")
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