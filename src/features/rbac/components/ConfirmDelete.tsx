import { useState } from 'react';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import { Button } from '@/shared/components/ui/Button';

export function ConfirmDelete({
  label = 'Delete',
  dangerLabel = 'Delete',
  title = 'Delete item',
  description,
  onConfirm,
  disabled,
}: {
  label?: string;
  dangerLabel?: string;
  title?: string;
  description?: string;
  onConfirm: () => void | Promise<void>;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="danger" size="sm" disabled={disabled} onClick={() => setOpen(true)}>
        {label}
      </Button>
      <ConfirmDialog
        open={open}
        title={title}
        description={description}
        danger
        confirmLabel={dangerLabel}
        onClose={() => setOpen(false)}
        onConfirm={async () => {
          await onConfirm();
        }}
      />
    </>
  );
}
