import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import Card from '../components/Card';

const Notifications = () => {
  const [reqState, setReqState] = useState({});

  const fetchNotifications = async () => {
    const startTime = Date.now();
    try {
      const res = await api.get('/notifications');
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
      <Card title="My Notifications" method="GET" endpoint="/notifications" {...reqState}>
        <button onClick={fetchNotifications} className="bg-blue-600 text-white px-4 py-2 rounded mb-4">Fetch Inbox</button>
      </Card>
    </div>
  );
};

export default Notifications;
