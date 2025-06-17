
import React from 'react';

const LoadingSpinner = ({message = "Processing..."}) => {
  return (
    React.createElement("div", { style: { 
        margin: '20px auto', 
        padding: '20px', 
        textAlign: 'center', 
        background: 'var(--panel-alt-bg)', 
        borderRadius: 'var(--border-radius)',
        maxWidth: '300px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '15px'
    }},
      React.createElement("div", { 
        className: "yggdrasil-seed-spinner",
        role: "status",
        "aria-live": "polite",
        "aria-label": "Loading",
        style: { width: '60px', height: '60px' } 
      },
        React.createElement("svg", { viewBox: "0 0 100 100", xmlns: "http://www.w3.org/2000/svg" },
          React.createElement("defs", null,
            React.createElement("radialGradient", { id: "seedGradient", cx: "50%", cy: "50%", r: "50%", fx: "50%", fy: "50%" },
              React.createElement("stop", { offset: "0%", style: {stopColor: 'var(--primary-accent-light)', stopOpacity: 1}}),
              React.createElement("stop", { offset: "70%", style: {stopColor: 'var(--primary-accent)', stopOpacity: 0.8}}),
              React.createElement("stop", { offset: "100%", style: {stopColor: 'var(--primary-accent-dark)', stopOpacity: 0.6}})
            )
          ),
          React.createElement("ellipse", { className: "seed-pulse-outer", cx: "50", cy: "50", rx: "28", ry: "40", fill: "url(#seedGradient)", opacity: "0.3" }),
          React.createElement("ellipse", { className: "seed-pulse-inner", cx: "50", cy: "50", rx: "22", ry: "32", fill: "url(#seedGradient)", opacity: "0.5" }),
          React.createElement("ellipse", { cx: "50", cy: "50", rx: "20", ry: "30", fill: "url(#seedGradient)", stroke: "var(--primary-accent-dark)", strokeWidth: "1.5" }),
          React.createElement("path", { d: "M50 20 Q 55 35, 50 50 Q 45 35, 50 20 Z", fill: "rgba(255,255,255,0.2)" })
        )
      ),
      React.createElement("p", { style: { fontSize: '1.05em', fontWeight: '500', color: 'var(--text-primary)', margin: 0 }}, message)
    )
  );
}

export default LoadingSpinner;
