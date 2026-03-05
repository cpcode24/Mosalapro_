const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhone = process.env.TWILIO_PHONE_NUMBER;
const client = twilio(accountSid, authToken);

function sendOtp(phone, otp) {
  return client.messages.create({
    body: `Your MosalaPro OTP code is: ${otp}`,
    from: fromPhone,
    to: phone
  });
}

module.exports = { sendOtp };
