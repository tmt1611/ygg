
import React from 'react';
// import { TechTreeNode, NodeStatus } from '../types.js'; // Types removed
// import { LinkSourceInfo } from '../hooks/useProjectLinking.js'; // Types removed

const FocusNodeDisplay = React.forwardRef(
  ({ node, nodeType, onClick, onContextMenu, isAppBusy, isRootNode, linkSourceInfo, style }, ref) => {
    
    const statusLabel = node.status ? node.status.charAt(0).toUpperCase() + node.status.slice(1) : 'Medium';
    
    let titleText = `Object: ${node.name}\nDesignation: ${statusLabel}\nDetails: ${node.description?.substring(0,100) || 'N/A'}${node.description && node.description.length > 100 ? '...' : ''}${node.isLocked ? '\nSystem Lock Active' : ''}`;
    let ariaLabelText = `Celestial Object: ${node.name}, Designation: ${statusLabel}${node.isLocked ? ', System Lock Active' : ''}. Activate for detailed scan or navigation options.`;

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
        `status-${node.status || 'medium'}`,
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
                    style: {
                        position: 'absolute', 
                        top: '4px', 
                        right: '4px', 
                        fontSize: '1em', 
                        color: 'var(--focus-node-beacon-color)', 
                        filter: 'drop-shadow(0 0 3px var(--focus-node-beacon-color))'
                    },
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
