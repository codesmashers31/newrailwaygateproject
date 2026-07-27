import React from 'react';

const JsonViewer = ({ data }) => {
  if (!data) return <div className="text-gray-500 italic text-sm">No data</div>;
  
  return (
    <pre className="bg-gray-900 text-green-400 p-4 rounded-md overflow-x-auto text-xs font-mono">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
};

export default JsonViewer;
