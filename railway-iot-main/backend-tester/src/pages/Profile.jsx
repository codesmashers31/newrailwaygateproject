import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../api/axios';
import Card from '../components/Card';

const Profile = () => {
  const { register, handleSubmit, setValue } = useForm();
  const [reqState, setReqState] = useState({});

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const startTime = Date.now();
    try {
      const res = await api.get('/users/profile');
      const user = res.data.data;
      if (user) {
        setValue('name', user.name);
        setValue('email', user.email || '');
      }
      setReqState({ status: res.status, time: Date.now() - startTime, response: res.data });
    } catch (error) {
      setReqState({ status: error.response?.status || 500, time: Date.now() - startTime, response: error.response?.data });
    }
  };

  const onSubmit = async (data) => {
    const startTime = Date.now();
    try {
      const res = await api.patch('/users/profile', data);
      setReqState({ status: res.status, time: Date.now() - startTime, request: data, response: res.data });
      toast.success('Profile updated');
    } catch (error) {
      setReqState({ status: error.response?.status || 500, time: Date.now() - startTime, request: data, response: error.response?.data });
      toast.error('Failed to update profile');
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-8">
      <Card title="My Profile" method="PATCH" endpoint="/users/profile" {...reqState}>
        <div className="mb-4">
          <button onClick={fetchProfile} className="bg-gray-600 text-white px-4 py-2 rounded text-sm mb-4">Refresh Profile</button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <input {...register("name")} placeholder="Full Name" className="border p-2 w-full rounded" required />
          <input {...register("email")} placeholder="Email" type="email" className="border p-2 w-full rounded" />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Update Profile</button>
        </form>
      </Card>
    </div>
  );
};

export default Profile;
