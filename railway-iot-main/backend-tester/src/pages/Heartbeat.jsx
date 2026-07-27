import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../api/axios';
import Card from '../components/Card';

const Heartbeat = () => {
  const { register, handleSubmit } = useForm({
    defaultValues: {
      deviceCode: 'ESP001',
      rssi: -65,
      freeHeap: 220000,
      uptimeSeconds: 3600
    }
  });
  const [reqState, setReqState] = useState({});

  const onSubmit = async (data) => {
    // Convert strings to numbers
    const payload = {
      ...data,
      rssi: Number(data.rssi),
      freeHeap: Number(data.freeHeap),
      uptimeSeconds: Number(data.uptimeSeconds)
    };

    const startTime = Date.now();
    try {
      const res = await api.post('/iot/heartbeat', payload);
      setReqState({
        status: res.status,
        time: Date.now() - startTime,
        request: payload,
        response: res.data
      });
      toast.success('Heartbeat sent');
    } catch (error) {
      setReqState({
        status: error.response?.status || 500,
        time: Date.now() - startTime,
        request: payload,
        response: error.response?.data || error.message
      });
      toast.error('Heartbeat failed');
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-8">
      <Card title="Simulate Device Heartbeat" method="POST" endpoint="/iot/heartbeat" {...reqState}>
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-4">
          <input {...register("deviceCode")} placeholder="Device Code" className="border p-2 rounded" required />
          <input {...register("rssi")} type="number" placeholder="RSSI" className="border p-2 rounded" required />
          <input {...register("freeHeap")} type="number" placeholder="Free Heap" className="border p-2 rounded" required />
          <input {...register("uptimeSeconds")} type="number" placeholder="Uptime (s)" className="border p-2 rounded" required />
          <button type="submit" className="bg-purple-600 text-white px-4 py-2 rounded col-span-2">Send Heartbeat</button>
        </form>
      </Card>
    </div>
  );
};

export default Heartbeat;
