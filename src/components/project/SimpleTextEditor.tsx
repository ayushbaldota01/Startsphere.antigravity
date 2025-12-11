import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface SimpleTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minHeight?: string;
  label?: string;
}

export const SimpleTextEditor = ({
  value,
  onChange,
  placeholder = 'Start typing...',
  disabled = false,
  minHeight = '200px',
  label,
}: SimpleTextEditorProps) => {
  return (
    <div className="space-y-2">
      {label && <Label className="text-sm font-medium">{label}</Label>}

      <Textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={disabled}
        style={{ minHeight }}
        className="font-sans"
      />
    </div>
  );
};

