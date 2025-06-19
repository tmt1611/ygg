
import React from 'react';
import HistoryItem from './HistoryItem.js';

const HistoryPanel = ({ history }) => {
  if (history.length === 0) {
    return (
      React.createElement("div", { className: "placeholder-center-content", style: { minHeight: '100px', padding: '10px' }},
        React.createElement("span", { className: "placeholder-icon", style: {fontSize: '2em', marginBottom: '8px'}}, "📜"),
        React.createElement("p", { style: { color: 'var(--text-tertiary)', fontSize: '0.9em' }}, "No actions recorded yet.")
      )
    );
  }

  return (
    React.createElement("div", { style: { flexGrow: 1, overflowY: 'auto' }},
      React.createElement("ul", { style: { listStyle: 'none', padding: 0, margin: 0 }, "aria-label": "History of actions" },
        history.map((entry) => (
          React.createElement(HistoryItem, { key: entry.id, entry: entry })
        ))
      )
    )
  );
};

export default HistoryPanel;
