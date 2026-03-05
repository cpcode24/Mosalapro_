const admin = require('../config/firebase');
const UserModel = require('../models/user');

class PhoneAuthService {
  constructor() {
    this.auth = admin.auth();
  }

  // Verify Firebase ID token and create/login user
  async verifyFirebaseToken(idToken, userInfo = {}) {
    try {
      // Verify the Firebase ID token
      const decodedToken = await this.auth.verifyIdToken(idToken);
      const phoneNumber = decodedToken.phone_number;
      
      if (!phoneNumber) {
        return { success: false, message: 'Phone number not found in token' };
      }
      
      // Find or create user
      let user = await UserModel.findOne({ phone: phoneNumber });
      
      if (!user) {
        // Create new user
        const userData = {
          phone: phoneNumber,
          phoneVerified: true,
          firstName: userInfo.firstName || 'User',
          lastName: userInfo.lastName || '',
          verified: true,
          active: true,
          verifiedContact: phoneNumber,
          createdAt: new Date(),
          lastUpdate: new Date(),
          accountType: 'user',
          ...userInfo
        };
        
        user = new UserModel(userData);
        await user.save();
      } else {
        // Update existing user
        user.phoneVerified = true;
        user.verified = true;
        user.active = true;
        user.verifiedContact = phoneNumber;
        user.lastUpdate = new Date();
        await user.save();
      }
      
      return { success: true, user, message: 'Phone verified successfully' };
    } catch (error) {
      console.error('Error verifying Firebase token:', error);
      return { success: false, message: 'Token verification failed' };
    }
  }

  // Get user by phone number (for checking if user exists)
  async getUserByPhone(phoneNumber) {
    try {
      const user = await UserModel.findOne({ phone: phoneNumber });
      return { success: true, userExists: !!user, user };
    } catch (error) {
      console.error('Error checking user by phone:', error);
      return { success: false, message: 'Database error' };
    }
  }
}

module.exports = PhoneAuthService;