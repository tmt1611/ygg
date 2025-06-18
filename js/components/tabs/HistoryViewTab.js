
import React, { useState, useMemo } from 'react';
import HistoryPanel from '../HistoryPanel.js';
import { EVENT_TYPE_INFO } from '../../constants.js';

const KEY_EVENT_TYPES = Object.keys(EVENT_TYPE_INFO).filter(key => EVENT_TYPE_INFO[key].isKey);

const HistoryViewTabContent = ({ history }) => {
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
      React.createElement("div", { className: "history-controls", style: { padding: '0 4px 8px 4px', borderBottom: '1px solid var(--border-color)', marginBottom: '5px' } },
        React.createElement("input", {
          type: "search",
          placeholder: `Search ${filteredHistory.length} events...`,
          value: searchTerm,
          onChange: (e) => setSearchTerm(e.target.value),
          style: { width: '100%', fontSize: '0.9em' },
          "aria-label": "Search history log"
        })
      ),
      React.createElement(HistoryPanel, { history: filteredHistory })
    )
  );
};

export default HistoryViewTabContent;
