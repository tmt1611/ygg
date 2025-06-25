import React from 'react';

const FocusNodeDisplay = React.forwardRef(
  ({ node, nodeType, onClick, onContextMenu, isAppBusy, isRootNode, linkSourceInfo, style }, ref) => {
    
    const importanceLabel = node.importance ? node.importance.charAt(0).toUpperCase() + node.importance.slice(1) : 'Common';
    
    const titleLines = [`Object: ${node.name}`, `Importance: ${importanceLabel}`];
    const ariaLabelParts = [`Celestial Object: ${node.name}`, `Importance: ${importanceLabel}`];

    const truncatedDescription = node.description ? 
      (node.description.length > 100 ? `${node.description.substring(0, 100)}...` : node.description)
      : 'N/A';
    titleLines.push(`Details: ${truncatedDescription}`);

    if (node.isLocked) {
      titleLines.push('System Lock Active');
      ariaLabelParts.push('System Lock Active');
    }

    let displayLinkIcon = "";
    if (node.linkedProjectId) {
      displayLinkIcon = "🔗";
      const linkText = `Hyperspace Link (Outgoing): ${node.linkedProjectName || 'Unknown Project'}`;
      titleLines.push(linkText);
      ariaLabelParts.push(`Hyperspace link to ${node.linkedProjectName || 'Unknown Project'}`);
    } else if (isRootNode && linkSourceInfo) {
      displayLinkIcon = "↩️";
      const linkText = `Hyperspace Link (Incoming from): ${linkSourceInfo.sourceProjectName} / ${linkSourceInfo.sourceNodeName}`;
      titleLines.push(linkText);
      ariaLabelParts.push(`Hyperspace link from ${linkSourceInfo.sourceProjectName}`);
    }
    
    ariaLabelParts.push('Activate for detailed scan or navigation options.');
    
    const titleText = titleLines.join('\n');
    const ariaLabelText = ariaLabelParts.join(', ');
    
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