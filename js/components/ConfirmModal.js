import React, { useEffect, useRef } from 'react';

const ConfirmModal = ({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  confirmButtonStyle,
}) => {
  const confirmButtonRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    if (confirmButtonRef.current) {
      confirmButtonRef.current.focus();
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel?.();
      } else if (event.key === 'Enter') {
        // Let button's default 'Enter' behavior work if it has focus
        if (document.activeElement?.tagName !== 'BUTTON') {
          event.preventDefault();
          onConfirm();
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onConfirm, onCancel]);


  if (!isOpen) {
    return null;
  }

  const isDanger = confirmButtonStyle === 'danger';
  const icon = isDanger ? '⚠️' : '💬';
  const modalClass = `modal-content-basic ${isDanger ? 'confirm-danger' : ''}`;

  return (
    React.createElement("div", {
      className: "modal-overlay-basic",
      role: "dialog",
      "aria-modal": "true",
      "aria-labelledby": "confirm-modal-title",
      "aria-describedby": "confirm-modal-message"
    },
      React.createElement("div", { className: modalClass },
        React.createElement("h2", { id: "confirm-modal-title", className: "modal-title", style: { marginBottom: '12px' }},
          React.createElement("span", { className: "modal-icon", "aria-hidden": "true" }, icon),
          title
        ),
        React.createElement("div", { id: "confirm-modal-message", style: { color: 'var(--text-secondary)', marginBottom: '25px', lineHeight: '1.5', fontSize: '0.95em', whiteSpace: typeof message === 'string' ? 'pre-wrap' : 'normal' }}, message),
        React.createElement("div", { className: "ai-suggestion-modal-footer-actions" },
          cancelText && onCancel && (
            React.createElement("button", {
              type: "button",
              onClick: onCancel,
              className: "secondary"
            },
              cancelText
            )
          ),
          React.createElement("button", {
            ref: confirmButtonRef,
            type: "button",
            onClick: onConfirm,
            className: confirmButtonStyle === 'danger' ? 'danger' : 'primary'
          },
            confirmText
          )
        )
      )
    )
  );
};

export default ConfirmModal;