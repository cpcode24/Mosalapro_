const twilio = require('twilio');
const UserModel = require('../models/user');
const CountryModel = require('../models/country');
const geoip = require('geoip-lite');
const crypto = require('crypto');
const TokenModel = require('../models/token');

class TwilioPhoneAuthService {
  constructor() {
    this.client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
    this.fromPhone = process.env.TWILIO_PHONE_NUMBER;
    
    // In-memory store for OTP codes (in production, use Redis or database)
    this.otpStore = new Map();

    // OTP expiry time (6 minutes)
    this.OTP_EXPIRY_TIME = 6 * 60 * 1000;
  }

  // Generate a 6-digit OTP
  generateOTP() {
    return crypto.randomInt(100000, 999999).toString();
  }

  // Get user's country code from IP address
  async getUserCountryCode(req) {
    try {
      const geo = geoip.lookup(req?.ip || req?.connection?.remoteAddress);
      if (geo?.country) {
        // Try to find country by ISO2 code (if available) or by name
        let country = await CountryModel.findOne({iso2: geo.country}).exec();
        if (!country) {
          // Fallback: try common country mappings
          const countryMappings = {
            'US': 'United States',
            'CA': 'Canada', 
            'GB': 'United Kingdom',
            'FR': 'France',
            'DE': 'Germany',
            'NG': 'Nigeria',
            'ZA': 'South Africa',
            'KE': 'Kenya',
            'UG': 'Uganda',
            'TCD': 'Chad',
            'COG': 'Congo',
            'COD': 'Democratic Republic of the Congo',
            'CIV': 'Ivory Coast',
            'GHA': 'Ghana'
          };
          const countryName = countryMappings[geo.country];
          if (countryName) {
            country = await CountryModel.findOne({name: countryName}).exec();
          }
        }
        return country?.phone_code || '+1'; // Default to +1 if not found
      }
      return '+1'; // Default country code
    } catch (error) {
      console.error('Error getting user country code:', error);
      return '+1';
    }
  }

  // Normalize phone number by adding country code if missing
  normalizePhoneNumber(phoneNumber, countryCode) {
    // Ensure country code has + prefix
    if (countryCode && !countryCode.startsWith('+')) {
      countryCode = '+' + countryCode;
    }
    
    // Remove any non-digit characters except +
    let cleaned = phoneNumber.replace(/[^\d+]/g, '');
    
    // If it already has a country code (starts with +), return as is
    if (cleaned.startsWith('+')) {
      return cleaned;
    }
    
    // Remove leading zeros
    cleaned = cleaned.replace(/^0+/, '');
    
    // If it starts with country code digits without +, add the +
    if (countryCode && cleaned.startsWith(countryCode.replace('+', ''))) {
      return '+' + cleaned;
    }
    
    // If it doesn't have country code, add it
    if (countryCode) {
      return countryCode + cleaned;
    }
    
    return '+' + cleaned;
  }

  // Generate possible phone number variations for matching
  generatePhoneVariations(phoneNumber, countryCode) {
    const variations = [];
    const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
    
    // Add the original number
    variations.push(cleanNumber);
    
    // If it has country code, also add without country code
    if (cleanNumber.startsWith('+')) {
      const withoutCountryCode = cleanNumber.substring(countryCode?.length || 3);
      variations.push(withoutCountryCode);
      variations.push('0' + withoutCountryCode); // With leading zero
    }
    
    // If it doesn't have country code, add with country code
    if (!cleanNumber.startsWith('+') && countryCode) {
      variations.push(countryCode + cleanNumber);
      variations.push(countryCode + cleanNumber.replace(/^0+/, ''));
    }
    
    return [...new Set(variations)]; // Remove duplicates
  }

