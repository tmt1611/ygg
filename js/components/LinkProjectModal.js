
import React, { useState, useEffect, useRef, useMemo } from 'react';

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
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef(null);
  const firstRadioRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedTargetProjectId(null);
      setSearchTerm('');
      setTimeout(() => searchInputRef.current?.focus(), 50);
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

  const filteredProjects = useMemo(() => {
    const available = currentProjects.filter(
      (p) => p.id !== activeProjectId && !p.isExample
    );
    if (!searchTerm.trim()) {
      return available;
    }
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return available.filter(p => p.name.toLowerCase().includes(lowerCaseSearchTerm));
  }, [currentProjects, activeProjectId, searchTerm]);

  if (!isOpen) return null;

  const handleConfirm = (e) => {
    e.preventDefault();
    if (selectedTargetProjectId) {
      const targetProject = currentProjects.find(p => p.id === selectedTargetProjectId);
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
      "aria-labelledby": "link-project-modal-title",
      onClick: (e) => { if (e.target === e.currentTarget) onCancel(); }
    },
      React.createElement("div", { className: "modal-content-basic", style: { width: 'clamp(400px, 70vw, 600px)' }},
        React.createElement("form", { onSubmit: handleConfirm },
          React.createElement("h2", { id: "link-project-modal-title", className: "modal-title" },
            React.createElement("span", { className: "modal-icon" }, "🔗"),
            "Link Node \"", sourceNodeName, "\" to another Project"
          ),
          React.createElement("p", { style: { color: 'var(--text-secondary)', marginBottom: '10px' }},
            "Select a target project. This node will then link to the root of the chosen project."
          ),

          React.createElement("div", { style: { marginBottom: '15px' }},
            React.createElement("input", {
              ref: searchInputRef,
              type: "search",
              placeholder: "Search for a project to link...",
              value: searchTerm,
              onChange: (e) => setSearchTerm(e.target.value),
              style: { width: '100%' },
              "aria-label": "Search for project to link"
            })
          ),

          filteredProjects.length > 0 ? (
            React.createElement("div", { style: { maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius)', padding: '10px', background: 'var(--panel-alt-bg)' }},
              filteredProjects.map((project, index) => (
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
              searchTerm ? `No projects match "${searchTerm}".` : "No other user-created projects available to link to."
            )
          ),

          React.createElement("div", { style: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', paddingTop: '15px', borderTop: '1px solid var(--border-color)' }},
            React.createElement("button", { type: "button", onClick: onCancel, className: "secondary" }, "Cancel"),
            React.createElement("button", {
              type: "submit",
              className: "primary",
              disabled: !selectedTargetProjectId || filteredProjects.length === 0
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
