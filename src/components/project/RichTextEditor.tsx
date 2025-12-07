import { useEffect, useMemo, useState } from 'react';
import 'react-quill/dist/quill.snow.css';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minHeight?: string;
}

export const RichTextEditor = ({
  value,
  onChange,
  placeholder = 'Start typing...',
  disabled = false,
  minHeight = '200px',
}: RichTextEditorProps) => {
  const [ReactQuill, setReactQuill] = useState<any>(null);
  
  // Microsoft Word-style toolbar configuration - memoized to prevent recreation
  // MUST be before any conditional returns (Rules of Hooks)
  const modules = useMemo(() => ({
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'font': [] }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'color': [] }, { 'background': [] }],
      [{ 'script': 'sub' }, { 'script': 'super' }],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'indent': '-1' }, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['blockquote', 'code-block'],
      ['link', 'image'],
      ['clean'],
    ],
    clipboard: {
      matchVisual: false,
    },
  }), []);

  const formats = useMemo(() => [
    'header', 'font', 'size',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'script',
    'list', 'bullet',
    'indent',
    'align',
    'blockquote', 'code-block',
    'link', 'image',
  ], []);
  
  // Dynamically import ReactQuill to avoid SSR issues
  useEffect(() => {
    import('react-quill').then((module) => {
      setReactQuill(() => module.default);
    });
  }, []);
  
  const handleChange = (content: string) => {
    onChange(content);
  };
  
  // Show loading state while ReactQuill is being loaded
  if (!ReactQuill) {
    return (
      <div 
        className="border rounded-lg p-4 bg-gray-50 animate-pulse flex items-center justify-center"
        style={{ minHeight }}
      >
        <span className="text-sm text-gray-500">Loading editor...</span>
      </div>
    );
  }

  return (
    <div className={`rich-text-editor-wrapper ${disabled ? 'disabled' : ''}`}>
      <style>{`
        .rich-text-editor-wrapper .ql-container {
          min-height: ${minHeight};
          font-size: 14px;
          font-family: inherit;
          background: white;
        }
        
        .rich-text-editor-wrapper .ql-editor {
          min-height: ${minHeight};
          cursor: text;
        }
        
        .rich-text-editor-wrapper .ql-toolbar {
          background: #f8f9fa;
          border-radius: 8px 8px 0 0;
          border: 1px solid #e2e8f0;
          z-index: 1;
        }
        
        .rich-text-editor-wrapper .ql-container {
          border-radius: 0 0 8px 8px;
          border: 1px solid #e2e8f0;
          border-top: none;
          position: relative;
          z-index: 0;
        }
        
        .rich-text-editor-wrapper .ql-editor.ql-blank::before {
          color: #94a3b8;
          font-style: normal;
          left: 15px;
        }
        
        .rich-text-editor-wrapper .quill {
          display: block;
        }
        
        /* Dark mode support */
        .dark .rich-text-editor-wrapper .ql-toolbar {
          background: #1e293b;
          border-color: #334155;
        }
        
        .dark .rich-text-editor-wrapper .ql-container {
          background: #0f172a;
          border-color: #334155;
          color: #e2e8f0;
        }
        
        .dark .rich-text-editor-wrapper .ql-editor {
          color: #e2e8f0;
        }
        
        .dark .rich-text-editor-wrapper .ql-editor.ql-blank::before {
          color: #64748b;
        }
        
        /* Disabled state */
        .rich-text-editor-wrapper.disabled .ql-toolbar {
          pointer-events: none;
          opacity: 0.5;
        }
        
        .rich-text-editor-wrapper.disabled .ql-container {
          background: #f1f5f9;
          cursor: not-allowed;
        }
        
        .rich-text-editor-wrapper.disabled .ql-editor {
          cursor: not-allowed;
        }
        
        .dark .rich-text-editor-wrapper.disabled .ql-container {
          background: #1e293b;
        }
      `}</style>
      <ReactQuill
        theme="snow"
        value={value || ''}
        onChange={handleChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        readOnly={disabled}
      />
    </div>
  );
};

