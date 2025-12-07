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
  console.log('[SimpleTextEditor] RENDER', { 
    label, 
    disabled, 
    valueLength: value?.length || 0,
    valuePreview: value?.substring(0, 50) || '(empty)',
    onChangeType: typeof onChange
  });
  
  return (
    <div className="space-y-2">
      {label && <Label className="text-sm font-medium">{label}</Label>}
      
      {/* Debug Info */}
      <div className="text-xs bg-blue-50 p-2 rounded border border-blue-200">
        <p><strong>DEBUG:</strong> disabled={String(disabled)}, value length={value?.length || 0}</p>
        <p>Label: {label || '(no label)'}</p>
      </div>
      
      <Textarea
        value={value || ''}
        onChange={(e) => {
          console.log('[SimpleTextEditor] onChange FIRED!', {
            label,
            newLength: e.target.value.length,
            preview: e.target.value.substring(0, 50)
          });
          onChange(e.target.value);
        }}
        onFocus={() => console.log('[SimpleTextEditor] FOCUSED', label)}
        onBlur={() => console.log('[SimpleTextEditor] BLURRED', label)}
        onClick={() => console.log('[SimpleTextEditor] CLICKED', label)}
        placeholder={placeholder}
        disabled={disabled}
        readOnly={disabled}
        style={{ 
          minHeight,
          border: '2px solid orange',
          backgroundColor: disabled ? '#f0f0f0' : 'white'
        }}
        className="font-sans"
      />
      {disabled && (
        <p className="text-xs text-red-500 font-bold">
          ⚠️ This field is DISABLED. You must be a project admin to edit.
        </p>
      )}
      {!disabled && (
        <p className="text-xs text-green-600 font-bold">
          ✅ This field is ENABLED - you should be able to type!
        </p>
      )}
    </div>
  );
};

