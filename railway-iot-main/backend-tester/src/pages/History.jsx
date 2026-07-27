import React, { useState } from 'react';
import api from '../api/axios';
import Card from '../components/Card';
import JsonViewer from '../components/JsonViewer';

const History = () => {
  const [reqState, setReqState] = useState({});
  const [gateId, setGateId] = useState('');

  const fetchHistory = async () => {
    if (!gateId) return alert('Please enter a gate ID');
    const startTime = Date.now();
    try {
      const res = await api.get(`/gates/${gateId}/history`);
      setReqState({
        status: res.status,
        time: Date.now() - startTime,
        response: res.data
      });
    } catch (error) {
      setReqState({
        status: error.response?.status || 500,
        time: Date.now() - startTime,
        response: error.response?.data || error.message
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <Card title="Gate History Log" method="GET" endpoint="/gates/:id/history" {...reqState}>
        <div className="flex gap-4 mb-4">
          <input 
            type="text" 
            placeholder="Gate ObjectId" 
            value={gateId} 
            onChange={e => setGateId(e.target.value)} 
            className="border p-2 rounded flex-1"
          />
          <button onClick={fetchHistory} className="bg-blue-600 text-white px-4 py-2 rounded">Fetch History</button>
        </div>
      </Card>
    </div>
  );
};

export default History;
