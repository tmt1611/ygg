import React, { useState, useEffect, useRef, useMemo } from 'react';
import LoadingSpinner from './LoadingSpinner.js';
import ErrorMessage from './ErrorMessage.js';

const DiffDisplay = ({ label, original, modified, isJson = false }) => {
    const originalText = isJson ? JSON.stringify(original, null, 2) : String(original || '');
    const modifiedText = isJson ? JSON.stringify(modified, null, 2) : String(modified || '');

    if (originalText === modifiedText) return null;

    return (
        React.createElement("div", { className: "quick-edit-diff-item" },
            React.createElement("strong", { className: "quick-edit-diff-label" }, label),
            React.createElement("div", { className: "quick-edit-diff-content" },
                React.createElement("div", { className: "diff-from" },
                    React.createElement("span", { className: "diff-tag" }, "FROM"),
                    React.createElement("pre", null, originalText)
                ),
                React.createElement("div", { className: "diff-to" },
                    React.createElement("span", { className: "diff-tag" }, "TO"),
                    React.createElement("pre", null, modifiedText)
                )
            )
        )
    );
};

const AiQuickEditModal = ({ isOpen, node, onConfirm, onCancel, onGenerate, isAppBusy }) => {
    const [prompt, setPrompt] = useState('');
    const [suggestion, setSuggestion] = useState(null);
    const [error, setError] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const promptInputRef = useRef(null);

    useEffect(() => {
        if (isOpen) {
            setPrompt('');
            setSuggestion(null);
            setError(null);
            setIsGenerating(false);
            setTimeout(() => promptInputRef.current?.focus(), 100);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) return;
        const handleEscape = (event) => { if (event.key === 'Escape') onCancel(); };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen, onCancel]);

    const handleGenerateClick = async () => {
        if (!prompt.trim() || !node) return;
        setIsGenerating(true);
        setError(null);
        setSuggestion(null);
        try {
            const result = await onGenerate(node.id, prompt);
            if (result) {
                setSuggestion(result);
            } else {
                // Error is handled by the hook, but we can set a local one if needed
                setError("Failed to generate suggestion. Check main error display.");
            }
        } catch (e) {
            setError(e.message || "An unexpected error occurred.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleConfirmClick = () => {
        if (suggestion) {
            onConfirm(node.id, suggestion);
        }
    };

    const childrenDiff = useMemo(() => {
        if (!suggestion) return null;
        const originalChildren = (node.children || []).map(c => ({ id: c.id, name: c.name }));
        const modifiedChildren = (suggestion.children || []).map(c => ({ id: c.id, name: c.name }));
        
        const originalSet = new Map(originalChildren.map(c => [c.id, c.name]));
        const modifiedSet = new Map(modifiedChildren.map(c => [c.id, c.name]));

        const removed = originalChildren.filter(c => !modifiedSet.has(c.id));
        const added = modifiedChildren.filter(c => c.id === 'NEW_NODE' || !originalSet.has(c.id));
        const changed = modifiedChildren.filter(c => {
            return originalSet.has(c.id) && originalSet.get(c.id) !== c.name;
        }).map(c => ({...c, oldName: originalSet.get(c.id)}));

        if (removed.length === 0 && added.length === 0 && changed.length === 0) return null;

        return { removed, added, changed };
    }, [node, suggestion]);

    if (!isOpen || !node) return null;

    return (
        React.createElement("div", { className: "modal-overlay-basic", role: "dialog", "aria-modal": "true", "aria-labelledby": "ai-quick-edit-title", onClick: (e) => { if (e.target === e.currentTarget) onCancel(); } },
            React.createElement("div", { className: "modal-content-basic", style: { width: 'clamp(450px, 60vw, 600px)' } },
                React.createElement("h2", { id: "ai-quick-edit-title", className: "modal-title" },
                    React.createElement("span", { className: "modal-icon" }, "🤖"),
                    "Quick Edit: ", node.name
                ),

                React.createElement("div", { className: "ai-quick-edit-layout" },
                    React.createElement("div", { className: "ai-quick-edit-prompt-section" },
                        React.createElement("label", { htmlFor: "ai-quick-edit-prompt" }, "How should this node be changed?"),
                        React.createElement("textarea", {
                            ref: promptInputRef,
                            id: "ai-quick-edit-prompt",
                            placeholder: "e.g., 'Make the description more technical' or 'Add children for TCP and UDP'",
                            value: prompt,
                            onChange: (e) => setPrompt(e.target.value),
                            disabled: isGenerating || isAppBusy,
                        }),
                        React.createElement("button", {
                            onClick: handleGenerateClick,
                            disabled: !prompt.trim() || isGenerating || isAppBusy,
                            className: "primary",
                            style: { marginTop: '10px' }
                        },
                            isGenerating ? React.createElement("span", { className: "basic-spinner-animation" }) : "Generate Suggestion"
                        )
                    ),
                    React.createElement("div", { className: "ai-quick-edit-preview-section" },
                        React.createElement("h3", { className: "ai-quick-edit-preview-title" }, "Preview of Changes"),
                        isGenerating && React.createElement(LoadingSpinner, { message: "Generating..." }),
                        error && React.createElement(ErrorMessage, { error: { message: error }, onClose: () => setError(null), mode: "inline" }),
                        suggestion && !isGenerating && (
                            React.createElement("div", { className: "ai-quick-edit-diff-container" },
                                React.createElement(DiffDisplay, { label: "Name", original: node.name, modified: suggestion.name }),
                                React.createElement(DiffDisplay, { label: "Description", original: node.description, modified: suggestion.description }),
                                React.createElement(DiffDisplay, { label: "Importance", original: node.importance, modified: suggestion.importance }),
                                childrenDiff && (
                                    React.createElement("div", { className: "quick-edit-diff-item" },
                                        React.createElement("strong", { className: "quick-edit-diff-label" }, "Children"),
                                        React.createElement("div", { className: "quick-edit-children-diff" },
                                            childrenDiff.added.map((c, i) => React.createElement("p", { key: `add-${i}`, className: "diff-child-added" }, "+ ", c.name)),
                                            childrenDiff.removed.map((c, i) => React.createElement("p", { key: `rem-${i}`, className: "diff-child-removed" }, "- ", c.name)),
                                            childrenDiff.changed.map((c, i) => React.createElement("p", { key: `chg-${i}`, className: "diff-child-changed" }, `~ ${c.oldName} → ${c.name}`))
                                        )
                                    )
                                )
                            )
                        ),
                        !suggestion && !isGenerating && !error && React.createElement("p", { className: "ai-quick-edit-placeholder" }, "Suggestions will appear here.")
                    )
                ),

                React.createElement("div", { className: "modal-footer-actions" },
                    React.createElement("button", { type: "button", onClick: onCancel, className: "secondary" }, "Cancel"),
                    React.createElement("button", {
                        type: "button",
                        onClick: handleConfirmClick,
                        className: "success",
                        disabled: !suggestion || isGenerating || isAppBusy
                    }, "Apply Changes")
                )
            )
        )
    );
};

export default AiQuickEditModal;