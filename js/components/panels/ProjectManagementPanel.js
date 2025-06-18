import React from 'react';
import ContextualHelpTooltip from '../ContextualHelpTooltip.js';

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

const ProjectManagementPanel = ({
  projects, activeProjectId, onLoadProject, onRenameProject, onDeleteProject,
  onAddNewProjectFromFile, onCreateEmptyProject, onSaveAsExample, onLoadAndGoToGraph,
  isAppBusy, currentTreeExists
}) => {

  const userProjects = projects.filter(p => !p.isExample);
  const exampleProjects = projects.filter(p => p.isExample);

  const handleImportButtonClick = () => {
    if (!isAppBusy) {
      document.getElementById('import-project-input')?.click();
    }
  };

  return (
    React.createElement("fieldset", null,
      React.createElement("legend", null, "Project Management", React.createElement(ContextualHelpTooltip, { helpText: "Load existing projects, create new ones, or import from a file. You can also save the current active tree as a reusable example template." })),
      React.createElement("div", { className: "panel-button-group", style: { marginBottom: '15px' }},
        React.createElement("button", { onClick: onCreateEmptyProject, disabled: isAppBusy, className: "primary panel-button", title: "Create a new project with a single root node." },
          React.createElement("span", { className: "button-icon", "aria-hidden": "true" }, "➕"), "Create New Empty Project"
        ),
        React.createElement("button", { onClick: onSaveAsExample, disabled: !currentTreeExists || isAppBusy, className: "primary panel-button", title: "Save the currently active tree structure as a new example project template." },
          React.createElement("span", { className: "button-icon", "aria-hidden": "true" }, "⭐"), "Save Active as New Example"
        ),
        React.createElement("div", null,
          React.createElement("button", { onClick: handleImportButtonClick, disabled: isAppBusy, className: "primary panel-button", title: "Import a project from a .json or .project.json file." },
            React.createElement("span", { className: "button-icon", "aria-hidden": "true" }, "📄"), "Import Project from JSON"
          ),
          React.createElement("input", { type: "file", id: "import-project-input", accept: ".json,.project.json", onChange: onAddNewProjectFromFile, style: { display: 'none' }, disabled: isAppBusy })
        )
      ),

      (userProjects.length === 0 && exampleProjects.length === 0) ? (
        React.createElement("p", { style: { textAlign: 'center', color: 'var(--text-secondary)', marginTop: '10px' }}, "No projects found. Create one, import a .json file, or start from an example.")
      ) : (
        React.createElement(React.Fragment, null,
          userProjects.length > 0 && (
            React.createElement(React.Fragment, null,
              React.createElement("h4", { className: "panel-sub-header", style: { marginTop: '0' }}, "Your Projects:"),
              React.createElement("ul", { className: "project-list" },
                userProjects.map((project) => React.createElement(ProjectListItem, { key: project.id, project, activeProjectId, onLoadProject, onLoadAndGoToGraph, onRenameProject, onDeleteProject, isAppBusy }))
              )
            )
          ),
          exampleProjects.length > 0 && (
            React.createElement(React.Fragment, null,
              React.createElement("h4", { className: "panel-sub-header", style: { marginTop: userProjects.length > 0 ? '20px' : '0' }}, "Example Projects:"),
              React.createElement("ul", { className: "project-list" },
                exampleProjects.map((project) => React.createElement(ProjectListItem, { key: project.id, project, activeProjectId, onLoadProject, onLoadAndGoToGraph, onRenameProject, onDeleteProject, isAppBusy }))
              )
            )
          )
        )
      )
    )
  );
};

export default ProjectManagementPanel;