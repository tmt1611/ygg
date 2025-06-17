
import React, { useState, useMemo } from 'react';
import HistoryPanel from '../HistoryPanel.js';
// import { HistoryEntry, HistoryActionType } from '../../types.js'; // Types removed

const KEY_EVENT_TYPES = [
  'TREE_INIT_AI', 'AI_MOD_CONFIRMED', 'AI_SUMMARY_GEN', 'NODE_INSIGHTS_GENERATED',
  'AI_STRATEGY_GEN', 'NODE_CREATED', 'NODE_UPDATED', 'NODE_DELETED', 'NODE_LOCK_TOGGLED',
  'NODE_STATUS_CHANGED', 'NODE_PROJECT_LINK_CREATED', 'NODE_PROJECT_LINK_REMOVED',
  'TREE_LOCK_ALL', 'TREE_UNLOCK_ALL', 'PROJECT_CREATED', 'PROJECT_LOADED',
  'PROJECT_SAVED', 'PROJECT_RENAMED', 'PROJECT_DELETED', 'PROJECT_IMPORTED',
  'PROJECT_EXAMPLE_LOADED', 'TREE_DOWNLOADED', 'API_KEY_STATUS_CHANGED',
  'APP_ERROR_ENCOUNTERED', 'HISTORY_CLEARED'
];

const HistoryViewTabContent = ({ history, onClearHistory }) => {
  const [filterMode, setFilterMode] = useState('key');

  const filteredHistory = useMemo(() => {
    const hist = history || [];
    if (filterMode === 'key') {
      return hist.filter(entry => KEY_EVENT_TYPES.includes(entry.type));
    }
    return hist;
  }, [history, filterMode]);

  const keyEventsCount = useMemo(() => (history || []).filter(entry => KEY_EVENT_TYPES.includes(entry.type)).length, [history]);

  const handleClear = () => {
    if (window.confirm('Are you sure you want to permanently clear all history logs? This cannot be undone.')) {
      onClearHistory();
    }
  };

  return (
    React.createElement("div", { style: { display: 'flex', flexDirection: 'column', gap: '15px' }},
      React.createElement("div", { className: "panel", style: { padding: '10px' } },
        React.createElement("h3", { className: "panel-sub-header", style: { margin: '0 0 10px 0', padding: 0, borderBottom: '1px solid rgba(var(--primary-accent-rgb),0.2)', paddingBottom: '8px'}}, "Action Log"),
        React.createElement("div", { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }},
          React.createElement("div", { className: "panel-button-group", style: { flexDirection: 'row', gap: '5px' } },
            React.createElement("button", {
              onClick: () => setFilterMode('all'),
              className: filterMode === 'all' ? 'primary' : 'secondary',
              style: {fontSize: '0.85em', padding: '5px 8px'},
              disabled: filterMode === 'all' || history.length === 0,
              title: "Show all recorded actions"
            }, "All (", history.length, ")"),
            React.createElement("button", {
              onClick: () => setFilterMode('key'),
              className: filterMode === 'key' ? 'primary' : 'secondary',
              style: {fontSize: '0.85em', padding: '5px 8px'},
              disabled: filterMode === 'key' || history.length === 0,
              title: "Show only major, significant actions"
            }, "Key (", keyEventsCount, ")")
          ),
          React.createElement("button", {
            onClick: handleClear,
            disabled: history.length === 0,
            className: "base-icon-button",
            title: "Clear all history logs",
            style: { color: 'var(--error-color)', fontSize: '1.2em' }
          }, "🗑️")
        )
      ),
      React.createElement(HistoryPanel, { history: filteredHistory })
    )
  );
};

export default HistoryViewTabContent;
