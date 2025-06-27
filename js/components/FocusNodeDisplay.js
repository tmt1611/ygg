import React, { useMemo } from 'react';

/**
 * A specialized component to display a node in the Focus View.
 * It renders as a "celestial body" (e.g., planet, star) whose size and appearance
 * are determined by the node's importance.
 *
 * This component is memoized and uses useMemo for derived data to optimize performance,
 * as it can be re-rendered frequently during layout changes or interactions.
 */
const FocusNodeDisplay = React.memo(React.forwardRef(
  ({ node, nodeType, onClick, onContextMenu, isAppBusy, isRootNode, linkSourceInfo, style }, ref) => {
    
    // Memoize all derived data from props to avoid recalculating on every render.
    // This is beneficial because this component might re-render due to parent state changes
    // even if its own props remain the same.
    const { titleText, ariaLabelText, celestialBodyClasses, displayLinkIcon } = useMemo(() => {
      if (!node) {
        return { titleText: '', ariaLabelText: '', celestialBodyClasses: 'celestial-body', displayLinkIcon: '' };
      }
      
      const importanceLabel = node.importance ? node.importance.charAt(0).toUpperCase() + node.importance.slice(1) : 'Common';
      
      const titleLines = [`Object: ${node.name}`, `Importance: ${importanceLabel}`];
      const ariaLabelParts = [`Celestial Object: ${node.name}`, `Importance: ${importanceLabel}`];

      const truncatedDescription = node.description 
        ? (node.description.length > 100 ? `${node.description.substring(0, 100)}...` : node.description)
        : 'N/A';
      titleLines.push(`Details: ${truncatedDescription}`);

      if (node.isLocked) {
        titleLines.push('System Lock Active');
        ariaLabelParts.push('System Lock Active');
      }

      let linkIcon = "";
      if (node.linkedProjectId) {
        linkIcon = "🔗";
        const linkText = `Hyperspace Link (Outgoing): ${node.linkedProjectName || 'Unknown Project'}`;
        titleLines.push(linkText);
        ariaLabelParts.push(`Hyperspace link to ${node.linkedProjectName || 'Unknown Project'}`);
      } else if (isRootNode && linkSourceInfo) {
        linkIcon = "↩️";
        const linkText = `Hyperspace Link (Incoming from): ${linkSourceInfo.sourceProjectName} / ${linkSourceInfo.sourceNodeName}`;
        titleLines.push(linkText);
        ariaLabelParts.push(`Hyperspace link from ${linkSourceInfo.sourceProjectName}`);
      }
      
      ariaLabelParts.push('Activate for detailed scan or navigation options.');
      
      // Dynamically build the CSS classes for the celestial body div.
      const classes = [
          "celestial-body",
          `importance-${node.importance || 'common'}`,
          node.isLocked ? "is-locked" : "",
          (node.linkedProjectId || (isRootNode && linkSourceInfo)) ? "has-link" : "", 
      ].filter(Boolean).join(" ");

      return {
          titleText: titleLines.join('\n'),
          ariaLabelText: ariaLabelParts.join(', '),
          celestialBodyClasses: classes,
          displayLinkIcon: linkIcon
      };
    }, [node, isRootNode, linkSourceInfo]);

    if (!node) return null; // Render nothing if no node is provided.

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
));

FocusNodeDisplay.displayName = 'FocusNodeDisplay';

export default FocusNodeDisplay;