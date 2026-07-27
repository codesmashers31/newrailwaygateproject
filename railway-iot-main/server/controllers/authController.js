import User from '../models/User.js';
import OTP from '../models/OTP.js';
import RefreshToken from '../models/RefreshToken.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const sendResponse = (res, statusCode, success, message, data = null, error = null) => {
  const response = { success, message };
  if (data) response.data = data;
  if (error) response.error = error;
  return res.status(statusCode).json(response);
};

export const registerUser = async (req, res) => {
  try {
    const { name, phone, email, role } = req.body;

    if (!name || !phone) {
      return sendResponse(res, 400, false, 'Name and phone are required');
    }

    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return sendResponse(res, 400, false, 'User with this phone number already exists');
    }

    const newUser = await User.create({
      name,
      phone,
      email,
      role: role || 'USER',
    });

    return sendResponse(res, 201, true, 'User registered successfully', newUser);
  } catch (error) {
    return sendResponse(res, 500, false, 'Failed to register user', null, error.message);
  }
};

export const loginUser = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return sendResponse(res, 400, false, 'Phone number is required');
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return sendResponse(res, 404, false, 'User not found');
    }

    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

    await OTP.create({
      phone,
      otp: generatedOtp,
      expiresAt: new Date(Date.now() + 60 * 1000), 
    });

    return sendResponse(res, 200, true, 'OTP sent successfully', { otp: generatedOtp }); 
  } catch (error) {
    return sendResponse(res, 500, false, 'Failed to send OTP', null, error.message);
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return sendResponse(res, 400, false, 'Phone and OTP are required');
    }

    const otpRecord = await OTP.findOne({ phone, otp, verified: false });

    if (!otpRecord || otpRecord.expiresAt < new Date()) {
      return sendResponse(res, 400, false, 'Invalid or expired OTP');
    }

    otpRecord.verified = true;
    await otpRecord.save();

    const user = await User.findOne({ phone });
    user.lastLoginAt = new Date();
    await user.save();

    // 1. Generate JWT Access Token using jwt.sign()
    const accessToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRE || '1d' }
    );

    // 2. Keep Refresh Token as a secure random string
    const refreshTokenString = crypto.randomBytes(64).toString('hex');

    const refreshToken = await RefreshToken.create({
      user: user._id,
      token: refreshTokenString,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    return sendResponse(res, 200, true, 'Login successful', {
      user,
      accessToken,
      refreshToken: refreshToken.token,
    });
  } catch (error) {
    return sendResponse(res, 500, false, 'OTP verification failed', null, error.message);
  }
};

export const refreshAccessToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return sendResponse(res, 400, false, 'Refresh token is required');
    }

    const refreshTokenRecord = await RefreshToken.findOne({ token, revoked: false }).populate('user');

    if (!refreshTokenRecord || refreshTokenRecord.expiresAt < new Date()) {
      return sendResponse(res, 401, false, 'Invalid, expired, or revoked refresh token');
    }

    // Generate a NEW JWT Access Token directly from the populated user document
    const newAccessToken = jwt.sign(
      { id: refreshTokenRecord.user._id, role: refreshTokenRecord.user.role },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRE || '1d' }
    );

    // Return the new JWT without generating a new Refresh Token
    return sendResponse(res, 200, true, 'Access token refreshed', {
      accessToken: newAccessToken,
    });
  } catch (error) {
    return sendResponse(res, 500, false, 'Failed to refresh token', null, error.message);
  }
};

export const logout = async (req, res) => {
  try {
    // Expected to be a protected route, so req.user exists
    const { token } = req.body;

    if (!token) {
      return sendResponse(res, 400, false, 'Refresh token is required to logout');
    }

    // Ensure the user owns this refresh token
    const refreshTokenRecord = await RefreshToken.findOne({ 
      token, 
      user: req.user.id 
    });
    
    if (refreshTokenRecord) {
      refreshTokenRecord.revoked = true;
      await refreshTokenRecord.save();
    }

    return sendResponse(res, 200, true, 'Logged out successfully');
  } catch (error) {
    return sendResponse(res, 500, false, 'Failed to logout', null, error.message);
  }
};
