
import React, { useEffect, useRef, useState } from 'react';

const TechExtractionModal = ({
  isOpen,
  content,
  title,
  onClose,
}) => {
  const textareaRef = useRef(null);
  const closeButtonRef = useRef(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCopied(false); 
      setTimeout(() => closeButtonRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      } else if (event.key === 'Enter') {
        // Let buttons handle their own Enter clicks.
        if (document.activeElement?.tagName !== 'BUTTON') {
          event.preventDefault();
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleCopyToClipboard = async () => {
    if (textareaRef.current) {
      try {
        await navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); 
      } catch (err) {
        console.error('Failed to copy text: ', err);
      }
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    React.createElement("div", {
      className: "modal-overlay-basic",
      role: "dialog",
      "aria-modal": "true",
      "aria-labelledby": "extraction-modal-title",
      onClick: (e) => { if (e.target === e.currentTarget) onClose(); }
    },
      React.createElement("div", { className: "modal-content-basic", style: { width: 'clamp(500px, 90vw, 800px)', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }},
        React.createElement("h2", { id: "extraction-modal-title", className: "modal-title" },
          React.createElement("span", { className: "modal-icon" }, "📤"),
          title 
        ),
        title.toLowerCase().includes("prompt") && React.createElement("p", { style: { fontSize: '0.85em', color: 'var(--text-secondary)', margin: '-10px 0 10px 0', padding: '8px', background: 'var(--panel-alt-bg)', borderRadius: 'var(--border-radius)'}},
          "This is the prompt structure sent to the AI. Placeholders like `[...]` are replaced with the full data from the application before sending."
        ),
        React.createElement("textarea", {
          ref: textareaRef,
          value: content,
          readOnly: true,
          style: {
            width: '100%',
            flexGrow: 1,
            minHeight: '300px',
            fontFamily: 'monospace',
            fontSize: '0.9em',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--border-radius)',
            padding: '10px',
            backgroundColor: 'var(--panel-alt-bg)',
            color: 'var(--text-primary)',
            whiteSpace: 'pre-wrap', 
            resize: 'none',
          },
          "aria-label": "Extracted tech tree information or AI summary"
        }),
        React.createElement("div", { style: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', flexShrink: 0, paddingTop: '15px', borderTop: '1px solid var(--border-color)' }},
          React.createElement("button", {
            type: "button",
            onClick: handleCopyToClipboard,
            className: "secondary"
          },
            copied ? 'Copied!' : 'Copy to Clipboard'
          ),
          React.createElement("button", {
            ref: closeButtonRef,
            type: "button",
            onClick: onClose,
            className: "primary"
          },
            "Close"
          )
        )
      )
    )
  );
};

export default TechExtractionModal;
