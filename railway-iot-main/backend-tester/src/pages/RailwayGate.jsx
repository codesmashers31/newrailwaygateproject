import React, { useState } from 'react';
import api from '../api/axios';
import Card from '../components/Card';
import JsonViewer from '../components/JsonViewer';

const RailwayGate = () => {
  const [reqState, setReqState] = useState({});

  const fetchGates = async () => {
    const startTime = Date.now();
    try {
      const res = await api.get('/gates');
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

  const createGate = async () => {
    const payload = {
      gateCode: `GATE-${Math.floor(Math.random() * 1000)}`,
      gateName: "Test Gate",
      latitude: 12.0,
      longitude: 80.0,
      address: "Test Address",
      city: "Test City",
      state: "Test State"
    };
    
    const startTime = Date.now();
    try {
      const res = await api.post('/gates', payload);
      setReqState({
        status: res.status,
        time: Date.now() - startTime,
        request: payload,
        response: res.data
      });
    } catch (error) {
      setReqState({
        status: error.response?.status || 500,
        time: Date.now() - startTime,
        request: payload,
        response: error.response?.data || error.message
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <Card title="Railway Gates Management" method="GET/POST" endpoint="/gates" {...reqState}>
        <div className="flex gap-4 mb-4">
          <button onClick={fetchGates} className="bg-blue-600 text-white px-4 py-2 rounded">Get All Gates</button>
          <button onClick={createGate} className="bg-green-600 text-white px-4 py-2 rounded">Create Random Gate</button>
        </div>
      </Card>
    </div>
  );
};

export default RailwayGate;
