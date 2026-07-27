import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../api/axios';
import Card from '../components/Card';

const Register = () => {
  const { register, handleSubmit } = useForm();
  const [reqState, setReqState] = useState({});

  const onSubmit = async (data) => {
    const startTime = Date.now();
    try {
      const res = await api.post('/auth/register', data);
      setReqState({
        status: res.status,
        time: Date.now() - startTime,
        request: data,
        response: res.data
      });
      toast.success('Registration successful');
    } catch (error) {
      setReqState({
        status: error.response?.status || 500,
        time: Date.now() - startTime,
        request: data,
        response: error.response?.data || error.message
      });
      toast.error('Registration failed');
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-8">
      <Card title="Register User" method="POST" endpoint="/auth/register" {...reqState}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input {...register("name")} placeholder="Name" className="border p-2 w-full rounded" required />
          <input {...register("phone")} placeholder="Phone (+91...)" className="border p-2 w-full rounded" required />
          <input {...register("email")} placeholder="Email" type="email" className="border p-2 w-full rounded" />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Register</button>
        </form>
      </Card>
    </div>
  );
};

export default Register;