  // Send OTP via SMS
  async sendOTP(res, phoneNumber, userEmail, countryCode = null) {
    try {
      // Use provided country code or attempt to get it from request, default to +1
      let userCountryCode = countryCode;
      if (!userCountryCode) {
        try {
          if (res && res.req) {
            userCountryCode = await this.getUserCountryCode(res.req);
          }
        } catch (error) {
          console.log('Could not determine country code, using +1 as default');
        }
        userCountryCode = userCountryCode || '+1';
      }
      
      // Normalize phone number using the country code
      const normalizedPhone = this.normalizePhoneNumber(phoneNumber, userCountryCode);
      
      // Generate OTP
      const otp = this.generateOTP();
      const expiryTime = Date.now() + this.OTP_EXPIRY_TIME;
      
      // Create multiple phone number variations for storage
      const cleanedPhone = phoneNumber.replace(/[^\d+]/g, '');
      const phoneVariations = [
        phoneNumber,           // Original as entered
        cleanedPhone,          // Cleaned version  
        normalizedPhone        // Normalized with country code
      ];
      
      // Add variation without leading zeros
      const withoutLeadingZeros = cleanedPhone.replace(/^0+/, '');
      if (withoutLeadingZeros !== cleanedPhone) {
        phoneVariations.push(withoutLeadingZeros);
      }
      
      // Remove duplicates
      const uniqueVariations = [...new Set(phoneVariations)];
      
      // Store OTP with multiple key formats for reliable lookup
      const otpData = {
        otp: otp,
        email: userEmail,
        expiryTime: expiryTime,
        attempts: 0,
        originalPhone: phoneNumber,
        normalizedPhone: normalizedPhone,
        countryCode: userCountryCode,
        allVariations: uniqueVariations
      };
      
      // Store using all phone number variations
      uniqueVariations.forEach(variation => {
        this.otpStore.set(variation, otpData);
      });
      // Also store in database for persistence
      const userId = await UserModel.findOne({ phone: phoneNumber }).select('_id').exec()
                      || await UserModel.findOne({ phone: phoneNumber.replace(/[^\d+]/g, '') }).select('_id').exec()
                      || await UserModel.findOne({ phone: phoneNumber.replace(/[^\d+]/g, '').replace(/^0+/, '') }).select('_id').exec()
                      || await UserModel.findOne({ phone: phoneNumber.substring(2) }).select('_id').exec()
                      || await UserModel.findOne({ phone: phoneNumber.substring(3) }).select('_id').exec()
                      || await UserModel.findOne({ phone: phoneNumber.substring(4) }).select('_id').exec();
      console.log('User ID found for phone number:', userId._id.toString());
      if(userId) {

        await new TokenModel({ userId: userId._id.toString(),  token: otp}).save(
          (err) => {
            if (err) {
              console.error('Error saving token to DB:', err);
            } else {
              console.log('Token saved to DB successfully');
            }
          }
        );

        //console.log("Token from DB:", await TokenModel.findOne({ userId: userId.toString() }).exec());
      }
      else{
        console.log('No user found for phone number.');
        return;
      }

      // Send SMS 
      let message;
        if(res.locals.locale === 'fr'){
          message = await this.client.messages.create({
          body: `Votre code de vérification MosalaPro est ${otp}. Ce code expire dans 5 minutes.`,
          from: this.fromPhone,
          to: normalizedPhone // Use normalized phone for SMS sending
        });
        }else{
          message = await this.client.messages.create({
          body: `Your MosalaPro verification code is: ${otp}. This code expires in 5 minutes.`,
          from: this.fromPhone,
          to: normalizedPhone // Use normalized phone for SMS sending
        });
      }
      
      return {
        success: true,
        messageSid: ' ',
        message: 'OTP sent successfully'
      };
    } catch (error) {
      console.error('Error sending OTP:', error);
      return {
        success: false,
        message: 'Failed to send OTP: ' + error.message
      };
    }
  }

  // Send SMS alerts
  async sendSMS(phoneNumber, countryCode, messageBody) {
        try{
        // Create multiple phone number variations for storage
        const normalizedPhone = this.normalizePhoneNumber(phoneNumber, countryCode);
        let message = await this.client.messages.create({
        body: messageBody,
        from: this.fromPhone,
        to: normalizedPhone // Use normalized phone for SMS sending
        });
        return {
            success: true,
            messageSid: message.sid,
            message: 'SMS sent successfully'
        };
        } catch (error) {
            console.error('Error sending SMS:', error);
        return {
            success: false,
            message: 'Failed to send SMS: ' + error.message
        };
        }
    }

  // Verify OTP
  async verifyOTP(phoneNumber, enteredOTP, userInfo = {}) {
    try {
      
      // If otpStore is empty, look for stored token in db
      //if (this.otpStore.size === 0) {
        const userId = await UserModel.findOne({ phone: phoneNumber }).select('_id').exec()
                      || await UserModel.findOne({ phone: phoneNumber.replace(/[^\d+]/g, '') }).select('_id').exec()
                      || await UserModel.findOne({ phone: phoneNumber.replace(/[^\d+]/g, '').replace(/^0+/, '') }).select('_id').exec()
                      || await UserModel.findOne({ phone: phoneNumber.substring(2) }).select('_id').exec()
                      || await UserModel.findOne({ phone: phoneNumber.substring(3) }).select('_id').exec()
                      || await UserModel.findOne({ phone: phoneNumber.substring(4) }).select('_id').exec();

        
        if(!userId){ 
          return {
            success: false,
            message: 'This phone number is not registered. Please sign up first or contact support.'
          };
        }

        console.log('User found for phone number:', userId._id.toString());
        const tokenRecord = await TokenModel.findOne({ userId: userId._id.toString() }).exec();
        if(tokenRecord){
          console.log('Token record found in DB for user ID:', userId._id.toString());
        }else{
          console.log('No token record found in DB for user ID:', userId._id.toString());
          return;
        }
        if (tokenRecord && tokenRecord.token === enteredOTP) {
          // OTP matches, delete token after successful verification
          await TokenModel.deleteOne({ _id: tokenRecord._id }).exec();
          return {
            success: true,
            user: await UserModel.findById(userId).exec(),
            message: 'Phone verified successfully via DB token'
          };
        }else{
          return {
            success: false,
            message: 'OTP not found or expired. Please request a new OTP.'
          };
        }
      //}
      
     
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return {
        success: false,
        message: 'Verification failed: ' + error.message
      };
    }
  }

