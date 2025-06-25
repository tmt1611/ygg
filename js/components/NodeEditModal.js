
import React, { useState, useEffect, useRef } from 'react';

const NodeEditModal = ({
  isOpen,
  mode,
  title,
  label,
  placeholder,
  initialValue,
  initialDescription,
  onConfirm,
  onCancel,
}) => {
  const [nameValue, setNameValue] = useState(initialValue || '');
  const [descriptionValue, setDescriptionValue] = useState(initialDescription || '');
  const nameInputRef = useRef(null);
  const descriptionInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setNameValue(initialValue || '');
      setDescriptionValue(initialDescription || '');
      setTimeout(() => nameInputRef.current?.focus(), 50);
    }
  }, [isOpen, initialValue, initialDescription]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onCancel();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) {
    return null;
  }

  const handleConfirm = (e) => {
    e.preventDefault();
    if (nameValue.trim()) {
      onConfirm({
        name: nameValue,
        description: descriptionValue,
      });
    } else {
      nameInputRef.current?.focus();
    }
  };

  return (
    React.createElement("div", {
      className: "modal-overlay-basic",
      role: "dialog",
      "aria-modal": "true",
      "aria-labelledby": "node-edit-modal-title",
      onClick: (e) => { if (e.target === e.currentTarget) onCancel(); }
    },
      React.createElement("div", { className: "modal-content-basic", style: {width: 'clamp(350px, 60vw, 550px)'}},
        React.createElement("form", { onSubmit: handleConfirm },
          React.createElement("h2", { id: "node-edit-modal-title", className: "modal-title" },
            React.createElement("span", { className: "modal-icon" }, mode === 'addChild' ? '➕' : '✏️'),
            title
          ),

          React.createElement("div", { style: { marginBottom: '15px' }},
            React.createElement("label", { htmlFor: "node-edit-modal-name-input", style: { marginBottom: '5px', display: 'block' }},
              label
            ),
            React.createElement("input", {
              ref: nameInputRef,
              id: "node-edit-modal-name-input",
              type: "text",
              value: nameValue,
              onChange: (e) => setNameValue(e.target.value),
              style: { width: '100%' },
              "aria-label": label,
              placeholder: placeholder,
              required: true 
            })
          ),

          (mode === 'editName' || mode === 'addChild') && (
            React.createElement("div", { style: { marginBottom: '20px' }},
              React.createElement("label", { htmlFor: "node-edit-modal-description-input", style: { marginBottom: '5px', display: 'block' }},
                "Description (Optional)"
              ),
              React.createElement("textarea", {
                ref: descriptionInputRef,
                id: "node-edit-modal-description-input",
                value: descriptionValue,
                onChange: (e) => setDescriptionValue(e.target.value),
                style: { width: '100%', minHeight: '80px', resize: 'vertical' },
                "aria-label": "Node description",
                placeholder: "Enter node description..."
              })
            )
          ),

          React.createElement("p", { style: { fontSize: '0.85em', color: 'var(--text-secondary)', marginTop: '8px', marginBottom: '20px' }},
            "Press Enter to confirm or Escape to cancel."
          ),
          React.createElement("div", { style: { display: 'flex', justifyContent: 'flex-end', gap: '10px' }},
            React.createElement("button", {
              type: "button",
              onClick: onCancel,
              className: "secondary" 
            },
              "Cancel"
            ),
            React.createElement("button", {
              type: "submit",
              className: "primary", 
              disabled: !nameValue.trim() 
            },
              "Confirm"
            )
          )
        )
      )
    )
  );
};

export default NodeEditModal;
