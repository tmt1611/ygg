import React from 'react';

const WelcomeScreen = ({
  initialPrompt,
  setInitialPrompt,
  handleGenerateTree,
  isLoadingInitial,
  apiKeyIsSet,
  onAddNewProjectFromFile,
  onLoadAndGoToGraph,
  exampleProjects,
  isAppBusy
}) => {
  
  const handleImportClick = () => {
    document.getElementById('import-project-input-welcome')?.click();
  };

  return (
    React.createElement("div", { className: "welcome-screen-container" },
      React.createElement("div", { className: "welcome-screen-content" },
        React.createElement("h1", { className: "welcome-screen-title" }, "Welcome to Yggdrasil"),
        React.createElement("p", { className: "welcome-screen-subtitle" }, "The World Tree of Knowledge. Plant a seed of an idea and watch it grow."),
        
        React.createElement("div", { className: "welcome-screen-main-action" },
          React.createElement("textarea", { 
            id: "welcome-prompt-input",
            placeholder: "Enter a topic to generate your first project, e.g., 'The History of Ancient Rome'",
            value: initialPrompt,
            onChange: (e) => setInitialPrompt(e.target.value),
            disabled: !apiKeyIsSet || isLoadingInitial || isAppBusy,
            rows: 3
          }),
          React.createElement("button", {
            onClick: handleGenerateTree,
            disabled: !apiKeyIsSet || isLoadingInitial || isAppBusy || !initialPrompt.trim(),
            className: "primary welcome-generate-button"
          }, 
            isLoadingInitial ? "Generating..." : "🌳 Generate Project"
          ),
          !apiKeyIsSet && React.createElement("p", { className: "welcome-api-key-warning" }, "An API Key is required for AI generation. Please set one in the Workspace view (you can start from an example or import a project to access it).")
        ),

        React.createElement("div", { className: "welcome-screen-secondary-actions" },
          React.createElement("button", { onClick: handleImportClick, className: "secondary" }, "Import a Project..."),
          React.createElement("input", { type: "file", id: "import-project-input-welcome", accept: ".json,.project.json", onChange: onAddNewProjectFromFile, style: { display: 'none' } }),
          React.createElement("span", null, "or start from an example:")
        ),

        React.createElement("div", { className: "welcome-example-projects" },
          exampleProjects.map(project => (
            React.createElement("button", { 
              key: project.id,
              className: "example-project-card",
              onClick: () => onLoadAndGoToGraph(project.id),
              disabled: isAppBusy
            },
              React.createElement("span", { className: "example-project-icon" }, "⭐"),
              React.createElement("span", { className: "example-project-name" }, project.name)
            )
          ))
        )
      )
    )
  );
};

export default WelcomeScreen;