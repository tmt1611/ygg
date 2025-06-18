import React, { useMemo } from 'react';

const EVENT_TYPE_INFO = {
    // AI
    'TREE_INIT_AI': { icon: '🧠', color: 'var(--primary-accent)' },
    'AI_MOD_CONFIRMED': { icon: '🤖', color: 'var(--primary-accent)' },
    'AI_MOD_REJECTED': { icon: '🚫', color: 'var(--text-tertiary)' },
    'AI_MOD_UNDONE': { icon: '↩️', color: 'var(--warning-color)' },
    'NODE_INSIGHTS_GENERATED': { icon: '💡', color: 'var(--primary-accent-dark)' },
    'AI_STRATEGY_GEN': { icon: '✨', color: 'var(--primary-accent-dark)' },
    'AI_SUMMARY_GEN': { icon: '📜', color: 'var(--primary-accent-dark)' },
    'TREE_MOD_AI': { icon: '🤖', color: 'var(--text-secondary)' },

    // Node Ops
    'NODE_CREATED': { icon: '➕', color: 'var(--success-color)' },
    'NODE_UPDATED': { icon: '✏️', color: 'var(--text-secondary)' },
    'NODE_DELETED': { icon: '🗑️', color: 'var(--error-color)' },
    'NODE_LOCK_TOGGLED': { icon: '🔒', color: 'var(--text-secondary)' },
    'NODE_IMPORTANCE_CHANGED': { icon: '⚖️', color: 'var(--text-secondary)' },

    // Project Linking
    'NODE_PROJECT_LINK_CREATED': { icon: '🔗', color: 'var(--secondary-accent-dark)' },
    'NODE_PROJECT_LINK_REMOVED': { icon: '🚫', color: 'var(--secondary-accent-dark)' },

    // Tree-wide
    'TREE_LOCK_ALL': { icon: '🛡️', color: 'var(--warning-color)' },
    'TREE_UNLOCK_ALL': { icon: '🛡️', color: 'var(--warning-color)' },
    'TREE_DOWNLOADED': { icon: '📥', color: 'var(--text-secondary)' },
    'TREE_DATA_EXTRACTED': { icon: '📤', color: 'var(--text-secondary)' },

    // Project Management
    'PROJECT_CREATED': { icon: '📁', color: 'var(--success-color)' },
    'PROJECT_LOADED': { icon: '📂', color: 'var(--text-primary)' },
    'PROJECT_SAVED': { icon: '💾', color: 'var(--text-secondary)' },
    'PROJECT_RENAMED': { icon: '✏️', color: 'var(--text-primary)' },
    'PROJECT_DELETED': { icon: '🗑️', color: 'var(--error-color)' },
    'PROJECT_IMPORTED': { icon: '📄', color: 'var(--success-color)' },
    'PROJECT_EXAMPLE_LOADED': { icon: '⭐', color: 'var(--text-primary)' },

    // System & Misc
    'API_KEY_STATUS_CHANGED': { icon: '🔑', color: 'var(--text-secondary)' },
    'APP_ERROR_ENCOUNTERED': { icon: '⚠️', color: 'var(--error-color)' },
    'THEME_CHANGED': { icon: '🎨', color: 'var(--text-tertiary)' },
    'VIEW_CHANGED': { icon: '👁️', color: 'var(--text-tertiary)' },

    // Default
    'default': { icon: '🔹', color: 'var(--text-tertiary)' }
};

const HistoryItem = ({ entry }) => {
    const { icon, color } = EVENT_TYPE_INFO[entry.type] || EVENT_TYPE_INFO.default;

    const title = `Type: ${entry.type}\nTimestamp: ${new Date(entry.timestamp).toLocaleString()}${entry.details ? `\nDetails: ${JSON.stringify(entry.details)}` : ''}`;

    const summaryWithHighlights = useMemo(() => {
        if (!entry.summary) return '';
        // This regex will match quoted strings or known keywords
        const regex = /"([^"]*)"|\b(created|deleted|updated|locked|unlocked|saved|loaded|imported|generated|applied|rejected|undone|cleared|failed|added|removed|changed|renamed|activated|switched|proposed|discarded|downloaded)\b/gi;
        
        return entry.summary.replace(regex, (match, quotedContent, keyword) => {
            // Both `quotedContent` and `keyword` are captured. One will be defined, the other undefined.
            if (quotedContent !== undefined) {
                return `<strong>"${quotedContent}"</strong>`;
            }
            if (keyword !== undefined) {
                return `<strong class="history-keyword">${keyword}</strong>`;
            }
            return match;
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