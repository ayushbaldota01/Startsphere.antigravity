import { useState } from 'react';

export const TestEditor = () => {
  const [value, setValue] = useState('');
  
  console.log('[TestEditor] Current value:', value);
  
  return (
    <div className="p-4 border rounded">
      <h3 className="font-bold mb-2">Simple Test Editor</h3>
      <textarea
        value={value}
        onChange={(e) => {
          console.log('[TestEditor] onChange fired:', e.target.value);
          setValue(e.target.value);
        }}
        placeholder="Type here to test..."
        className="w-full min-h-[200px] p-2 border rounded"
        style={{ border: '2px solid red' }}
      />
      <p className="mt-2">Character count: {value.length}</p>
      <p className="text-xs mt-1">Value: {value || '(empty)'}</p>
    </div>
  );
};



