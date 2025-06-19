import React, { useState, useMemo } from 'react';
import HistoryItem from '../HistoryItem.js';
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
      React.createElement("div", { className: "panel-header", style: { alignItems: 'center', gap: '8px', padding: '4px 8px', borderBottom: '1px solid var(--border-color)', marginBottom: 0 } },
        React.createElement("span", { className: "panel-header-icon", style: { fontSize: '1.2em' } }, "📜"),
        React.createElement("h3", { style: { fontSize: '1.05em', margin: 0, flexShrink: 0 } }, "Action History"),
        React.createElement("div", { className: "panel-header-actions", style: { flexGrow: 1, justifyContent: 'flex-end', gap: '8px' } },
          React.createElement("input", {
            type: "search",
            placeholder: `Search ${filteredHistory.length} events...`,
            value: searchTerm,
            onChange: (e) => setSearchTerm(e.target.value),
            style: { width: '100%', maxWidth: '200px', fontSize: '0.85em', padding: '4px 8px' },
            "aria-label": "Search history log"
          }),
          React.createElement("div", { className: "segmented-control", role: "radiogroup", "aria-label": "History Filter" },
            React.createElement("button", {
              role: "radio", "aria-checked": filterMode === 'key',
              className: filterMode === 'key' ? 'active' : '',
              onClick: () => setFilterMode('key'),
              title: `Show Key Events Only (${keyEventsCount})`
            }, "Key"),
            React.createElement("button", {
              role: "radio", "aria-checked": filterMode === 'all',
              className: filterMode === 'all' ? 'active' : '',
              onClick: () => setFilterMode('all'),
              title: `Show All Events (${history.length})`
            }, "All")
          ),
          React.createElement("button", {
              onClick: onClearHistory,
              className: "base-icon-button",
              title: "Clear all history entries",
              disabled: history.length === 0,
              style: { padding: '4px' }
          }, '🧹')
        )
      ),
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