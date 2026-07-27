import User from '../models/User.js';
import RailwayGate from '../models/RailwayGate.js';

const sendResponse = (res, statusCode, success, message, data = null, error = null) => {
  const response = { success, message };
  if (data) response.data = data;
  if (error) response.error = error;
  return res.status(statusCode).json(response);
};

export const getProfile = async (req, res) => {
  try {
    // Extract authenticated user ID from JWT payload attached by authMiddleware
    const id = req.user.id;

    const user = await User.findById(id).populate('favouriteGates');
    if (!user) {
      return sendResponse(res, 404, false, 'User not found');
    }

    return sendResponse(res, 200, true, 'Profile retrieved successfully', user);
  } catch (error) {
    return sendResponse(res, 500, false, 'Failed to get profile', null, error.message);
  }
};

export const updateProfile = async (req, res) => {
  try {
    const id = req.user.id;
    const { name, email, fcmToken } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return sendResponse(res, 404, false, 'User not found');
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (fcmToken) user.fcmToken = fcmToken;

    await user.save();

    return sendResponse(res, 200, true, 'Profile updated successfully', user);
  } catch (error) {
    return sendResponse(res, 500, false, 'Failed to update profile', null, error.message);
  }
};

export const updateFavouriteGates = async (req, res) => {
  try {
    const id = req.user.id;
    const { gates } = req.body; // Array of gate ObjectIds

    if (!Array.isArray(gates)) {
      return sendResponse(res, 400, false, 'Gates must be an array of ObjectIds');
    }

    const user = await User.findByIdAndUpdate(
      id,
      { favouriteGates: gates },
      { new: true }
    ).populate('favouriteGates');

    if (!user) {
      return sendResponse(res, 404, false, 'User not found');
    }

    return sendResponse(res, 200, true, 'Favourite gates updated successfully', user);
  } catch (error) {
    return sendResponse(res, 500, false, 'Failed to update favourite gates', null, error.message);
  }
};

export const getFavouriteGates = async (req, res) => {
  try {
    const id = req.user.id;

    const user = await User.findById(id).populate('favouriteGates');
    if (!user) {
      return sendResponse(res, 404, false, 'User not found');
    }

    return sendResponse(res, 200, true, 'Favourite gates retrieved', user.favouriteGates);
  } catch (error) {
    return sendResponse(res, 500, false, 'Failed to get favourite gates', null, error.message);
  }
};

export const enableNotifications = async (req, res) => {
  try {
    const id = req.user.id;

    const user = await User.findByIdAndUpdate(id, { notificationEnabled: true }, { new: true });
    if (!user) {
      return sendResponse(res, 404, false, 'User not found');
    }

    return sendResponse(res, 200, true, 'Notifications enabled successfully', user);
  } catch (error) {
    return sendResponse(res, 500, false, 'Failed to enable notifications', null, error.message);
  }
};

export const disableNotifications = async (req, res) => {
  try {
    const id = req.user.id;

    const user = await User.findByIdAndUpdate(id, { notificationEnabled: false }, { new: true });
    if (!user) {
      return sendResponse(res, 404, false, 'User not found');
    }

    return sendResponse(res, 200, true, 'Notifications disabled successfully', user);
  } catch (error) {
    return sendResponse(res, 500, false, 'Failed to disable notifications', null, error.message);
  }
};
