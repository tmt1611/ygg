import React, { useState, useMemo } from 'react';
import HistoryItem from '../HistoryItem.js';
import HistoryControls from '../HistoryControls.js';
import { EVENT_TYPE_INFO } from '../../constants.js';

const KEY_EVENT_TYPES = [
  'TREE_INIT_AI', 'AI_MOD_CONFIRMED', 'AI_SUMMARY_GEN', 'NODE_INSIGHTS_GENERATED',
  'AI_STRATEGY_GEN', 'NODE_CREATED', 'NODE_UPDATED', 'NODE_DELETED', 'NODE_LOCK_TOGGLED',
  'NODE_STATUS_CHANGED', 'NODE_PROJECT_LINK_CREATED', 'NODE_PROJECT_LINK_REMOVED',
  'TREE_LOCK_ALL', 'TREE_UNLOCK_ALL', 'PROJECT_CREATED', 'PROJECT_LOADED',
  'PROJECT_SAVED', 'PROJECT_RENAMED', 'PROJECT_DELETED', 'PROJECT_IMPORTED',
  'PROJECT_EXAMPLE_LOADED', 'TREE_DOWNLOADED', 'API_KEY_STATUS_CHANGED',
  'APP_ERROR_ENCOUNTERED', 
];

const HistoryViewTabContent = ({ history, onClearHistory }) => {
  const [filterMode, setFilterMode] = useState('key');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredHistory = useMemo(() => {
    if (filterMode === 'key') {
      return history.filter(entry => KEY_EVENT_TYPES.includes(entry.type));
    }
    return history;
  }, [history, filterMode]);

  return (
    React.createElement("div", { style: { display: 'flex', flexDirection: 'column', gap: '8px', height: '100%' }},
      React.createElement(HistoryControls, {
        searchTerm: searchTerm,
        onSearchTermChange: setSearchTerm,
        filterMode: filterMode,
        onFilterModeChange: setFilterMode,
        filteredCount: filteredHistory.length,
        keyEventsCount: keyEventsCount,
        totalCount: history.length,
        onClearHistory: onClearHistory,
        isClearDisabled: history.length === 0,
      }),
      React.createElement("div", { style: { flexGrow: 1, overflowY: 'auto' }},
        filteredHistory.length > 0 ? (
          React.createElement("ul", { style: { listStyle: 'none', padding: 0, margin: 0 }, "aria-label": "History of actions" },
            filteredHistory.map((entry) => (
              React.createElement(HistoryItem, { key: entry.id, entry: entry })
            ))
          )
        ) : (
          React.createElement("div", { className: "placeholder-center-content", style: { minHeight: '100px', padding: '10px' }},
            React.createElement("span", { className: "placeholder-icon", style: {fontSize: '2em', marginBottom: '8px'}}, "📜"),
            history.length > 0 ?
                React.createElement("p", { style: { color: 'var(--text-tertiary)', fontSize: '0.9em' }}, "No actions match your search.") :
                React.createElement("p", { style: { color: 'var(--text-tertiary)', fontSize: '0.9em' }}, "No actions recorded yet.")
          )
        )
      )
    )
  );
};

export default HistoryViewTabContent;