# Payment Service Quick Start Guide

Get the payment service up and running in 5 minutes!

## Step 1: Install Dependencies ✅

Already done! The PayPal SDK has been installed.

```bash
# Verify installation
npm list @paypal/paypal-server-sdk
```

## Step 2: Add Environment Variables (Required)

Add these two keys to your `.env` file:

```bash
# Get your Stripe Publishable Key from https://dashboard.stripe.com/apikeys
STRIPE_PUBLISHABLE_KEY=pk_test_51MsaT3Gi15FMFjNhw9YpCL9lwTtcPCsBahm5kPCm3C29lztA9dPe86dCKpIzMVL43iEyt1vKmlWdIfTkfkEHiXL300xx8zYbhJ

# Optional: Stripe Webhook Secret (get from https://dashboard.stripe.com/webhooks)
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

**Note:** The other Stripe and PayPal keys are already in your `.env` file.

## Step 3: Include Payment Modal in Your Views

Add this line to pages where users need to manage payments:

```ejs
<!-- Add before closing </body> tag -->
<%- include('partials/paymentInfoModal') %>
```

**Pages to update:**
- Booking detail pages
- Provider profile/settings
- User settings/account page

## Step 4: Test the Payment Flow

### A. Add a Payment Method

1. Start your server:
   ```bash
   npm start
   ```

2. Log in to your account

3. Open browser console and run:
   ```javascript
   $('#paymentInfoModalCta').modal('show');
   ```

4. Use Stripe test card:
   - Card: `4242 4242 4242 4242`
   - Expiry: `12/34`
   - CVC: `123`
   - ZIP: `12345`

5. Click "Save Card"

6. Verify the card appears in "Saved Payment Methods"

### B. Test Booking with Payment

1. Create a booking between two test accounts:
   - Account A (Customer) - must have payment method added
   - Account B (Provider)

2. As Provider (Account B), confirm the booking:
   ```javascript
   // This should trigger payment hold
   fetch('/confirm-booking', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ bookingId: 'YOUR_BOOKING_ID' })
   });
   ```

3. Check the response:
   - ✅ Success (200) = Payment held successfully
   - ⚠️ Payment Required (402) = Need to select payment method

4. Complete the work and submit deliverable

5. As Customer (Account A), accept the delivery:
   ```javascript
   // This should trigger payout to provider
   fetch('/accept-delivery', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ requestId: 'YOUR_REQUEST_ID' })
   });
   ```

6. Check MongoDB for payment transaction and payout records

## Step 5: Verify in Database

Check MongoDB for created records:

```javascript
// Payment Transaction
db.paymenttransactions.find().pretty()

// Payout
db.payouts.find().pretty()

// Payment Method
db.paymentmethods.find().pretty()

// Updated Booking
db.bookings.find({ _id: ObjectId('YOUR_BOOKING_ID') }).pretty()
```

## Quick Testing Checklist

- [ ] Added `STRIPE_PUBLISHABLE_KEY` to `.env`
- [ ] Included payment modal in booking pages
- [ ] Tested adding card with Stripe test number
- [ ] Card appears in saved payment methods
- [ ] Tested booking confirmation (payment hold)
- [ ] Payment transaction created in DB
- [ ] Tested delivery acceptance (payout)
- [ ] Payout record created in DB

## Common Test Scenarios

### Scenario 1: First-time User Booking
```
1. User books provider (no payment method saved)
2. Provider confirms booking
3. Backend returns 402 "Payment method required"
4. User adds payment method via modal
5. User selects payment method
6. Payment is authorized and held
7. Booking status → "in-progress"
```

### Scenario 2: Returning User
```
1. User books provider (has default payment method)
2. Provider confirms booking
3. Payment automatically authorized
4. Payment captured to escrow
5. Booking status → "in-progress"
```

### Scenario 3: Delivery & Payout
```
1. Provider completes work
2. Customer accepts delivery
3. Payment released from escrow
4. Payout created for provider
5. Provider receives funds (test mode = instant)
```

## Troubleshooting

### Modal doesn't open
**Fix:**
```html
<!-- Ensure jQuery and Bootstrap are loaded -->
<script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
<script src="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.bundle.min.js"></script>
```

### Stripe Elements not showing
**Fix:**
```html
<!-- Add Stripe.js -->
<script src="https://js.stripe.com/v3/"></script>
```

### "Stripe is not defined" error
**Cause:** `STRIPE_PUBLISHABLE_KEY` not set or Stripe.js not loaded

**Fix:**
1. Add key to `.env`
2. Restart server
3. Verify Stripe.js script is loaded

### Payment fails with "Payment method not found"
**Cause:** Customer has no saved payment method

**Fix:** Add payment method first via modal

## Next Steps

1. ✅ Test with Stripe test cards
2. ✅ Review payment transactions in MongoDB
3. ✅ Test the complete booking → payment → payout flow
4. ✅ Set up Stripe webhooks (see [PAYMENT_SERVICE_SETUP.md](PAYMENT_SERVICE_SETUP.md))
5. ✅ Test PayPal integration
6. ✅ Move to production with live API keys

## Production Checklist

Before going live:

- [ ] Get Stripe live API keys
- [ ] Get PayPal live credentials
- [ ] Set up production webhooks
- [ ] Enable HTTPS
- [ ] Test with real card (small amount)
- [ ] Set up error monitoring
- [ ] Review security settings

## Support

- **Detailed Setup:** [PAYMENT_SERVICE_SETUP.md](PAYMENT_SERVICE_SETUP.md)
- **UI Integration:** [PAYMENT_UI_INTEGRATION.md](PAYMENT_UI_INTEGRATION.md)
- **Complete Summary:** [PAYMENT_IMPLEMENTATION_SUMMARY.md](PAYMENT_IMPLEMENTATION_SUMMARY.md)

---

**Ready to test? Start with Step 2!** 🚀
