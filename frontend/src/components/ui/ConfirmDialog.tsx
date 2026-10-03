import { Modal } from './Modal';
import { Button } from './Button';
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  pending = false,
  error,
  label = 'Delete',
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  onConfirm: () => void;
  pending?: boolean;
  error?: string;
  label?: string;
}) {
  return (
    <Modal
      open={open}
      onOpenChange={(value) => {
        if (!pending) onOpenChange(value);
      }}
      title={title}
      description={description}
    >
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <div className="modal-actions">
        <Button
          variant="secondary"
          data-dialog-cancel
          disabled={pending}
          onClick={() => onOpenChange(false)}
        >
          Cancel
        </Button>
        <Button variant="danger" loading={pending} onClick={onConfirm}>
          {label}
        </Button>
      </div>
    </Modal>
  );
}
