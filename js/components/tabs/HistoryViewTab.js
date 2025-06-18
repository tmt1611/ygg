
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
];

const HistoryViewTabContent = ({ history }) => {
  const [filterMode, setFilterMode] = useState('key');

  const filteredHistory = useMemo(() => {
    if (filterMode === 'key') {
      return history.filter(entry => KEY_EVENT_TYPES.includes(entry.type));
    }
    return history;
  }, [history, filterMode]);

  return (
    React.createElement("div", { style: { display: 'flex', flexDirection: 'column', gap: '10px' }},
      React.createElement("div", { style: { display: 'flex', justifyContent: 'center', gap: '10px', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }},
        React.createElement("button", {
          onClick: () => setFilterMode('all'),
          className: filterMode === 'all' ? 'primary' : 'secondary',
          disabled: filterMode === 'all',
          style: {fontSize: '0.9em', padding: '6px 10px'}
        },
          "Show All (", history.length, ")"
        ),
        React.createElement("button", {
          onClick: () => setFilterMode('key'),
          className: filterMode === 'key' ? 'primary' : 'secondary',
          disabled: filterMode === 'key',
          style: {fontSize: '0.9em', padding: '6px 10px'}
        },
          "Key Events Only (", history.filter(entry => KEY_EVENT_TYPES.includes(entry.type)).length, ")"
        )
      ),
      React.createElement(HistoryPanel, { history: filteredHistory })
    )
  );
};

export default HistoryViewTabContent;
