import React from 'react';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isOpen: boolean;
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isDestructive = false,
  isOpen,
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-dialog">
          <h2>{title}</h2>
          <p>{message}</p>
          <div className="form-actions">
            <button className="btn btn-secondary" onClick={onCancel} disabled={isLoading}>
              {cancelText}
            </button>
            <button
              className={isDestructive ? 'btn btn-danger' : 'btn btn-primary'}
              onClick={handleConfirm}
              disabled={isLoading}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
