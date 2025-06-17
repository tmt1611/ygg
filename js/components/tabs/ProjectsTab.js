
import React from 'react';
// Project type import removed as it's a type

const ProjectsTabContent = ({
  projects,
  activeProjectId,
  onLoadProject,
  onRenameProject,
  onDeleteProject,
  onAddNewProjectFromFile,
  onCreateEmptyProject,
  isAppBusy,
}) => {
  return (
    React.createElement("div", { className: "panel" },
      React.createElement("h3", { className: "panel-header" }, "Project Management"),
      React.createElement("div", { className: "panel-button-group", style: { marginBottom: '20px' } },
        React.createElement("button", { onClick: onCreateEmptyProject, disabled: isAppBusy, className: "primary panel-button" },
          React.createElement("span", { className: "button-icon", "aria-hidden": "true" }, "➕"),
          "Create New Empty Project"
        ),
        React.createElement("div", null,
            React.createElement("label", { htmlFor: "import-project-input", className: `secondary panel-button ${isAppBusy ? 'disabled' : ''}`,
              style: { display: 'flex', textAlign: 'center', cursor: isAppBusy ? 'not-allowed' : 'pointer'},
              "aria-disabled": isAppBusy, tabIndex: isAppBusy ? -1 : 0,
              onKeyDown: (e) => { if (e.key === 'Enter' || e.key === ' ') document.getElementById('import-project-input')?.click(); } },
              React.createElement("span", { className: "button-icon", "aria-hidden": "true" }, "📄"),
              "Import Project from JSON"
            ),
            React.createElement("input", { type: "file", id: "import-project-input", accept: ".json,.project.json", onChange: onAddNewProjectFromFile,
              style: { display: 'none' }, disabled: isAppBusy })
        )
      ),
      projects.length === 0 ? (
        React.createElement("p", { style: { textAlign: 'center', color: 'var(--text-secondary)', marginTop: '15px' } },
          "No projects found. Create one or import a .json file."
        )
      ) : (
        React.createElement(React.Fragment, null,
          React.createElement("h4", { className: "panel-sub-header", style: {marginTop: '0'}}, "Your Projects:"),
          React.createElement("ul", { className: "project-list" },
            projects.map((project) => (
              React.createElement("li", { key: project.id, className: `project-list-item ${project.id === activeProjectId ? 'active' : ''}`},
                React.createElement("div", { className: "project-info", onClick: () => project.id !== activeProjectId && onLoadProject(project.id), style: {cursor: project.id !== activeProjectId ? 'pointer' : 'default'}},
                  React.createElement("span", { className: "project-name" }, project.name),
                  React.createElement("span", { className: "project-last-modified" },
                    "Last Modified: ", new Date(project.lastModified).toLocaleDateString(), " ", new Date(project.lastModified).toLocaleTimeString()
                  )
                ),
                React.createElement("div", { className: "project-actions" },
                  React.createElement("button", { onClick: () => onLoadProject(project.id), disabled: isAppBusy || project.id === activeProjectId, title: "Load Project" }, "🔄"),
                  React.createElement("button", { onClick: () => onRenameProject(project.id, project.name), disabled: isAppBusy, title: "Rename Project" }, "✏️"),
                  React.createElement("button", { onClick: () => onDeleteProject(project.id), disabled: isAppBusy, className: "delete-action", title: "Delete Project" }, "🗑️")
                )
              )
            ))
          )
        )
      )
    )
  );
};

export default ProjectsTabContent;
