import React, { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../api/axios';
import Card from '../components/Card';

const IoTSimulator = () => {
  const [reqState, setReqState] = useState({});

  const simulateStatus = async (status) => {
    const payload = {
      deviceCode: "ESP001",
      status: status,
      sensorType: "REED_SWITCH",
      source: "HTTP",
      eventTime: new Date().toISOString()
    };

    const startTime = Date.now();
    try {
      const res = await api.post('/iot/status', payload);
      setReqState({
        status: res.status,
        time: Date.now() - startTime,
        request: payload,
        response: res.data
      });
      toast.success(`Gate set to ${status}`);
    } catch (error) {
      setReqState({
        status: error.response?.status || 500,
        time: Date.now() - startTime,
        request: payload,
        response: error.response?.data || error.message
      });
      toast.error('Simulation failed');
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-8">
      <Card title="IoT Hardware Simulator" method="POST" endpoint="/iot/status" {...reqState}>
        <div className="flex flex-col md:flex-row gap-6 justify-center my-8">
          <button 
            onClick={() => simulateStatus('OPEN')}
            className="bg-green-500 hover:bg-green-600 text-white font-bold py-8 px-16 rounded-xl text-3xl shadow-lg transform transition active:scale-95"
          >
            OPEN GATE
          </button>
          <button 
            onClick={() => simulateStatus('CLOSED')}
            className="bg-red-500 hover:bg-red-600 text-white font-bold py-8 px-16 rounded-xl text-3xl shadow-lg transform transition active:scale-95"
          >
            CLOSE GATE
          </button>
        </div>
      </Card>
    </div>
  );
};

export default IoTSimulator;
