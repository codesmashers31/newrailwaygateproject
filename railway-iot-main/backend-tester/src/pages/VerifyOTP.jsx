import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Card from '../components/Card';

const VerifyOTP = () => {
  const { register, handleSubmit, setValue } = useForm();
  const [reqState, setReqState] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const phone = localStorage.getItem('temp_phone');
    if (phone) setValue('phone', phone);
  }, [setValue]);

  const onSubmit = async (data) => {
    const startTime = Date.now();
    try {
      const res = await api.post('/auth/verify-otp', data);
      
      const { accessToken, refreshToken } = res.data.data || {};
      if (accessToken) localStorage.setItem('accessToken', accessToken);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);

      setReqState({
        status: res.status,
        time: Date.now() - startTime,
        request: data,
        response: res.data
      });
      toast.success('Login Success! Tokens Saved.');
      setTimeout(() => navigate('/'), 1500);
    } catch (error) {
      setReqState({
        status: error.response?.status || 500,
        time: Date.now() - startTime,
        request: data,
        response: error.response?.data || error.message
      });
      toast.error('Verification failed');
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-8">
      <Card title="Verify OTP" method="POST" endpoint="/auth/verify-otp" {...reqState}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input {...register("phone")} placeholder="Phone" className="border p-2 w-full rounded" required />
          <input {...register("otp")} placeholder="Enter OTP (e.g. 123456)" className="border p-2 w-full rounded" required />
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Verify & Save Tokens</button>
        </form>
      </Card>
    </div>
  );
};

export default VerifyOTP;
