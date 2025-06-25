import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as geminiService from '../services/geminiService.js';
import LoadingSpinner from './LoadingSpinner.js';
import ErrorMessage from './ErrorMessage.js';

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

const AiQuickEditModal = ({ isOpen, node, onConfirm, onCancel, apiKeyIsSet }) => {
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [diff, setDiff] = useState(null);
  const promptInputRef = useRef(null);

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

  const handleGeneratePreview = async () => {
    if (!prompt.trim() || !node) return;
    setIsLoading(true);
    setError(null);
    setDiff(null);
    try {
      const suggestedNode = await geminiService.generateQuickEdit(node, prompt);
      setDiff({ from: node, to: suggestedNode });
    } catch (e) {
      setError(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    if (diff && diff.to) {
      onConfirm(node.id, diff.to);
    }
  };

  if (!isOpen || !node) return null;

  return (
    React.createElement("div", { className: "modal-overlay-basic", onClick: (e) => { if (e.target === e.currentTarget) onCancel(); } },
      React.createElement("div", { className: "modal-content-basic", style: { width: 'clamp(500px, 70vw, 700px)' } },
        React.createElement("h2", { className: "modal-title" },
          React.createElement("span", { className: "modal-icon" }, "✍️"),
          "AI Quick Edit: ", node.name
        ),
        React.createElement("div", { className: "ai-quick-edit-layout" },
          React.createElement("div", { className: "ai-quick-edit-prompt-section" },
            React.createElement("label", { htmlFor: "ai-quick-edit-prompt" }, "Describe your change:"),
            React.createElement("textarea", {
              ref: promptInputRef,
              id: "ai-quick-edit-prompt",
              placeholder: "e.g., 'Fix typo in name', 'Add a child named...', 'Rewrite description to be more concise.'",
              value: prompt,
              onChange: (e) => setPrompt(e.target.value),
              disabled: isLoading || !apiKeyIsSet,
            }),
            React.createElement("button", {
              onClick: handleGeneratePreview,
              disabled: !prompt.trim() || isLoading || !apiKeyIsSet,
              className: "secondary"
            },
              isLoading ? "Generating..." : "Generate Preview"
            ),
            !apiKeyIsSet && React.createElement("p", { style: { color: 'var(--error-color)', fontSize: '0.9em', textAlign: 'center' } }, "API Key not set. This feature is disabled.")
          ),
          React.createElement("div", { className: "ai-quick-edit-preview-section" },
            React.createElement("h3", { className: "ai-quick-edit-preview-title" }, "Preview of Changes"),
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
    )
  );
};

export default AiQuickEditModal;