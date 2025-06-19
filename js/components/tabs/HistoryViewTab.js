import React, { useState, useMemo } from 'react';
import HistoryItem from '../HistoryItem.js';
import HistoryControls from '../HistoryControls.js';
import { EVENT_TYPE_INFO } from '../../constants.js';

const KEY_EVENT_TYPES = Object.keys(EVENT_TYPE_INFO).filter(key => EVENT_TYPE_INFO[key].isKey);

const HistoryViewTabContent = ({ history, onClearHistory }) => {
  const [filterMode, setFilterMode] = useState('key');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredHistory = useMemo(() => {
    let tempHistory = history;
    if (filterMode === 'key') {
      tempHistory = tempHistory.filter(entry => KEY_EVENT_TYPES.includes(entry.type));
    }
    if (searchTerm.trim()) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      tempHistory = tempHistory.filter(entry => entry.summary.toLowerCase().includes(lowerSearchTerm));
    }
    return tempHistory;
  }, [history, filterMode, searchTerm]);

  const keyEventsCount = useMemo(() => history.filter(entry => KEY_EVENT_TYPES.includes(entry.type)).length, [history]);

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