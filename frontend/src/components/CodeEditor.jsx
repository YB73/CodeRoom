import React from 'react';

export default function CodeEditor({ code, onChange }) {
  return (
    <div className="h-full">
      <textarea
        value={code}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-full p-4 font-mono bg-gray-800 text-white"
        placeholder="Write your code here..."
      />
    </div>
  );
}