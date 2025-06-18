
import React, { useState, useMemo } from 'react';
import HistoryPanel from '../HistoryPanel.js';

const KEY_EVENT_TYPES = [
  'TREE_INIT_AI', 'AI_MOD_CONFIRMED', 'AI_SUMMARY_GEN', 'NODE_INSIGHTS_GENERATED',
  'AI_STRATEGY_GEN', 'NODE_CREATED', 'NODE_UPDATED', 'NODE_DELETED', 'NODE_LOCK_TOGGLED',
  'NODE_IMPORTANCE_CHANGED', 'NODE_PROJECT_LINK_CREATED', 'NODE_PROJECT_LINK_REMOVED',
  'TREE_LOCK_ALL', 'TREE_UNLOCK_ALL', 'PROJECT_CREATED', 'PROJECT_LOADED',
  'PROJECT_SAVED', 'PROJECT_RENAMED', 'PROJECT_DELETED', 'PROJECT_IMPORTED',
  'PROJECT_EXAMPLE_LOADED', 'TREE_DOWNLOADED', 'API_KEY_STATUS_CHANGED',
  'APP_ERROR_ENCOUNTERED',
  'THEME_CHANGED', 
  'VIEW_CHANGED'
];

const HistoryViewTabContent = ({ history }) => {
  const [filterMode, setFilterMode] = useState('key');

  const filteredHistory = useMemo(() => {
    if (filterMode === 'key') {
      return history.filter(entry => KEY_EVENT_TYPES.includes(entry.type));
    }
    return history;
  }, [history, filterMode]);

  const keyEventsCount = useMemo(() => history.filter(entry => KEY_EVENT_TYPES.includes(entry.type)).length, [history]);

  return (
    React.createElement("div", { style: { display: 'flex', flexDirection: 'column', gap: '10px', height: '100%' }},
      React.createElement("div", { className: "panel-header" },
        React.createElement("span", { className: "panel-header-icon", style: { fontSize: '1.2em' } }, "📜"),
        React.createElement("h3", { style: { fontSize: '1.05em' } }, "Action History"),
        React.createElement("div", { className: "panel-header-actions", style: { display: 'flex', gap: '4px' }},
          React.createElement("button", {
            onClick: () => setFilterMode('all'),
            className: `base-icon-button ${filterMode === 'all' ? 'active' : ''}`,
            disabled: filterMode === 'all',
            title: `Show All Events (${history.length})`
          }, "All"),
          React.createElement("button", {
            onClick: () => setFilterMode('key'),
            className: `base-icon-button ${filterMode === 'key' ? 'active' : ''}`,
            disabled: filterMode === 'key',
            title: `Show Key Events Only (${keyEventsCount})`
          }, "Key")
        )
      ),
      React.createElement(HistoryPanel, { history: filteredHistory })
    )
  );
};

export default HistoryViewTabContent;
