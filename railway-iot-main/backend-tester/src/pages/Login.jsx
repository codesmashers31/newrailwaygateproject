import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Card from '../components/Card';

const Login = () => {
  const { register, handleSubmit } = useForm();
  const [reqState, setReqState] = useState({});
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    const startTime = Date.now();
    try {
      const res = await api.post('/auth/login', data);
      setReqState({
        status: res.status,
        time: Date.now() - startTime,
        request: data,
        response: res.data
      });
      toast.success('OTP Sent');
      // In a real app, you'd pass phone to next page. We'll store temporarily.
      localStorage.setItem('temp_phone', data.phone);
      setTimeout(() => navigate('/verify'), 1500);
    } catch (error) {
      setReqState({
        status: error.response?.status || 500,
        time: Date.now() - startTime,
        request: data,
        response: error.response?.data || error.message
      });
      toast.error('Login failed');
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-8">
      <Card title="Login (Request OTP)" method="POST" endpoint="/auth/login" {...reqState}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input {...register("phone")} placeholder="Phone (+91...)" className="border p-2 w-full rounded" required />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Get OTP</button>
        </form>
      </Card>
    </div>
  );
};

export default Login;
