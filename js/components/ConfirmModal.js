
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
        if (onCancel && cancelText) { 
          onCancel();
        } else if (onConfirm && !cancelText) { 
        }
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onConfirm, onCancel, cancelText]);


  if (!isOpen) {
    return null;
  }
  
  const finalConfirmButtonStyle = confirmButtonStyle 
    ? confirmButtonStyle 
    : { };


  return (
    React.createElement("div", { 
      className: "modal-overlay-basic",
      role: "dialog",
      "aria-modal": "true",
      "aria-labelledby": "confirm-modal-title",
      "aria-describedby": "confirm-modal-message"
    },
      React.createElement("div", { className: "modal-content-basic" },
        React.createElement("h2", { id: "confirm-modal-title", style: { fontSize: '1.3em', color: 'var(--text-primary)', marginBottom: '12px' }},
          title
        ),
        React.createElement("p", { id: "confirm-modal-message", style: { color: 'var(--text-secondary)', marginBottom: '25px', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}, message),
        React.createElement("div", { style: { display: 'flex', justifyContent: 'flex-end', gap: '10px' }},
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
            className: !confirmButtonStyle ? "primary" : "", 
            style: finalConfirmButtonStyle
          },
            confirmText
          )
        )
      )
    )
  );
};

export default ConfirmModal;
