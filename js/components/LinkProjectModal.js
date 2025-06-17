
import React, { useState, useEffect, useRef } from 'react';
// import { Project, LinkProjectModalConfig } from '../types.js'; // Types removed

const LinkProjectModal = ({
  isOpen,
  sourceNodeId,
  sourceNodeName,
  currentProjects,
  activeProjectId,
  onConfirm,
  onCancel,
}) => {
  const [selectedTargetProjectId, setSelectedTargetProjectId] = useState(null);
  const firstRadioRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedTargetProjectId(null); 
      setTimeout(() => firstRadioRef.current?.focus(), 50);
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

  if (!isOpen) return null;

  const availableProjectsToLink = currentProjects.filter(
    (p) => p.id !== activeProjectId && !p.isExample 
  );

  const handleConfirm = (e) => {
    e.preventDefault();
    if (selectedTargetProjectId) {
      const targetProject = availableProjectsToLink.find(p => p.id === selectedTargetProjectId);
      if (targetProject) {
        onConfirm(sourceNodeId, targetProject.id, targetProject.name);
      }
    }
  };

  return (
    React.createElement("div", {
      className: "modal-overlay-basic",
      role: "dialog",
      "aria-modal": "true",
      "aria-labelledby": "link-project-modal-title"
    },
      React.createElement("div", { className: "modal-content-basic", style: { width: 'clamp(400px, 70vw, 600px)' }},
        React.createElement("form", { onSubmit: handleConfirm },
          React.createElement("h2", { id: "link-project-modal-title", style: { fontSize: '1.3em', color: 'var(--text-primary)', marginBottom: '15px' }},
            "Link Node \"", sourceNodeName, "\" to another Project"
          ),
          React.createElement("p", { style: { color: 'var(--text-secondary)', marginBottom: '10px' }},
            "Select a target project. This node will then link to the root of the chosen project."
          ),

          availableProjectsToLink.length > 0 ? (
            React.createElement("div", { style: { maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius)', padding: '10px', background: 'var(--panel-alt-bg)' }},
              availableProjectsToLink.map((project, index) => (
                React.createElement("label", {
                  key: project.id,
                  htmlFor: `project-link-target-${project.id}`,
                  style: {
                    display: 'block',
                    padding: '8px 10px',
                    borderRadius: 'var(--border-radius)',
                    cursor: 'pointer',
                    backgroundColor: selectedTargetProjectId === project.id ? 'var(--primary-accent-hover-bg)' : 'transparent',
                    border: `1px solid ${selectedTargetProjectId === project.id ? 'var(--primary-accent)' : 'transparent'}`,
                    marginBottom: '5px',
                  }
                },
                  React.createElement("input", {
                    ref: index === 0 ? firstRadioRef : null,
                    type: "radio",
                    id: `project-link-target-${project.id}`,
                    name: "targetProject",
                    value: project.id,
                    checked: selectedTargetProjectId === project.id,
                    onChange: () => setSelectedTargetProjectId(project.id),
                    style: { marginRight: '10px' }
                  }),
                  project.name
                )
              ))
            )
          ) : (
            React.createElement("p", { style: { color: 'var(--text-secondary)', fontStyle: 'italic', textAlign: 'center', padding: '20px' }},
              "No other user-created projects available to link to."
            )
          ),

          React.createElement("div", { style: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', paddingTop: '15px', borderTop: '1px solid var(--border-color)' }},
            React.createElement("button", { type: "button", onClick: onCancel, className: "secondary" }, "Cancel"),
            React.createElement("button", {
              type: "submit",
              className: "primary",
              disabled: !selectedTargetProjectId || availableProjectsToLink.length === 0
            },
              "Link to Selected Project"
            )
          )
        )
      )
    )
  );
};

export default LinkProjectModal;
