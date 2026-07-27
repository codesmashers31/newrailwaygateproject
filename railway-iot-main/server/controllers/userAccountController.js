import UserAccount from '../models/UserAccount.js';

// CREATE User
export const createUserAccount = async (req, res) => {
  try {
    const { name, email, mobileNo, role, assignedGate, currentLocation, status } = req.body;
    
    const userExists = await UserAccount.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }
    
    const user = await UserAccount.create({
      name, email, mobileNo, role, assignedGate, currentLocation,
      status: status || 'active', lastSeen: new Date(),
    });
    
    res.status(201).json({ message: 'User Account created successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// GET All Users
export const getUserAccounts = async (req, res) => {
  try {
    const users = await UserAccount.find({});
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// GET User By ID
export const getUserAccountById = async (req, res) => {
  try {
    const user = await UserAccount.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// UPDATE User
export const updateUserAccount = async (req, res) => {
  try {
    const user = await UserAccount.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json({ message: 'User updated successfully', user });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};

// DELETE User
export const deleteUserAccount = async (req, res) => {
  try {
    const user = await UserAccount.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};
