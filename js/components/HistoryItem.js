import React, { useMemo } from 'react';
import { EVENT_TYPE_INFO } from '../constants.js';

const DYNAMIC_KEYWORDS = [...new Set(Object.values(EVENT_TYPE_INFO).flatMap(info => info.keywords || []))];
const KEYWORD_REGEX_PART = DYNAMIC_KEYWORDS.map(kw => `\\b${kw}\\b`).join('|');
// This regex will split the string by quoted content and keywords, keeping them in the results.
const TOKENIZER_REGEX = new RegExp(`(".*?")|(${KEYWORD_REGEX_PART})`, 'gi');

const HistoryItem = ({ entry }) => {
    const { icon, color } = EVENT_TYPE_INFO[entry.type] || EVENT_TYPE_INFO.default;
    const title = `Type: ${entry.type}\nTimestamp: ${new Date(entry.timestamp).toLocaleString()}${entry.details ? `\nDetails: ${JSON.stringify(entry.details)}` : ''}`;

    const summaryElements = useMemo(() => {
        if (!entry.summary) return null;

        const parts = entry.summary.split(TOKENIZER_REGEX).filter(Boolean);
        
        return parts.map((part, index) => {
            if (part.startsWith('"') && part.endsWith('"')) {
                return React.createElement("strong", { key: index, className: "history-entity" }, part);
            }
            if (DYNAMIC_KEYWORDS.includes(part.toLowerCase())) {
                return React.createElement("strong", { key: index, className: "history-keyword" }, part.toLowerCase());
            }
            return React.createElement(React.Fragment, { key: index }, part);
        });

    }, [entry.summary]);

    return (
        React.createElement("li", { className: "history-item", title: title },
            React.createElement("span", { 
                className: "history-item-icon", 
                style: { color: color }, 
                "aria-hidden": "true" 
            }, icon),
            React.createElement("span", { className: "history-item-summary" }, summaryElements),
            React.createElement("span", { className: "history-item-time" },
                new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            )
        )
    );
};

export default HistoryItem;