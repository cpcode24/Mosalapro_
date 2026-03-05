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
    
    // OTP expiry time (30 minutes)
    this.OTP_EXPIRY_TIME = 30 * 60 * 1000;
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
      
      console.log(`OTP Service: Storing OTP for phone variations:`, uniqueVariations);
      console.log(`Original: ${phoneNumber}, Country: ${userCountryCode}, Normalized: ${normalizedPhone}`);
      
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
        console.log(`Stored OTP with key: ${variation}`);
      });
      console.log(`OTP for ${normalizedPhone} is ${this.otpStore.get(phoneNumber).otp} `);
      // Also store in database for persistence
      const userId = await UserModel.findOne({ phone: phoneNumber}).select('_id').exec();
      if(userId) {
        let storedTok = await new TokenModel({ userId: userId._id.toString(),  token: otp}).save();

        console.log("Token from DB:", await TokenModel.findOne({ userId: userId._id.toString() }).exec());
      }

      // Send SMS 
      let message;
        if(res.locals.locale === 'fr'){
          message = await this.client.messages.create({
          body: `Votre code de vérification MosalaPro est ${otp}. Ce code expire dans 15 minutes.`,
          from: this.fromPhone,
          to: normalizedPhone // Use normalized phone for SMS sending
        });
        }else{
          message = await this.client.messages.create({
          body: `Your MosalaPro verification code is: ${otp}. This code expires in 15 minutes.`,
          from: this.fromPhone,
          to: normalizedPhone // Use normalized phone for SMS sending
        });
      }
      console.log(`SENDOTP:: OTP Store keys:`, Array.from(this.otpStore.keys()));
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
      console.log(`OTP Store keys:`, Array.from(this.otpStore.keys()));
      console.log(`OTP Verify: Looking up phone ${phoneNumber}`);

      // If otpStore is empty, look for stored token in db
      if (this.otpStore.size === 0) {
        console.log('OTP store is empty, checking DB for stored token');
        const userId = await UserModel.findOne({ phone: phoneNumber }).select('_id').exec();
        if(!userId) {
          return {
            success: false,
            message: 'This phone number is not registered. Please sign up first or contact support.'
          };
        } 
        console.log('Found userId for phone:', userId._id.toString());
        const tokenRecord = await TokenModel.findOne({ userId: userId._id.toString() }).exec();
        if (tokenRecord && tokenRecord.token === enteredOTP) {
          // OTP matches, delete token after successful verification
          await TokenModel.deleteOne({ _id: tokenRecord._id }).exec();
          console.log('OTP verified successfully from DB token for', phoneNumber);
          return {
            success: true,
            user: await UserModel.findById(userId).exec(),
            message: 'Phone verified successfully via DB token'
          };
        }else{
          console.log(`No matching token found in DB for phone: ${phoneNumber} and entered OTP: ${enteredOTP}`);
          return {
            success: false,
            message: 'OTP not found or expired. Please request a new OTP.'
          };
        }
      }
      
      // Try original phone number first
      let storedData = this.otpStore.get(phoneNumber);
      let actualStorageKey = phoneNumber;
      
      // If not found with original, try cleaned version
      if (!storedData) {
        const cleanedPhone = phoneNumber.replace(/[^\d+]/g, '');
        storedData = this.otpStore.get(cleanedPhone);
        if (storedData) {
          actualStorageKey = cleanedPhone;
          console.log(`Found OTP data with cleaned phone: ${cleanedPhone}`);
        }
      }
      
      // If still not found, try without leading zeros
      if (!storedData) {
        const withoutLeadingZeros = phoneNumber.replace(/[^\d+]/g, '').replace(/^0+/, '');
        storedData = this.otpStore.get(withoutLeadingZeros);
        if (storedData) {
          actualStorageKey = withoutLeadingZeros;
          console.log(`Found OTP data with phone without leading zeros: ${withoutLeadingZeros}`);
        }
      }
      
      // If still not found, try with common country codes
      if (!storedData) {
        const commonCountryCodes = ['+1', '+33', '+44', '+49', '+235', '+234', '+233'];
        
        for (const countryCode of commonCountryCodes) {
          const normalizedPhone = this.normalizePhoneNumber(phoneNumber, countryCode);
          storedData = this.otpStore.get(normalizedPhone);
          if (storedData) {
            actualStorageKey = normalizedPhone;
            console.log(`Found OTP data with normalized phone: ${normalizedPhone} (country: ${countryCode})`);
            break;
          }
        }
      }
      
      if (!storedData) {
        console.log(`OTP not found for ${phoneNumber}`);
        return {
          success: false,
          message: 'OTP not found or expired. Please request a new OTP.'
        };
      }

      // Check if OTP has expired
      if (Date.now() > storedData.expiryTime) {
        // Delete all stored variations
        if (storedData.allVariations) {
          storedData.allVariations.forEach(variation => {
            this.otpStore.delete(variation);
          });
        } else {
          this.otpStore.delete(actualStorageKey);
        }
        return {
          success: false,
          message: 'OTP has expired. Please request a new OTP.'
        };
      }

      // Check attempts (max 4 attempts)
      if (storedData.attempts >= 4) {
        // Delete all stored variations
        if (storedData.allVariations) {
          storedData.allVariations.forEach(variation => {
            this.otpStore.delete(variation);
          });
        } else {
          this.otpStore.delete(actualStorageKey);
        }
        return {
          success: false,
          message: 'Too many failed attempts. Please request a new OTP.'
        };
      }

      // Verify OTP
      if (storedData.otp !== enteredOTP) {
        storedData.attempts++;
        return {
          success: false,
          message: `Invalid OTP. ${3 - storedData.attempts} attempts remaining.`
        };
      }
      console.log('OTP verified successfully for', phoneNumber);
      // OTP is valid, remove from store (delete all stored variations)
      const userEmail = storedData.email;
      console.log("User email associated with OTP:", userEmail);
      let user = null;
      
      // Delete all stored variations
      if (storedData.allVariations) {
        storedData.allVariations.forEach(variation => {
          this.otpStore.delete(variation);
          console.log(`Deleted OTP key: ${variation}`);
        });
      } else {
        this.otpStore.delete(actualStorageKey);
      }
      // Try to find user by email first (for phone registrations, this will be the temp email)
      if(userEmail && userEmail !== '') {
        user = await UserModel.findOne({ email: userEmail }).exec();
      }
      
      // If not found by email, try to find by phone number using all variations
      if (!user) {
        console.log('User not found by email, trying phone number variations...');
        
        // Create all possible phone variations to search for user
        const phoneVariations = [
          phoneNumber,
          phoneNumber.replace(/[^\d+]/g, ''),
          phoneNumber.replace(/[^\d+]/g, '').replace(/^0+/, ''),
          actualStorageKey
        ];
        
        
        // If we have the stored normalized phone, use it too
        if (storedData && storedData.normalizedPhone) {
          phoneVariations.push(storedData.normalizedPhone);
        }
        
        // Remove duplicates
        const uniquePhoneVariations = [...new Set(phoneVariations)];
        console.log('Searching for user with phone variations:', uniquePhoneVariations);
        
        // Try each phone variation
        for (const phoneVariation of uniquePhoneVariations) {
          if (phoneVariation) {
            user = await UserModel.findOne({ phone: phoneVariation }).exec();
            if (user) {
              console.log(`Found user with phone: ${phoneVariation}`);
              break;
            }
          }
        }
      }

      if (!user) {
        console.log(`No user found for phone ${phoneNumber} or email ${userEmail}`);
        return {
          success: false,
          message: 'This phone number is not registered. Please sign up first or contact support.'
        };
      }

      // Delete any existing tokens for this user
      await TokenModel.deleteMany({ userId: user._id }).exec();

      // Update existing user
      user.phoneVerified = true;
      user.verified = true;
      user.active = true;
      user.verifiedContact = phoneNumber;
      user.lastUpdate = new Date();
    
      await user.save();
      
      return {
        success: true,
        user,
        message: 'Phone verified successfully'
      };
     
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