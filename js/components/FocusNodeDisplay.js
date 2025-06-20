
import React from 'react';

const FocusNodeDisplay = React.forwardRef(
  ({ node, nodeType, onClick, onContextMenu, isAppBusy, isRootNode, linkSourceInfo, style }, ref) => {
    
    const importanceLabel = node.importance ? node.importance.charAt(0).toUpperCase() + node.importance.slice(1) : 'Common';
    
    let titleText = `Object: ${node.name}\nImportance: ${importanceLabel}\nDetails: ${node.description?.substring(0,100) || 'N/A'}${node.description && node.description.length > 100 ? '...' : ''}${node.isLocked ? '\nSystem Lock Active' : ''}`;
    let ariaLabelText = `Celestial Object: ${node.name}, Importance: ${importanceLabel}${node.isLocked ? ', System Lock Active' : ''}. Activate for detailed scan or navigation options.`;

    let displayLinkIcon = "";
    if (node.linkedProjectId) {
      displayLinkIcon = "🔗";
      titleText += `\nHyperspace Link (Outgoing): ${node.linkedProjectName || 'Unknown Project'}`;
      ariaLabelText += `, Hyperspace link to ${node.linkedProjectName || 'Unknown Project'}`;
    } else if (isRootNode && linkSourceInfo) {
      displayLinkIcon = "↩️";
      titleText += `\nHyperspace Link (Incoming from): ${linkSourceInfo.sourceProjectName} / ${linkSourceInfo.sourceNodeName}`;
      ariaLabelText += `, Hyperspace link from ${linkSourceInfo.sourceProjectName}`;
    }
    
    const celestialBodyClasses = [
        "celestial-body",
        `importance-${node.importance || 'common'}`,
        node.isLocked ? "is-locked" : "",
        (node.linkedProjectId || (isRootNode && linkSourceInfo)) ? "has-link" : "", 
    ].filter(Boolean).join(" ");


    return (
      React.createElement("button", { 
        ref: ref,
        className: `focus-node-display focus-node-${nodeType}`,
        onClick: onClick,
        onContextMenu: onContextMenu,
        disabled: isAppBusy,
        "aria-label": ariaLabelText,
        "data-node-id": node.id,
        style: style || {} 
      },
        React.createElement("div", { className: celestialBodyClasses, title: titleText },
            React.createElement("div", { className: "celestial-body-name" },
                node.name
            ),
            displayLinkIcon && (
                React.createElement("span", { 
                    className: "celestial-body-link-indicator", 
                    "aria-hidden": "true"
                },
                    displayLinkIcon
                )
            )
        )
      )
    );
  }
);
FocusNodeDisplay.displayName = 'FocusNodeDisplay';

export default React.memo(FocusNodeDisplay);
