import React, { useMemo } from 'react';
import { EVENT_TYPE_INFO } from '../constants.js';

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
        // This regex will match quoted strings or known keywords
        const regex = /"([^"]*)"|\b(created|deleted|updated|locked|unlocked|saved|loaded|imported|generated|applied|rejected|undone|cleared|failed|added|removed|changed|renamed|activated|switched|proposed|discarded|downloaded|set|enabled|disabled|opened|closed|cleared|regenerate|regenerated|revert|reverted|link|linked|unlink|unlinked)\b/gi;
        
        return entry.summary.replace(regex, (match, quotedContent, keyword) => {
            // Both `quotedContent` and `keyword` are captured. One will be defined, the other undefined.
            if (quotedContent !== undefined) {
                // Escape user-provided content to prevent XSS.
                return `<strong class="history-entity">"${escapeHtml(quotedContent)}"</strong>`;
            }
            if (keyword !== undefined) {
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