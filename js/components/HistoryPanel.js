
import React from 'react';
// import { HistoryEntry } from '../types.js'; // Types removed

const HistoryPanel = ({ history }) => {
  if (history.length === 0) {
    return (
      React.createElement("div", { style: { textAlign: 'center', minHeight: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px' }},
        React.createElement("p", { style: { color: 'var(--text-secondary)' }}, "No actions recorded yet.")
      )
    );
  }

  return (
    React.createElement("div", { style: { maxHeight: '350px', overflowY: 'auto', paddingRight: '5px' }},
      React.createElement("ul", { style: { listStyle: 'none', padding: 0, margin: 0 }},
        history.map((entry) => (
          React.createElement("li", { 
            key: entry.id, 
            style: { 
              padding: '4px 2px', 
              borderBottom: '1px dotted var(--border-color)', 
              marginBottom: '0px', 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'baseline',
              gap: '8px'
            }
          },
            React.createElement("span", { style: { fontSize: '0.9em', color: 'var(--text-primary)', flexGrow: 1, wordBreak: 'break-word' }}, entry.summary),
            React.createElement("span", { style: { fontSize: '0.75em', color: 'var(--text-tertiary)', whiteSpace: 'nowrap', flexShrink: 0 }},
              new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            )
          )
        ))
      )
    )
  );
};

export default HistoryPanel;
