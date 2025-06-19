import React from 'react';

const ProjectListItem = ({ project, activeProjectId, onLoadProject, onLoadAndGoToGraph, onRenameProject, onDeleteProject, isAppBusy }) => {
  const isActive = project.id === activeProjectId && !project.isExample;
  const itemClass = `project-list-item ${project.isExample ? 'example-project' : ''} ${isActive ? 'active' : ''}`;
  const icon = project.isExample ? '⭐' : '📁';

  return (
    React.createElement("li", { key: project.id, className: itemClass },
      React.createElement("div", {
        className: "project-info",
        onClick: () => !project.isExample && project.id !== activeProjectId && onLoadProject(project.id),
        style: { cursor: !project.isExample && !isActive ? 'pointer' : 'default' },
        title: !project.isExample ? (isActive ? `Project: ${project.name} (Active)` : `Load project: ${project.name}`) : `Example template: ${project.name}`
      },
        React.createElement("span", { className: "project-name" },
          React.createElement("span", { style: { marginRight: '8px', opacity: 0.7 }, "aria-hidden": "true" }, icon),
          project.name
        ),
        React.createElement("span", { className: "project-last-modified" },
          project.isExample ? "Example Template" : `Last Modified: ${new Date(project.lastModified).toLocaleString()}`
        )
      ),
      React.createElement("div", { className: "project-actions" },
        project.isExample ? (
          React.createElement("button", {
            onClick: () => onLoadAndGoToGraph(project.id),
            disabled: isAppBusy,
            title: `Start a new project using "${project.name}" as a template and view graph.`,
            className: "secondary panel-button",
            style: { padding: '5px 10px', fontSize: '0.9em', width: 'auto' }
          }, "🚀 Use Example")
        ) : (
          React.createElement(React.Fragment, null,
            React.createElement("button", { className: "base-icon-button", onClick: () => onLoadAndGoToGraph(project.id), disabled: isAppBusy || isActive, title: `Load "${project.name}" and view graph` }, "🚀"),
            React.createElement("button", { className: "base-icon-button", onClick: () => onRenameProject(project.id, project.name), disabled: isAppBusy, title: `Rename project: ${project.name}` }, "✏️")
          )
        ),
        React.createElement("button", { className: "base-icon-button delete-action", onClick: () => onDeleteProject(project.id), disabled: isAppBusy, title: `Delete: ${project.name}` }, "🗑️")
      )
    )
  );
};

export default ProjectListItem;