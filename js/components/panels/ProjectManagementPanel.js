import React from 'react';
import ContextualHelpTooltip from '../ContextualHelpTooltip.js';
import ProjectListItem from './ProjectListItem.js';

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
    React.createElement("div", null,
      React.createElement("div", { className: "panel-button-group", style: { marginBottom: '15px' }},
        React.createElement("button", { onClick: onCreateEmptyProject, disabled: isAppBusy, className: "primary panel-button", title: "Create a new project with a single root node." },
          React.createElement("span", { className: "button-icon", "aria-hidden": "true" }, "➕"), "Create New Project"
        ),
        React.createElement("button", { onClick: handleImportButtonClick, disabled: isAppBusy, className: "primary panel-button", title: "Import a project from a .json or .project.json file." },
            React.createElement("span", { className: "button-icon", "aria-hidden": "true" }, "📄"), "Import from JSON"
        ),
        React.createElement("input", { type: "file", id: "import-project-input", accept: ".json,.project.json", onChange: onAddNewProjectFromFile, style: { display: 'none' }, disabled: isAppBusy }),
        React.createElement("button", { onClick: onSaveAsExample, disabled: !currentTreeExists || isAppBusy, className: "secondary panel-button", title: "Save the currently active tree structure as a new example project template." },
          React.createElement("span", { className: "button-icon", "aria-hidden": "true" }, "⭐"), "Save Active as Example"
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