import User from '../models/User.js';
import OTP from '../models/OTP.js';
import RefreshToken from '../models/RefreshToken.js';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import mailSender from '../utils/mailSender.js';

const sendResponse = (res, statusCode, success, message, data = null, error = null) => {
  const response = { success, message };
  if (data) response.data = data;
  if (error) response.error = error;
  return res.status(statusCode).json(response);
};

export const registerUser = async (req, res) => {
  try {
    const { name, phone, email, role } = req.body;

    if (!name || !email) {
      return sendResponse(res, 400, false, 'Name and email are required');
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendResponse(res, 400, false, 'User with this email already exists');
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
    const { email } = req.body;

    if (!email) {
      return sendResponse(res, 400, false, 'Email is required');
    }

    const user = await User.findOne({ email });
    if (!user) {
      return sendResponse(res, 404, false, 'User not found');
    }

    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

    await OTP.create({
      email,
      otp: generatedOtp,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // Valid for 5 minutes
    });

    // Send email with OTP code using mailSender utility
    const mailTitle = "Your TrainGateView OTP Verification Code";
    const mailBody = `
      <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #4f46e5; text-align: center;">TrainGateView OTP Verification</h2>
        <p>Dear ${user.name},</p>
        <p>You requested a verification code to access your TrainGateView account.</p>
        <p>Please use the following One-Time Password (OTP) code:</p>
        <div style="background: #f1f5f9; padding: 15px; font-size: 28px; font-weight: bold; letter-spacing: 4px; text-align: center; border-radius: 8px; color: #4f46e5; margin: 25px 0;">
          ${generatedOtp}
        </div>
        <p style="font-size: 13px; color: #64748b;">This OTP code is valid for 5 minutes. Please do not share it with anyone.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #94a3b8; text-align: center;">TrainGateView App Team</p>
      </div>
    `;

    await mailSender(email, mailTitle, mailBody);

    return sendResponse(res, 200, true, 'OTP sent successfully to your email', { otp: generatedOtp }); 
  } catch (error) {
    return sendResponse(res, 500, false, 'Failed to send OTP: ' + error.message, null, error.message);
  }
};

export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return sendResponse(res, 400, false, 'Email and OTP are required');
    }

    const otpRecord = await OTP.findOne({ email, otp, verified: false });

    if (!otpRecord || otpRecord.expiresAt < new Date()) {
      return sendResponse(res, 400, false, 'Invalid or expired OTP');
    }

    otpRecord.verified = true;
    await otpRecord.save();

    const user = await User.findOne({ email });
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
