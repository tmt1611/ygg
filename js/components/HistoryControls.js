import React from 'react';

const HistoryControls = ({
  searchTerm,
  onSearchTermChange,
  filterMode,
  onFilterModeChange,
  filteredCount,
  keyEventsCount,
  totalCount,
  onClearHistory,
  isClearDisabled,
}) => {
  return (
    React.createElement("div", { className: "history-controls" },
      React.createElement("input", {
        type: "search",
        placeholder: `Search ${filteredCount} events...`,
        value: searchTerm,
        onChange: (e) => onSearchTermChange(e.target.value),
        "aria-label": "Search history log"
      }),
      React.createElement("div", { style: { flexGrow: 1 }}), // Spacer
      React.createElement("div", { className: "segmented-control", role: "radiogroup", "aria-label": "History Filter" },
        React.createElement("button", {
          role: "radio", "aria-checked": filterMode === 'key',
          className: filterMode === 'key' ? 'active' : '',
          onClick: () => onFilterModeChange('key'),
          title: `Show Key Events Only (${keyEventsCount})`
        }, "Key"),
        React.createElement("button", {
          role: "radio", "aria-checked": filterMode === 'all',
          className: filterMode === 'all' ? 'active' : '',
          onClick: () => onFilterModeChange('all'),
          title: `Show All Events (${totalCount})`
        }, "All")
      ),
      React.createElement("button", {
        onClick: onClearHistory,
        className: "base-icon-button",
        title: "Clear all history entries",
        disabled: isClearDisabled,
        style: { padding: '4px' }
      }, '🧹')
    )
  );
};

export default HistoryControls;