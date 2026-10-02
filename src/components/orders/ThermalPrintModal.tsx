import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';

export type ThermalPrintMode = 'token' | 'bill' | 'both';

interface ThermalPrintModalProps {
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  onSelect: (mode: ThermalPrintMode) => void;
}

export function ThermalPrintModal({
  open,
  loading = false,
  onClose,
  onSelect,
}: ThermalPrintModalProps) {
  return (
    <Modal
      open={open}
      onClose={loading ? () => undefined : onClose}
      title="Generate Bill & Token"
      description="Choose what to print on the store thermal printer."
      size="sm"
      footer={
        <Button variant="outline" onClick={onClose} disabled={loading}>
          Skip / Close
        </Button>
      }
    >
      <div className="flex flex-col gap-2.5">
        <Button
          className="w-full justify-center"
          disabled={loading}
          loading={loading}
          onClick={() => onSelect('token')}
        >
          1. Generate Token
        </Button>
        <Button
          className="w-full justify-center"
          variant="secondary"
          disabled={loading}
          loading={loading}
          onClick={() => onSelect('bill')}
        >
          2. Generate Bill
        </Button>
        <Button
          className="w-full justify-center"
          variant="outline"
          disabled={loading}
          loading={loading}
          onClick={() => onSelect('both')}
        >
          3. Generate Bill &amp; Token
        </Button>
      </div>
    </Modal>
  );
}