  // Extract phone number without country code
  extractPhoneWithoutCountryCode(phoneNumber) {
    let cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
    
    // If starts with +, remove the country code part
    if (cleanNumber.startsWith('+')) {
      // Common country codes and their lengths
      const countryCodes = [
        { code: '+1', length: 2 },      // US/Canada
        { code: '+44', length: 3 },     // UK
        { code: '+33', length: 3 },     // France
        { code: '+49', length: 3 },     // Germany
        { code: '+91', length: 3 },     // India
        { code: '+86', length: 3 },     // China
        { code: '+81', length: 3 },     // Japan
        { code: '+82', length: 3 },     // South Korea
        { code: '+55', length: 3 },     // Brazil
        { code: '+233', length: 4 },    // Ghana
        { code: '+234', length: 4 },    // Nigeria
        { code: '+235', length: 4 },    // Chad
        { code: '+242', length: 4 },    // Congo
        { code: '+243', length: 4 },    // Democratic Republic of Congo
        { code: '+27', length: 3 },     // South Africa
        { code: '+254', length: 4 },    // Kenya
        { code: '+225', length: 4 }     // Ivory Coast
      ];
      
      // Find matching country code and extract the phone number part
      for (const countryCode of countryCodes) {
        if (cleanNumber.startsWith(countryCode.code)) {
          return cleanNumber.substring(countryCode.length);
        }
      }
      
      // If no specific country code found, assume it's 2-4 digits
      const possibleCode = cleanNumber.substring(1, 5);
      for (let i = 2; i <= 4; i++) {
        const code = possibleCode.substring(0, i);
        if (code && !isNaN(code)) {
          return cleanNumber.substring(i + 1);
        }
      }
    }
    
    // If no country code, return as is
    return cleanNumber;
  }

  // Extract country code from phone number
  extractCountryCode(phoneNumber) {
    let cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
    
    if (cleanNumber.startsWith('+')) {
      // Common country codes
      const countryCodes = ['+1', '+44', '+33', '+49', '+91', '+86', '+81', '+82', '+55', '+233', '+234', '+235', '+242', '+243', '+27', '+254', '+225'];
      
      for (const code of countryCodes) {
        if (cleanNumber.startsWith(code)) {
          return code;
        }
      }
      
      // If no specific match, try extracting 2-4 digit codes
      for (let i = 2; i <= 4; i++) {
        const potentialCode = '+' + cleanNumber.substring(1, i + 1);
        if (!isNaN(potentialCode.substring(1))) {
          return potentialCode;
        }
      }
    }
    
    return null;
  }

  // Check if user exists by phone number with the new logic
  async getUserByPhone(phoneNumber, _req = null) {
    try {
      let user = null;
      const inputCountryCode = this.extractCountryCode(phoneNumber);
      const phoneWithoutCountryCode = this.extractPhoneWithoutCountryCode(phoneNumber);
      
      // Step 1: Search database without country code first
      if (phoneWithoutCountryCode) {
        // Try to find users with phone numbers that end with this number (without country code)
        const usersWithMatchingPhone = await UserModel.find({ 
          phone: { $exists: true, $ne: null }
        }).select('phone').exec();
        
        for (const dbUser of usersWithMatchingPhone) {
          if (dbUser.phone) {
            const dbPhoneWithoutCountryCode = this.extractPhoneWithoutCountryCode(dbUser.phone);
            
            // If the phone numbers match (without country code)
            if (dbPhoneWithoutCountryCode === phoneWithoutCountryCode) {
              const dbCountryCode = this.extractCountryCode(dbUser.phone);
              
              // Step 2: Compare country codes if both exist
              if (inputCountryCode && dbCountryCode) {
                if (inputCountryCode === dbCountryCode) {
                  // Country codes match - this is our user
                  user = await UserModel.findById(dbUser._id);
                  break;
                }
                // If country codes don't match, continue searching
              } else {
                // If one or both don't have country codes, consider it a match
                user = await UserModel.findById(dbUser._id);
                break;
              }
            }
          }
        }
      }
      
      // Step 3: If no match found, search for full phone number
      if (!user) {
        user = await UserModel.findOne({ phone: phoneNumber });
        
        // Also try some variations of the full number
        if (!user) {
          const variations = [
            phoneNumber.replace(/[^\d+]/g, ''), // Clean version
            phoneNumber.replace(/[^\d]/g, ''), // Without +
            '+' + phoneNumber.replace(/[^\d]/g, '') // With + added
          ];
          
          for (const variation of variations) {
            user = await UserModel.findOne({ phone: variation });
            if (user) break;
          }
        }
      }
      
      return {
        success: true,
        userExists: !!user,
        user: user
      };
    } catch (error) {
      console.error('Error checking user by phone:', error);
      return {
        success: false,
        message: 'Database error'
      };
    }
  }

  // Cleanup expired OTPs (call periodically)
  cleanupExpiredOTPs() {
    const now = Date.now();
    for (const [phoneNumber, data] of this.otpStore.entries()) {
      if (now > data.expiryTime) {
        this.otpStore.delete(phoneNumber);
      }
    }
  }
}

module.exports = TwilioPhoneAuthService;