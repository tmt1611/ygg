import React, { useMemo } from 'react';
import { EVENT_TYPE_INFO } from '../constants.js';

// Dynamically build a regex from keywords defined in constants for highlighting.
const DYNAMIC_KEYWORDS = Object.values(EVENT_TYPE_INFO).flatMap(info => info.keywords || []);
const HIGHLIGHT_REGEX = new RegExp(`"([^"]*)"|\\b(${[...new Set(DYNAMIC_KEYWORDS)].join('|')})\\b`, 'gi');

const escapeHtml = (unsafe) => {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

const HistoryItem = ({ entry }) => {
    const { icon, color } = EVENT_TYPE_INFO[entry.type] || EVENT_TYPE_INFO.default;

    const title = `Type: ${entry.type}\nTimestamp: ${new Date(entry.timestamp).toLocaleString()}${entry.details ? `\nDetails: ${JSON.stringify(entry.details)}` : ''}`;

    const summaryWithHighlights = useMemo(() => {
        if (!entry.summary) return '';
        
        // This regex will match quoted strings (as entities) or known keywords.
        return entry.summary.replace(HIGHLIGHT_REGEX, (match, quotedContent, keyword) => {
            if (quotedContent !== undefined) {
                // This is user-provided content inside quotes, so it must be escaped.
                return `<strong class="history-entity">"${escapeHtml(quotedContent)}"</strong>`;
            }
            if (keyword !== undefined) {
                // This is a known keyword from our safe list, no need to escape.
                return `<strong class="history-keyword">${keyword.toLowerCase()}</strong>`;
            }
            return match; // Should not happen with this regex, but for safety.
        });
    }, [entry.summary]);

    return (
        React.createElement("li", { className: "history-item", title: title },
            React.createElement("span", { 
                className: "history-item-icon", 
                style: { color: color }, 
                "aria-hidden": "true" 
            }, icon),
            React.createElement("span", { 
                className: "history-item-summary", 
                dangerouslySetInnerHTML: { __html: summaryWithHighlights } 
            }),
            React.createElement("span", { className: "history-item-time" },
                new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            )
        )
    );
};

export default HistoryItem;