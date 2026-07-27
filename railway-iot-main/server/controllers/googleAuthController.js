import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import { getGoogleAuthURL, getTokens, getGoogleUser } from '../config/googleOAuth.js';

// @desc    Initiate Google OAuth Login
// @route   GET /api/auth/google
// @access  Public
export const googleLogin = (req, res) => {
  const url = getGoogleAuthURL();
  res.redirect(url);
};

// @desc    Google OAuth Callback
// @route   GET /api/auth/google/callback
// @access  Public
export const googleCallback = async (req, res) => {
  try {
    const code = req.query.code;
    if (!code) {
      return res.status(400).json({ message: 'Authorization code not provided' });
    }

    // Exchange authorization code for tokens
    const { id_token, access_token } = await getTokens({
      code,
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      redirectUri: process.env.GOOGLE_CALLBACK_URL,
    });

    // Fetch user profile from Google
    const googleUser = await getGoogleUser(id_token, access_token);

    if (!googleUser.verified_email) {
      return res.status(403).json({ message: 'Google account not verified' });
    }

    // Check if user already exists (by email)
    let user = await User.findOne({ email: googleUser.email });

    if (!user) {
      // Create new user if doesn't exist. Notice we generate a random password if your schema requires it,
      // or we just omit it if your schema supports optional password for OAuth users.
      // Assuming `googleId` and `profilePicture` are optional in your existing schema.
      user = await User.create({
        name: googleUser.name,
        email: googleUser.email,
        googleId: googleUser.id,
        profilePicture: googleUser.picture,
        isVerified: true,
      });
    } else if (!user.googleId) {
      // If user exists but no googleId (e.g. registered with email/password previously), link the account
      user.googleId = googleUser.id;
      if (!user.profilePicture) {
          user.profilePicture = googleUser.picture;
      }
      await user.save();
    }

    // Generate JWT token
    const token = generateToken(user._id);

    // Return user data and JWT token in response body
    res.status(200).json({
      message: 'Successfully logged in with Google',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
        role: user.role,
        assignedGate: user.assignedGate,
        isVerified: user.isVerified,
      },
    });

  } catch (error) {
    console.error('Google Callback Error:', error);
    res.status(500).json({ message: 'Authentication failed', error: error.message });
  }
};
