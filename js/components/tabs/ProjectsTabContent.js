
import React from 'react';
import ContextualHelpTooltip from '../ContextualHelpTooltip.js'; 

const ProjectsTabContent = ({
  projects, activeProjectId, onLoadProject, onRenameProject, onDeleteProject, 
  onAddNewProjectFromFile, onCreateEmptyProject, onSaveAsExample, onLoadAndGoToGraph,
  initialPrompt, setInitialPrompt, handleGenerateTree, isLoadingInitial, handleDownloadTree,
  apiKeyHook, onExtractData, extractionMode, setExtractionMode, isSummarizing,
  isAppBusy,
}) => {

  const {
    selectedMode: apiKeySelectedMode, 
    changeMode: handleApiKeyModeChange, 
    inputKey: apiKeyInput, 
    setInputKey: setApiKeyInput,
    submitPastedKey: handleSetPastedApiKey, 
    status: apiKeyStatus, 
    isProcessing: isApiKeyProcessing,
    clearActiveUserKey
  } = apiKeyHook;

  const controlsDisabled = isAppBusy; 
  const generateUIDisabled = controlsDisabled || !apiKeyStatus.isSet;
  const activeUserProjectExists = !!(activeProjectId && projects.find(p => p.id === activeProjectId && !p.isExample)); 
  const currentTreeExists = !!(initialPrompt || projects.find(p => p.id === activeProjectId) || projects.some(p => !activeProjectId && p.isExample)); 

  const extractButtonDisabled = controlsDisabled || !currentTreeExists || (extractionMode === 'summary' && !apiKeyStatus.isSet);

  const userProjects = projects.filter(p => !p.isExample);
  const exampleProjects = projects.filter(p => p.isExample);

  const handleImportButtonClick = () => {
    if (!isAppBusy) {
      (document.getElementById('import-project-input')).click();
    }
  };

  return (
    React.createElement("div", { style: { display: 'flex', flexDirection: 'column', gap: '25px' }}, 
      React.createElement("fieldset", null,
        React.createElement("legend", null, "Project Management", React.createElement(ContextualHelpTooltip, { helpText: "Load existing projects, create new ones, or import from a file. You can also save the current active tree as a reusable example template." })),
        React.createElement("div", { className: "panel-button-group", style: { marginBottom: '15px' }},
          React.createElement("button", { onClick: onCreateEmptyProject, disabled: isAppBusy, className: "primary panel-button", title: "Create a new project with a single root node." },
            React.createElement("span", { className: "button-icon", "aria-hidden": "true" }, "➕"),
            "Create New Empty Project"
          ),
          React.createElement("button", { onClick: onSaveAsExample, disabled: !currentTreeExists || isAppBusy, className: "primary panel-button", title: "Save the currently active tree structure as a new example project template." },
            React.createElement("span", { className: "button-icon", "aria-hidden": "true" }, "⭐"),
            "Save Active as New Example"
          ),
          React.createElement("div", null,
            React.createElement("button", { 
              onClick: handleImportButtonClick, 
              disabled: isAppBusy, 
              className: "primary panel-button", 
              title: "Import a project from a .json or .project.json file."
            },
              React.createElement("span", { className: "button-icon", "aria-hidden": "true" }, "📄"),
              "Import Project from JSON"
            ),
            React.createElement("input", { 
              type: "file", 
              id: "import-project-input", 
              accept: ".json,.project.json", 
              onChange: onAddNewProjectFromFile,
              style: { display: 'none' }, 
              disabled: isAppBusy 
            })
          )
        ),

        userProjects.length === 0 && exampleProjects.length === 0 ? (
          React.createElement("p", { style: { textAlign: 'center', color: 'var(--text-secondary)', marginTop: '10px' }},
            "No projects found. Create one, import a .json file, or start from an example."
          )
        ) : (
          React.createElement(React.Fragment, null,
            userProjects.length > 0 && (
              React.createElement(React.Fragment, null,
                React.createElement("h4", { className: "panel-sub-header", style: {marginTop: '0'}}, "Your Projects:"),
                React.createElement("ul", { className: "project-list" },
                  userProjects.map((project) => (
                    React.createElement("li", { key: project.id, className: `project-list-item ${project.id === activeProjectId && !project.isExample ? 'active' : ''}`},
                      React.createElement("div", { className: "project-info", onClick: () => project.id !== activeProjectId && onLoadProject(project.id), style: {cursor: project.id !== activeProjectId ? 'pointer' : 'default'}, title: project.id !== activeProjectId ? `Load project: ${project.name}` : `Project: ${project.name} (Active)`},
                        React.createElement("span", { className: "project-name" }, project.name),
                        React.createElement("span", { className: "project-last-modified" },
                          "Last Modified: ", new Date(project.lastModified).toLocaleDateString(), " ", new Date(project.lastModified).toLocaleTimeString()
                        )
                      ),
                      React.createElement("div", { className: "project-actions" },
                        React.createElement("button", { className: "base-icon-button", onClick: () => onLoadProject(project.id), disabled: isAppBusy || (project.id === activeProjectId && !project.isExample), title: `Load project: ${project.name}`}, "🔄"),
                        React.createElement("button", { className: "base-icon-button", onClick: () => onLoadAndGoToGraph(project.id), disabled: isAppBusy, title: `Load "${project.name}" and view graph`}, "🚀"),
                        React.createElement("button", { className: "base-icon-button", onClick: () => onRenameProject(project.id, project.name), disabled: isAppBusy, title: `Rename project: ${project.name}`}, "✏️"),
                        React.createElement("button", { className: "base-icon-button delete-action", onClick: () => onDeleteProject(project.id), disabled: isAppBusy, title: `Delete project: ${project.name}`}, "🗑️")
                      )
                    )
                  ))
                )
              )
            ),
             exampleProjects.length > 0 && (
              React.createElement(React.Fragment, null,
                React.createElement("h4", { className: "panel-sub-header", style: {marginTop: userProjects.length > 0 ? '20px' : '0'}}, "Example Projects:"),
                React.createElement("ul", { className: "project-list" },
                  exampleProjects.map((project) => (
                    React.createElement("li", { key: project.id, className: `project-list-item example-project ${project.id === activeProjectId && project.isExample ? 'active' : ''}`},
                      React.createElement("div", { className: "project-info" },
                        React.createElement("span", { className: "project-name" }, project.name),
                         React.createElement("span", { className: "project-last-modified" }, "Example Template")
                      ),
                      React.createElement("div", { className: "project-actions" },
                        React.createElement("button", { 
                            onClick: () => onLoadAndGoToGraph(project.id), 
                            disabled: isAppBusy, 
                            title: `Start a new project using "${project.name}" as a template and view graph. You will be prompted to save it as your own.`, 
                            className: "secondary panel-button", 
                            style: {padding: '5px 10px', fontSize: '0.9em', width: 'auto'}
                        },
                            "🚀 Use Example"
                        ),
                        React.createElement("button", { className: "base-icon-button delete-action", onClick: () => onDeleteProject(project.id), disabled: isAppBusy, title: `Delete example project: ${project.name}`}, "🗑️")
                      )
                    )
                  ))
                )
              )
            )
          )
        )
      ),

      React.createElement("fieldset", null,
        React.createElement("legend", null, "Gemini API Key Setup ", React.createElement(ContextualHelpTooltip, { helpText: "Your Google Gemini API Key is required for all AI features. It's stored in memory for the current session only and not saved persistently in the browser. Get your key from Google AI Studio." })),
        React.createElement("div", { style: { display: 'flex', flexDirection: 'column', gap: '8px' }},
            (["environment", "pasted"]).map(mode => ( 
            React.createElement("label", { key: mode, style: { display: 'flex', alignItems: 'center', cursor: (isApiKeyProcessing || controlsDisabled) ? 'not-allowed' : 'pointer', padding: '5px 0' }},
                React.createElement("input", { type: "radio", name: "apiKeyMode", value: mode, checked: apiKeySelectedMode === mode,
                onChange: () => handleApiKeyModeChange(mode), style: { marginRight: '10px', transform: 'scale(1.1)' },
                disabled: isApiKeyProcessing || controlsDisabled }),
                React.createElement("span", { style: { fontSize: '0.95em' }},
                mode === 'environment' ? 'Use Environment API_KEY (if set)' : 'Enter API Key Manually'
                ),
                mode === 'environment' && React.createElement(ContextualHelpTooltip, { helpText: "Uses the API_KEY environment variable if available in your deployment." }),
                mode === 'pasted' && React.createElement(ContextualHelpTooltip, { helpText: "Manually paste your API Key here. It will be used for this session." })
            )
            ))
        ),

        apiKeySelectedMode === 'pasted' && ( 
        React.createElement("div", { style: { marginTop: '10px' }},
            React.createElement("p", { style: { fontSize: '0.85em', color: 'var(--text-tertiary)', marginBottom: '5px' }},
            "Key stored in memory for this session. Get key from ", React.createElement("a", { href: "https://aistudio.google.com/app/apikey", target: "_blank", rel: "noopener noreferrer", title: "Opens Google AI Studio in a new tab" }, "Google AI Studio"), "."
            ),
            React.createElement("div", { style: { display: 'flex', flexDirection: 'column', gap: '8px' }},
            React.createElement("input", { type: "password", id: "apiKeyInput", value: apiKeyInput, onChange: (e) => setApiKeyInput(e.target.value),
                placeholder: "Paste your Gemini API Key", style: { flexGrow: 1, minWidth: 0 },
                "aria-label": "Gemini API Key (manual input)", disabled: isApiKeyProcessing || controlsDisabled }),
            React.createElement("button", { 
                onClick: () => handleSetPastedApiKey(apiKeyInput), 
                disabled: isApiKeyProcessing || controlsDisabled || !apiKeyInput.trim(), 
                className: "secondary",
                title: "Submit and use the entered API Key for the current session"},
                isApiKeyProcessing ? 'Setting...' : 'Set API Key'
            )
            )
        )
        ),

        apiKeyStatus.isSet && (apiKeySelectedMode === 'pasted' || (apiKeySelectedMode === 'environment' && process.env.API_KEY)) && ( 
            React.createElement("button", { onClick: clearActiveUserKey, disabled: isApiKeyProcessing || controlsDisabled, className: "secondary", style: {width: '100%', marginTop: '10px'}, title: "Clear the currently active API key and attempt to use environment key if available."},
            isApiKeyProcessing ? 'Clearing...' : 'Clear Current Key & Reset'
            )
        ),
        apiKeyStatus.message && ( React.createElement("p", { className: `api-key-status-message ${apiKeyStatus.type || 'info'}`}, apiKeyStatus.message) ),
         !apiKeyStatus.isSet && !isApiKeyProcessing && ( 
            React.createElement("div", { className: "api-key-warning-block", style: {marginTop: '15px'}}, React.createElement("p", null, "AI Features Disabled"), React.createElement("p", null, "Configure a valid Gemini API Key above."))
        )
      ),

      React.createElement("fieldset", null,
        React.createElement("legend", null, "AI Structure Generation / Context ", React.createElement(ContextualHelpTooltip, { helpText: "Describe the main topic or overall context for your tech tree. The AI will use this to generate an initial structure or regenerate the structure for the active project. If no project is active, a new one will be created using this context as its name." })),
        React.createElement("label", { htmlFor: "techTreeContextPrompt", style: {marginBottom: '5px'}}, "Project Context / AI Topic:"),
        React.createElement("textarea", { id: "techTreeContextPrompt", style: { width: '100%', minHeight: '100px', resize: 'vertical', marginBottom: '10px' },
            placeholder: "e.g., 'Machine Learning Fundamentals', 'Game Development Pipeline', 'Sustainable Energy Sources'",
            value: initialPrompt, onChange: (e) => setInitialPrompt(e.target.value),
            disabled: generateUIDisabled, "aria-describedby": generateUIDisabled && !apiKeyStatus.isSet ? "prompt-disabled-reason-gen" : undefined, 
            title: "Describe the main topic or context for the tech tree. This will guide AI generation."}),
        React.createElement("button", { onClick: handleGenerateTree, disabled: generateUIDisabled || !initialPrompt.trim(),
            style: { width: '100%', padding: '10px' }, className: "primary", "aria-busy": isLoadingInitial,
            title: generateUIDisabled ? (apiKeyStatus.isSet ? "Enter a prompt first" : "API Key required") : (activeUserProjectExists ? "Regenerate structure for current project based on this context" : "Generate a new project and structure based on this context")},
            isLoadingInitial ? ( 
            React.createElement("span", {style: {display: 'flex', alignItems: 'center', justifyContent: 'center'}},
                React.createElement("span", {className: "basic-spinner-animation", style: {display: 'inline-block', width: '1.2em', height: '1.2em', border: '3px solid rgba(255,255,255,0.3)', borderLeftColor: '#fff', borderRadius: '50%', marginRight: '8px'}}),
                "Generating..."
            )
            ) : (activeUserProjectExists ? 'Regenerate Structure for Context' : 'Generate New Structure')
        ),
        React.createElement("p", {style: {fontSize: '0.85em', color: 'var(--text-tertiary)', marginTop: '8px'}},
            "This will generate or regenerate the tree for the current project context (topic). If no project is active (e.g., after starting from an example), a new one will be created using this context as its name."
        ),
        generateUIDisabled && !apiKeyStatus.isSet && React.createElement("p", { id: "prompt-disabled-reason-gen", style: { fontSize: '0.9em', textAlign: 'center', marginTop: '10px', color: 'var(--error-color)' }}, "AI features disabled. Set API Key.")
      ),
      
      React.createElement("fieldset", null,
        React.createElement("legend", null, "Data Operations for Active Project ", React.createElement(ContextualHelpTooltip, { helpText: "These operations apply to the currently active project. 'Save & Download' saves the project and downloads its .project.json file. 'Extract Data' can output the tree as raw text or generate an AI summary (requires API key)." })),
        React.createElement("div", {style: {display: 'flex', flexDirection: 'column', gap: '15px'}},
            React.createElement("button", { onClick: handleDownloadTree, disabled: !currentTreeExists || controlsDisabled, className: "secondary", title: !currentTreeExists ? "No active project or tree data to save/download" : "Save the current state of the active project (or save new if based on example) and download it as a .project.json file"},
              "Save Active Project & Download"
            ),
            React.createElement("hr", {style: {margin: '5px 0'}}),
            React.createElement("div", null, 
                React.createElement("h4", { style: { fontSize: '1.05em', marginBottom: '10px', color: 'var(--text-primary)'}}, "Data Extraction Mode:"),
                React.createElement("div", {style: {border: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px'}}, 
                    React.createElement("label", { style: { display: 'flex', alignItems: 'center', cursor: (controlsDisabled || !currentTreeExists) ? 'not-allowed' : 'pointer' }},
                        React.createElement("input", { type: "radio", name: "extractionMode", value: "raw", checked: extractionMode === 'raw', onChange: () => setExtractionMode('raw'), style: {marginRight: '8px'}, disabled: controlsDisabled || !currentTreeExists}),
                        "Raw Text (Nodes & Context)",
                        React.createElement(ContextualHelpTooltip, { helpText: "Outputs node names, descriptions, and the current project context as plain text." })
                    ),
                    React.createElement("label", { style: { display: 'flex', alignItems: 'center', cursor: !apiKeyStatus.isSet || controlsDisabled || !currentTreeExists ? 'not-allowed' : 'pointer' }},
                        React.createElement("input", { type: "radio", name: "extractionMode", value: "summary", checked: extractionMode === 'summary',
                                onChange: () => setExtractionMode('summary'), style: {marginRight: '8px'},
                                disabled: !apiKeyStatus.isSet || controlsDisabled || !currentTreeExists}),
                        "AI Summary of Structure",
                        React.createElement(ContextualHelpTooltip, { helpText: "Uses AI to generate a concise summary of the current project's structure. Requires a valid API Key." }),
                        !apiKeyStatus.isSet && currentTreeExists && React.createElement("span", {style: {fontSize: '0.8em', color: 'var(--error-color)', marginLeft: '8px'}}, "(API Key Required)")
                    )
                ),
                React.createElement("button", { onClick: onExtractData,
                    disabled: extractButtonDisabled,
                    className: "secondary", style: {width: '100%', marginTop: '12px'},
                    title: extractButtonDisabled ? (apiKeyStatus.isSet && currentTreeExists ? "AI is busy or no active project" : currentTreeExists ? "API Key required for summary" : "No active project") : "Extract data from the active project based on selected mode"},
                    isSummarizing ? (
                        React.createElement("span", {style: {display: 'flex', alignItems: 'center', justifyContent: 'center'}},
                            React.createElement("span", {className: "basic-spinner-animation", style: {display: 'inline-block', width: '1em', height: '1em', border: '2px solid var(--primary-accent-light)', borderLeftColor: 'var(--primary-accent)', borderRadius: '50%', marginRight: '8px'}}),
                            "Summarizing..."
                        )
                    ) : 'Extract Data'
                )
            )
        )
      )
    )
  );
};

export default ProjectsTabContent;
