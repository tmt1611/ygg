<<<<<<< SEARCH
import React from 'react';

const StatDisplay = ({ label, value, valueClassName }) => (
  React.createElement("div", { className: "stat-item" },
    React.createElement("span", { className: "stat-label" }, label),
    React.createElement("span", { className: `stat-value ${valueClassName || ''}` }, value)
  )
);

const ProjectOverviewPanel = ({
  stats,
  projectName,
  onToggleAllLock,
  isAppBusy,
}) => {
  const showStats = !!stats;

  return (
    React.createElement("div", { className: "panel", style: {display: 'flex', flexDirection: 'column', gap: '20px'} },
      React.createElement("fieldset", null,
        React.createElement("legend", null, "Project Statistics"),
        showStats ? (
          React.createElement(React.Fragment, null,
            React.createElement("div", { style: {display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}},
                React.createElement("h3", { className: "panel-header", style: {margin: 0, fontSize: '1.2em'}},
                  "Overview: ", projectName || 'Current Project'
                ),
                React.createElement("button", { 
                    onClick: onToggleAllLock, 
                    disabled: isAppBusy, 
                    className: "secondary panel-button",
                    style: {padding: '5px 10px', fontSize: '0.9em'},
                    title: stats.isAllLocked ? 'Unlock all nodes in the current project' : 'Lock all nodes in the current project to prevent changes'
                },
                    stats.isAllLocked ? '🔓 Unlock All' : '🔒 Lock All'
                )
            ),
            React.createElement("div", { className: "project-stats-grid" },
              React.createElement(StatDisplay, { label: "Total Nodes", value: stats.totalNodes }),
              React.createElement(StatDisplay, { label: "Maximum Depth", value: stats.depth }),
              React.createElement(StatDisplay, { label: "Locked Nodes", value: stats.lockedCount, valueClassName: stats.lockedCount > 0 ? 'locked' : '' }),
              React.createElement(StatDisplay, { label: "Minor Nodes", value: stats.importanceCounts.minor, valueClassName: "importance-minor" }),
              React.createElement(StatDisplay, { label: "Common Nodes", value: stats.importanceCounts.common, valueClassName: "importance-common" }),
              React.createElement(StatDisplay, { label: "Major Nodes", value: stats.importanceCounts.major, valueClassName: "importance-major" })
            )
          )
        ) : (
          React.createElement("p", { style: { color: 'var(--text-secondary)', textAlign: 'center', padding: '10px 0' }},
            "Load or create a project to view its statistics."
          )
        )
      )
    )
  );
};

export default ProjectOverviewPanel;
=======
import React from 'react';

const StatDisplay = ({ label, value, valueClassName }) => (
  React.createElement("div", { className: "stat-item" },
    React.createElement("span", { className: "stat-label" }, label),
    React.createElement("span", { className: `stat-value ${valueClassName || ''}` }, value)
  )
);

const ProjectOverviewPanel = ({
  stats,
  projectName,
  onToggleAllLock,
  isAppBusy,
}) => {
  const showStats = !!stats;

  return (
    React.createElement("div", { className: "panel", style: {display: 'flex', flexDirection: 'column', gap: '20px'} },
      React.createElement("fieldset", null,
        React.createElement("legend", null, "Project Statistics"),
        showStats ? (
          React.createElement(React.Fragment, null,
            React.createElement("div", { style: {display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px'}},
                React.createElement("h3", { className: "panel-header", style: {margin: 0, fontSize: '1.2em'}},
                  "Overview: ", projectName || 'Current Project'
                ),
                React.createElement("button", { 
                    onClick: onToggleAllLock, 
                    disabled: isAppBusy, 
                    className: "secondary panel-button",
                    style: {padding: '5px 10px', fontSize: '0.9em'},
                    title: stats.isAllLocked ? 'Unlock all nodes in the current project' : 'Lock all nodes in the current project to prevent changes'
                },
                    stats.isAllLocked ? '🔓 Unlock All' : '🔒 Lock All'
                )
            ),
            React.createElement("div", { className: "project-stats-grid" },
              React.createElement(StatDisplay, { label: "Total Nodes", value: stats.totalNodes }),
              React.createElement(StatDisplay, { label: "Maximum Depth", value: stats.depth }),
              React.createElement(StatDisplay, { label: "Locked Nodes", value: stats.lockedCount, valueClassName: stats.lockedCount > 0 ? 'locked' : '' }),
              React.createElement(StatDisplay, { label: "Minor Nodes", value: stats.importanceCounts.minor, valueClassName: "importance-minor" }),
              React.createElement(StatDisplay, { label: "Common Nodes", value: stats.importanceCounts.common, valueClassName: "importance-common" }),
              React.createElement(StatDisplay, { label: "Major Nodes", value: stats.importanceCounts.major, valueClassName: "importance-major" })
            )
          )
        ) : (
          React.createElement("p", { style: { color: 'var(--text-secondary)', textAlign: 'center', padding: '10px 0' }},
            "Load or create a project to view its statistics."
          )
        )
      )
    )
  );
};

export default ProjectOverviewPanel;
>>>>>>> REPLACE
