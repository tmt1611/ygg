
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

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        // Only trigger cancel if a cancel action/button is available.
        if (onCancel && cancelText) { 
          onCancel();
        }
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onCancel, cancelText]);


  if (!isOpen) {
    return null;
  }

  const isDanger = confirmButtonStyle === 'danger';
  const icon = isDanger ? '⚠️' : '❓';
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
        React.createElement("div", { id: "confirm-modal-message", style: { color: 'var(--text-secondary)', marginBottom: '25px', whiteSpace: 'pre-wrap', lineHeight: '1.5', fontSize: '0.95em' }}, message),
        React.createElement("div", { className: "modal-footer-actions", style: { display: 'flex', justifyContent: 'flex-end', gap: '10px' }},
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
