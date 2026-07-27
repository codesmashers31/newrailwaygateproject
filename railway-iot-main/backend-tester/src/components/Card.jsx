import React from 'react';

const Card = ({ title, children, method, endpoint, status, time, request, response }) => {
  const methodColor = 
    method === 'POST' ? 'bg-blue-600' :
    method === 'GET' ? 'bg-green-600' :
    method === 'PATCH' ? 'bg-yellow-600' :
    method === 'DELETE' ? 'bg-red-600' : 'bg-gray-600';

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6 border border-gray-200">
      <div className="flex justify-between items-center mb-4 border-b pb-2">
        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
        {method && endpoint && (
          <div className="flex items-center gap-2 font-mono text-sm">
            <span className={`text-white px-2 py-1 rounded text-xs font-bold ${methodColor}`}>
              {method}
            </span>
            <span className="text-gray-600 font-semibold">{endpoint}</span>
          </div>
        )}
      </div>

      <div className="mb-6">
        {children}
      </div>

      {(status || request || response) && (
        <div className="bg-gray-50 p-4 rounded border">
          <div className="flex gap-4 mb-4 text-sm">
            {status && (
              <div>
                <span className="font-bold text-gray-600">Status: </span>
                <span className={`font-mono font-bold ${status >= 400 ? 'text-red-600' : 'text-green-600'}`}>{status}</span>
              </div>
            )}
            {time && (
              <div>
                <span className="font-bold text-gray-600">Time: </span>
                <span className="font-mono">{time} ms</span>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {request && (
              <div>
                <h3 className="font-bold text-gray-700 text-sm mb-1">Request Payload</h3>
                <pre className="bg-gray-800 text-blue-300 p-3 rounded text-xs overflow-x-auto">
                  {JSON.stringify(request, null, 2)}
                </pre>
              </div>
            )}
            {response && (
              <div>
                <h3 className="font-bold text-gray-700 text-sm mb-1">Response</h3>
                <pre className="bg-gray-900 text-green-400 p-3 rounded text-xs overflow-x-auto">
                  {JSON.stringify(response, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Card;
