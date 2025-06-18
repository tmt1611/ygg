
import React, { useState, useMemo } from 'react';
import { findNodesByTerm } from '../utils.js';
import CollapsiblePanel from './CollapsiblePanel.js'; 

const FocusViewSearchPanel = ({
  treeData,
  currentFocusNodeId,
  onSetFocusNode,
  isAppBusy,
  isPanelCollapsed,
  onTogglePanel,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const searchResults = useMemo(() => {
    if (!treeData || !searchTerm.trim()) return [];
    return findNodesByTerm(treeData, searchTerm);
  }, [treeData, searchTerm]);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleResultClick = (nodeId) => {
    onSetFocusNode(nodeId);
    setSearchTerm(''); 
  };

  return (
    React.createElement(CollapsiblePanel, {
      panelId: "focus-view-search-panel",
      title: "Search in Focus",
      icon: "🔍",
      isCollapsed: isPanelCollapsed,
      onToggle: () => onTogglePanel("focus-view-search-panel")
    },
      React.createElement("div", { style: { display: 'flex', flexDirection: 'column', gap: '10px' }},
        React.createElement("label", { htmlFor: "focus-view-search-input" }, "Search Nodes:"),
        React.createElement("input", {
          type: "search",
          id: "focus-view-search-input",
          value: searchTerm,
          onChange: handleSearchChange,
          placeholder: "Find node by name/desc...",
          style: { width: '100%' },
          disabled: isAppBusy || !treeData,
          "aria-label": "Search nodes in current project"
        }),
        searchTerm && (
          React.createElement("ul", {
            style: {
              listStyle: 'none',
              padding: 0,
              margin: '0',
              fontSize: '0.9em',
              maxHeight: '200px', 
              overflowY: 'auto',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--border-radius)',
            },
            "aria-live": "polite"
          },
            searchResults.length > 0 ? (
              searchResults.map((node) => (
                React.createElement("li", {
                  key: `focus-search-${node.id}`,
                  style: {
                    padding: '8px 10px',
                    borderBottom: '1px solid var(--border-color)',
                    cursor: 'pointer',
                    backgroundColor: node.id === currentFocusNodeId ? 'var(--primary-accent-hover-bg)' : 'transparent',
                  },
                  onClick: () => handleResultClick(node.id),
                  onKeyDown: (e) => { if (e.key === 'Enter' || e.key === ' ') handleResultClick(node.id); },
                  tabIndex: 0,
                  role: "button",
                  "aria-pressed": node.id === currentFocusNodeId,
                  title: `Focus on ${node.name}`
                },
                  node.name,
                  node.id === currentFocusNodeId && React.createElement("span", {style: {fontSize: '0.8em', color: 'var(--primary-accent)', marginLeft: '5px'}}, "(Current Focus)")
                )
              ))
            ) : (
              React.createElement("li", { style: { padding: '8px 10px', color: 'var(--text-secondary)', fontStyle: 'italic' }},
                "No nodes found for \"", searchTerm, "\"."
              )
            ),
            searchResults.length > 0 && React.createElement("li", {style: { padding: '5px 10px', fontSize: '0.8em', color: 'var(--text-tertiary)', textAlign: 'right' }}, searchResults.length, " found")
          )
        ),
         !searchTerm && treeData && React.createElement("p", {style: {fontSize: '0.85em', color: 'var(--text-tertiary)', textAlign: 'center'}}, "Enter a term to search for nodes in the current project."),
         !treeData && React.createElement("p", {style: {fontSize: '0.85em', color: 'var(--text-tertiary)', textAlign: 'center'}}, "Load a project to enable search.")
      )
    )
  );
};

export default FocusViewSearchPanel;
