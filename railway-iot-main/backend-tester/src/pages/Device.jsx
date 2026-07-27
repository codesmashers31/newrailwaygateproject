import React, { useState } from 'react';
import api from '../api/axios';
import Card from '../components/Card';
import JsonViewer from '../components/JsonViewer';

const Device = () => {
  const [reqState, setReqState] = useState({});

  const fetchDevices = async () => {
    const startTime = Date.now();
    try {
      const res = await api.get('/devices');
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

  const createDevice = async () => {
    const payload = {
      deviceCode: `ESP-${Math.floor(Math.random() * 1000)}`,
      deviceName: "Test ESP32",
      serialNumber: "SN-TEST",
      macAddress: "00:00:00:00:00:00",
      firmwareVersion: "v1",
      hardwareVersion: "v1"
    };
    
    const startTime = Date.now();
    try {
      const res = await api.post('/devices', payload);
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
      <Card title="ESP32 Devices Management" method="GET/POST" endpoint="/devices" {...reqState}>
        <div className="flex gap-4 mb-4">
          <button onClick={fetchDevices} className="bg-blue-600 text-white px-4 py-2 rounded">Get All Devices</button>
          <button onClick={createDevice} className="bg-green-600 text-white px-4 py-2 rounded">Create Random Device</button>
        </div>
      </Card>
    </div>
  );
};

export default Device;
