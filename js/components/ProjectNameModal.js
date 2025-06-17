
import React, { useState, useEffect, useRef } from 'react';

const ProjectNameModal = ({
  isOpen,
  mode,
  currentName = '',
  onConfirm,
  onCancel,
}) => {
  const [projectName, setProjectName] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (mode === 'rename') {
        setProjectName(currentName);
      } else if (mode === 'createExample') {
        setProjectName(currentName || `Example - ${new Date().toLocaleDateString()}`); 
      } else { 
        setProjectName(`New Project ${new Date().toLocaleDateString()}`);
      }
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, mode, currentName]);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (event) => {
      if (event.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const handleConfirm = (e) => {
    e.preventDefault();
    if (projectName.trim()) {
      onConfirm(projectName.trim());
    } else {
      inputRef.current?.focus();
    }
  };

  let title = "Project Name";
  let confirmButtonText = "Confirm";
  let placeholderText = "Enter project name";

  if (mode === 'rename') {
    title = `Rename Project: ${currentName}`;
    confirmButtonText = "Rename Project";
  } else if (mode === 'createExample') {
    title = "Save as New Example Project";
    confirmButtonText = "Save as Example";
    placeholderText = "Enter example project name";
  } else { 
    title = "Create New Project";
    confirmButtonText = "Create Project";
  }


  return (
    React.createElement("div", { 
      className: "modal-overlay-basic", 
      role: "dialog",
      "aria-modal": "true",
      "aria-labelledby": "project-name-modal-title"
    },
      React.createElement("div", { className: "modal-content-basic" },
        React.createElement("form", { onSubmit: handleConfirm },
          React.createElement("h2", { id: "project-name-modal-title", style: { fontSize: '1.3em', color: 'var(--text-primary)', marginBottom: '15px' }},
            title
          ),
          React.createElement("label", { htmlFor: "project-name-input", style: {display: 'block', marginBottom: '5px'}},
            mode === 'createExample' ? 'Example Project Name:' : 'Project Name:'
          ),
          React.createElement("input", {
            ref: inputRef,
            id: "project-name-input",
            type: "text",
            value: projectName,
            onChange: (e) => setProjectName(e.target.value),
            style: { width: '100%' }, 
            "aria-label": mode === 'createExample' ? 'Example project name' : 'Project name',
            placeholder: placeholderText,
            required: true
          }),
          React.createElement("p", { style: { fontSize: '0.9em', color: 'var(--text-secondary)', marginTop: '8px', marginBottom: '20px' }},
            mode === 'createExample' 
              ? "This name will identify your new example project template." 
              : "This name will be used to identify your project."
          ),
          React.createElement("div", { style: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }},
            React.createElement("button", { type: "button", onClick: onCancel }, "Cancel"),
            React.createElement("button", { type: "submit", className: "primary", disabled: !projectName.trim() },
              confirmButtonText
            )
          )
        )
      )
    )
  );
};

export default ProjectNameModal;
