cat > /tmp/mosalapro_analysis.md << 'EOF'
# Mosalapro Codebase Analysis: Booking & Provider Systems

## Executive Summary
This is an African service marketplace platform built with Node.js/Express and MongoDB. It connects service providers (professionals) with customers who need services. The system has established booking, quotation, and payment workflows.

---

## 1. DATABASE TECHNOLOGY

**Database System:** MongoDB (Atlas Cloud)
- **Connection URI:** `mongodb+srv://[user]:[password]@cluster0.y1zvngu.mongodb.net/mosalaproDB?retryWrites=true`
- **ORM:** Mongoose 6.10.0
- **Setup Location:** `/Users/constant24/Desktop/Mosalapro_/app.js` (lines 44-79)
- **Session Store:** MongoDB via `connect-mongo` package

**Key Database Collections:**
- Users
- Bookings
- PostRequests
- Quotations
- QuotationRequests
- JobApplications
- JobDeliverys
- Notifications
- Ratings
- Invoices
- Messages
- Categories, Countries, Cities (reference data)

---

## 2. CORE DATA MODELS

### 2.1 USER MODEL
**File:** `/Users/constant24/Desktop/Mosalapro_/models/user.js`

**Key Fields:**
```javascript
- facebook_id, google_id (OAuth integration)
- firstName, lastName, email, username, phone
- phoneVerified, verifiedContact
- address, country, city, countryCode
- active, verified (account status)
- accountType: "user" | "provider" (default: "user")
- registeredAsPro, strictlyPro (provider flags)
- category (professional category)
- rate (hourly/service rate)
- skills (Array)
- favoriteProviders (Array)
- rating, ratingCount (peer ratings)
- payments (Array - payment methods)
- Stripe integration: stripeCustomerId, subscriptionId, subscriptionStatus, subscriptionPlan
- currency (default: USD)
- twoFactAuth (Boolean)
- Notification preferences: bkgUpdateNotifs, reqUpdateNotifs, msgUpdateNotifs, oppSMSNotifs, SMSUpdateNotifs
- Photo: default profile photo
- facebookAccessToken, facebookTokenExpires (for sync)
- allowFriendReviews, friendsSynced, lastFriendsSync
```

**Provider-Specific Fields:**
- `registeredAsPro` - Flag for professional registration
- `category` - Service category (e.g., "Plumbing", "Web Design")
- `rate` - Service rate
- `skills` - Array of professional skills
- `verified` - Professional verification status

---

### 2.2 BOOKING MODEL
**File:** `/Users/constant24/Desktop/Mosalapro_/models/booking.js`

**Purpose:** Direct service bookings from customers to specific providers

**Key Fields:**
```javascript
- username (customer username)
- bookingTitle, bookingDescription
- category (service category)
- providerId (target provider)
- jobId (linked PostRequest ID)
- budget, budgetType (e.g., "Per project")
- currency (default: USD)
- deadline (delivery date)
- status: "active" | "in-progress" | "completed" | "cancelled" (required)
- files: [Array of file paths]
- providerComments, providerFiles (provider deliverables)
- newDeadlineRequest (Object for deadline modification requests)
- createdAt, lastUpdate (timestamps)
```

**Booking Status Flow:**
- `active` → Provider confirmation stage
- `in-progress` → Work in progress
- `completed` → Work delivered
- `cancelled` → Booking cancelled

---

### 2.3 POST REQUEST MODEL
**File:** `/Users/constant24/Desktop/Mosalapro_/models/postRequest.js`

**Purpose:** Service requests posted by customers (can receive multiple provider bids)

**Key Fields:**
```javascript
- username (requester)
- requestTitle, requestDescription
- requestCategory, requestCategoryIcon
- providerId (assigned provider, optional)
- quotationId (linked quotation, optional)
- budget, budgetType (e.g., "Per project")
- currency (default: USD)
- deadline
- status: "active" | "in-progress" | "completed" | "booked" | "cancelled"
- files: [Array]
- newDeadlineRequest (Object)
- createdAt, lastUpdate
```

**Difference from Booking:**
- PostRequest: Open request, multiple providers can apply
- Booking: Direct booking to specific provider

---

### 2.4 QUOTATION MODEL
**File:** `/Users/constant24/Desktop/Mosalapro_/models/quotation.js`

**Purpose:** Provider's price quote response to a service request

**Key Fields:**
```javascript
- username (requester username)
- providerId (provider responding)
- jobId (linked PostRequest ID)
- budget, budgetType
- currency (default: USD)
- quotationDescription
- category
- initialBudget (original request budget)
- deadline
- status: "sent" | "accepted" | "rejected" | "pending"
- timeOfCompletion (estimated hours/days)
- createdAt, lastUpdate
```

---

### 2.5 QUOTATION REQUEST MODEL
**File:** `/Users/constant24/Desktop/Mosalapro_/models/quotationRequest.js`

**Purpose:** Customer's request for providers to send quotations

**Key Fields:**
```javascript
- username (requester)
- requestTitle, requestDescription
- category
- providerId (target provider)
- requestId (linked PostRequest ID)
- deadline
- file (attached document)
- status: "pending" | "sent" | "responded"
- createdAt, lastUpdate
```

---

### 2.6 JOB APPLICATION MODEL
**File:** `/Users/constant24/Desktop/Mosalapro_/models/jobApplication.js`

**Purpose:** Provider's application to a job posting

**Key Fields:**
```javascript
- userId (requester ID)
- providerId (applicant provider)
- jobId (PostRequest ID)
- status: "active" | "accepted" | "rejected"
- timeOfCompletion (estimated duration)
- createdAt, lastUpdate
```

---

### 2.7 JOB DELIVERY MODEL
**File:** `/Users/constant24/Desktop/Mosalapro_/models/jobDelivery.js`

**Purpose:** Work delivery/submission by provider

**Key Fields:**
```javascript
- jobId (PostRequest ID)
- comment (delivery notes)
- revisionReason (if revision requested)
- file (deliverable file)
- createdAt, lastUpdate
```

---

### 2.8 INVOICE MODEL
**File:** `/Users/constant24/Desktop/Mosalapro_/models/invoice.js`

**Purpose:** Invoice for completed work (though structure seems incomplete)

**Key Fields:**
```javascript
- customerId
- providerId
- jobId
- invoiceTitle, invoiceDescription
- status: "paid" | "pending" | "overdue"
- paymentDate
- createdAt, lastUpdate
```

---

### 2.9 RATING MODEL
**File:** `/Users/constant24/Desktop/Mosalapro_/models/rating.js`

**Purpose:** Peer reviews and ratings

**Key Fields:**
```javascript
- rating (1-5 score)
- ratingTitle
- userComment
- jobId, bookingId
- userId (rater), proId (rated provider)
- isPublic, visibleToFriendsOnly
- helpfulVotes
- reportedCount
- status: "active" | "hidden" | "reported"
- createdAt, lastUpdate
```

---

### 2.10 NOTIFICATION MODEL
**File:** `/Users/constant24/Desktop/Mosalapro_/models/notification.js`

**Purpose:** In-app notifications for users

**Key Fields:**
```javascript
- causedByUserId (who triggered it)
- causedByItem (related document ID)
- bookingId, receiverId
- accountType: "user" | "pro"
- title, content, icon
- translations (multi-language: fr, es, ar, de, it, pt)
- status: "unread" | "read" | "archived"
- createdAt, lastUpdate
```

---

## 3. BOOKING FLOW

### 3.1 Direct Booking Flow

1. **Customer books provider directly:**
   - Endpoint: `POST /submitBooking`
   - File: `/Users/constant24/Desktop/Mosalapro_/api-routes/routes.js` (line 3134)
   - Handler: `BookingService.postBooking()` in `/Users/constant24/Desktop/Mosalapro_/services/booking.js`

2. **Process:**
   ```
   Customer provides:
   - Provider ID
   - Service title & description
   - Budget & budget type
   - Currency
   - Deadline
   - Optional files (max 10MB)
   
   System creates:
   - PostRequest (status: "booked")
   - Booking (status: "active")
   - Notification to provider
   - Email notification if opted-in
   ```

3. **Provider confirms booking:**
   - Endpoint: `POST /confirm-booking`
   - Updates Booking & PostRequest to `"in-progress"`
   - Sends notification to customer

4. **Provider delivers work:**
   - Endpoint: `POST /complete-booking` (with file upload)
   - Uploads deliverables
   - Accepts revision requests via POST `/request-delivery-revision`

5. **Customer accepts delivery:**
   - Endpoint: `POST /accept-delivery`
   - Status → "completed"
   - Triggers rating prompt

---

### 3.2 Open Service Request Flow

1. **Customer posts service request:**
   - Endpoint: `POST /postServiceRequest`
   - Creates PostRequest (status: "active")
   - Providers can see and apply

2. **Provider applies:**
   - Endpoint: `POST /apply-for-sr`
   - Creates JobApplication
   - Notification sent to customer

3. **Provider sends quotation:**
   - Endpoint: `POST /send-quotation` or `POST /quotation`
   - Handler: `QuotationService.send()` in `/services/quotation.js`
   - Creates Quotation (status: "sent")

4. **Customer accepts quotation:**
   - Endpoint: `POST /request/accept-quotation`
   - Converts to Booking/in-progress work

5. **Customer rejects quotation:**
   - Endpoint: `POST /request/reject-quotation`

---

### 3.3 Deadline Modification

1. **Provider requests new deadline:**
   - Endpoint: `POST /request/new-deadline`
   - Creates newDeadlineRequest Object

2. **Customer accepts/rejects:**
   - Accept: `POST /request/accept-new-deadline`
   - Reject: `POST /request/reject-new-deadline`

---

## 4. PAYMENT SYSTEM

### 4.1 Payment Integration

**Primary Payment Provider:** Stripe
- **API Key:** Configured in `.env` as `STRIPE_SEC_KEY`
- **Library:** Stripe npm package (v11.17.0)

**Backup Payment Providers (Configured but may not be active):**
- PayPal (API credentials in .env)
- Native card processing

---

### 4.2 Subscription Payment Flow

**File:** `/Users/constant24/Desktop/Mosalapro_/api-routes/routes.js` (lines 281-436)
**Endpoint:** `POST /charge`

**Subscription Plans:**
```javascript
- bronze: $50.00 (lookup_key: "bronze_price")
- gold: $100.00 (lookup_key: "gold_price")
- platinum: $250.00 (lookup_key: "platinum_price")
```

**Payment Process:**
1. **Input Validation:**
   - Card number, expiry month/year, CVC
   - reCAPTCHA verification (Google reCAPTCHA v3)

2. **Find/Create Stripe Customer:**
   - Searches existing by email
   - Creates new if not found
   - Stores metadata with userId

3. **Create Payment Method:**
   - Modern Stripe API (paymentMethods.create)
   - Type: card
   - Auto-attaches to customer

4. **Create/Update Subscription:**
   - Searches for active subscriptions
   - Creates new or updates existing
   - Sets payment method as default
   - Stores subscriptionId, subscriptionStatus in User model

**User Model Payment Fields:**
```javascript
- stripeCustomerId: Stripe customer ID
- subscriptionId: Active subscription ID
- subscriptionStatus: "active" | "past_due" | "cancelled"
- subscriptionPlan: "bronze" | "gold" | "platinum"
```

---

### 4.3 Check Payment Method

**Endpoint:** `GET /user/has-payment`
- Checks if user has default payment method on Stripe customer
- Returns boolean

---

### 4.4 Payment Method Management

**Endpoint:** `POST /user/payment`
- Saves/updates payment method
- Can be called as AJAX request

---

### 4.5 Invoice Generation

**Endpoint:** `GET /print-invoice/:jobId`
- Generates PDF invoice
- Uses jsPDF and html2pdf.js libraries
- Includes job details, amounts, dates

**Endpoint:** `GET /invoice`
- Renders invoice HTML view

---

### 4.6 Payment Method Model (Note: Appears Incomplete)

**File:** `/Users/constant24/Desktop/Mosalapro_/models/paymentInfo.js`
```javascript
- userId
- cardNumber (stored - Security concern!)
- expirationDate
- cvc (stored - Security concern!)
- status
- createdAt, lastUpdate
```

**IMPORTANT:** This model stores sensitive card data directly in MongoDB, which is a major security risk. Stripe should handle all card storage.

---

## 5. API ROUTE STRUCTURE

### 5.1 Main Routes File
**Location:** `/Users/constant24/Desktop/Mosalapro_/api-routes/routes.js` (182,114 bytes)

### 5.2 Key Booking/Quotation Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/submitBooking` | POST | Customer books provider directly |
| `/booking` | GET | View booking details |
| `/confirm-booking` | POST | Provider confirms booking |
| `/cancel-booking` | POST | Cancel active booking |
| `/complete-booking` | POST | Provider submits deliverables |
| `/mybookings` | GET | Get user's bookings |
| `/getbookings` | GET | Get provider's bookings (paginated) |
| `/postServiceRequest` | POST | Customer posts open service request |
| `/apply-for-sr` | POST | Provider applies to request |
| `/request/new-deadline` | POST | Request deadline extension |
| `/request/accept-new-deadline` | POST | Accept deadline change |
| `/request/reject-new-deadline` | POST | Reject deadline change |
| `/quotation` | POST | Send quotation (deprecated?) |
| `/send-quotation` | POST | Send quotation to request |
| `/request/accept-quotation` | POST | Accept quotation and start work |
| `/request/reject-quotation` | POST | Reject quotation |
| `/quotations` | GET | View quotations (for request) |
| `/getquotations` | GET | Get all user quotations |
| `/accept-delivery` | POST | Customer accepts completed work |
| `/request-delivery-revision` | POST | Request work revision |
| `/quotation-request` | POST | Request quotation from provider |
| `/charge` | POST | Process subscription payment |
| `/user/has-payment` | GET | Check if user has payment method |
| `/user/payment` | POST | Save/update payment method |
| `/print-invoice/:jobId` | GET | Generate PDF invoice |
| `/invoice` | GET | View invoice page |

---

## 6. SERVICE LAYER

**Location:** `/Users/constant24/Desktop/Mosalapro_/services/`

### 6.1 Core Services

| File | Purpose |
|------|---------|
| `booking.js` (19,209 bytes) | Booking creation, confirmation, completion |
| `quotation.js` (21,409 bytes) | Quotation sending and management |
| `postrequest.js` (31,800 bytes) | Service request posting and management |
| `jobApplication.js` (9,976 bytes) | Job application handling |
| `user.js` (54,242 bytes) | User search, profiles, authentication |
| `notification.js` (15,574 bytes) | Notification creation and delivery |
| `message.js` (11,480 bytes) | Direct messaging |
| `emailsender.js` (85,727 bytes) | Email notifications |
| `twilioPhoneAuth.js` (22,300 bytes) | SMS authentication & notifications |
| `chatSupport.js` (7,902 bytes) | AI-powered chat support (RAG-based) |
| `ragService.js` (9,718 bytes) | Retrieval-Augmented Generation (Ollama) |
| `vectorDB.js` (8,134 bytes) | Vector database for RAG embeddings |

---

### 6.2 Booking Service Structure

**File:** `/services/booking.js`

**Methods:**
```javascript
postBooking(req, res)     // Create new booking
confirmBooking(req, res)  // Provider confirms
completeBooking(req, res) // Provider delivers work
cancelBooking(req, res)   // Cancel booking
getBookings(req, res)     // Retrieve bookings
```

---

### 6.3 Quotation Service Structure

**File:** `/services/quotation.js`

**Methods:**
```javascript
send(req, res)            // Send quotation to request
acceptQuotation(req, res) // Accept provider's quote
rejectQuotation(req, res) // Reject provider's quote
```

---

## 7. AUTHENTICATION & AUTHORIZATION

### 7.1 Auth Methods
- **Local:** Email/password (via passport-local-mongoose)
- **OAuth:** Google & Facebook
- **Phone:** Twilio OTP for SMS verification

### 7.2 Session Management
- Express sessions with MongoDB store (connect-mongo)
- Session storage in MongoDB
- Passport.js for serialization

### 7.3 Protected Routes
- All booking/quotation endpoints check `req.isAuthenticated()`
- Returns 401 if not authenticated

---

## 8. NOTIFICATION SYSTEM

### 8.1 In-App Notifications

**File:** `/services/notification.js`

**Notification Types:**
- Booking confirmation requests
- Quotation submissions
- Deadline change requests
- Delivery completed
- New applications
- Messages

**Multi-language Support:**
- English (default)
- French, Spanish, Arabic, German, Italian, Portuguese
- Stored in `translations` object

### 8.2 Email Notifications

**File:** `/services/emailsender.js`

**Provider:** Mailjet
- API credentials: `MAILJET_API_KEY`, `MAILJET_API_SECRET`
- Sender: `authentication@mosalapro.com`

**Trigger Points:**
- Booking confirmation
- Quotation received
- Payment processed
- Deadline changes
- User preferences respected

### 8.3 SMS Notifications

**File:** `/services/twilioPhoneAuth.js`

**Provider:** Twilio
- Credentials: Account SID, Auth Token, Phone Number
- Service SID for templated messages
- OTP verification flow

---

## 9. CONFIGURATION & ENVIRONMENT

### 9.1 Environment Variables

**Location:** `.env` (configured with):

```
Database:
DBURI=mongodb+srv://...

Authentication:
CLIENT_ID, CLIENT_SECRET (Google OAuth)
APP_ID, APP_SECRET (Facebook)
SESSION_SECRET
RECAPTCHA_KEY_ID, RECAPTCHA_SECRET_KEY

Payments:
STRIPE_SEC_KEY
PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET

Email:
MAILJET_API_KEY, MAILJET_API_SECRET
EMAIL_SENDER

SMS:
TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER

Cloud Storage:
GCP_STORAGE_KEY, PROJECT_ID, BUCKET_NAME
GCP_UPLOADS_STORAGE, GCP_FILES_STORAGE

API Keys:
PLACES_API_KEY (Google Maps)
GOOGLE_MAPS_API_KEY
CURRFREAKSAPI (Currency conversion)

RAG/AI:
OLLAMA_URL (Local Llama model)
LLAMA_MODEL, EMBEDDING_MODEL

Firebase (secondary):
FIREBASE_PROJECT_ID, FIREBASE_PRIVATE_KEY, etc.
```

---

## 10. FILE UPLOAD SYSTEM

### 10.1 Storage Architecture

**Primary:** Google Cloud Storage (GCS)
- Bucket: `mosalapro_uploads`
- Directories:
  - `uploads/` - User profile photos
  - `postAttachments/` - Job files & deliverables

**Fallback:** Local disk storage
- Directory: `/uploads/` (relative to root)

### 10.2 Upload Configuration

**File Size Limits:**
- Single file: 10 MB
- Array uploads: 100 MB

**Upload Libraries:**
- Multer (file handling)
- Google Cloud Storage SDK

---

## 11. MULTI-LANGUAGE SUPPORT

### 11.1 i18n Setup

**Library:** i18next

**Supported Languages:**
- English (en)
- French (fr)

**Files:**
- `/locales/en.json`
- `/locales/fr.json`

**Implementation:**
- Middleware: `i18next-http-middleware`
- Backend: `i18next-fs-backend`

### 11.2 Categories Translation

**Categories stored in:** `/public/data/categories.json`
- Each category has `translations.fr.name` for French

---

## 12. CURRENCY HANDLING

### 12.1 Multi-Currency Support

**Default Currency:** USD

**Daily Exchange Rates:**
- Updated via external API: CurrencyFreaks
- Endpoint: `process.env.CURRFREAKSAPI`
- Stored in DB: `CurrencyDailyRates` model
- Global rates cached: `global.rates`

**Countries/Currency Mapping:**
- Model: `CountryModel` - maps country → currency → symbol

**Currency Conversion:**
- Logic in routes for displaying budgets in user's preferred currency
- Real-time conversion using stored rates

---

## 13. REFERENCE DATA MODELS

### 13.1 Static Reference Models

**Files in `/models/`:**

| Model | Purpose |
|-------|---------|
| `category.js` | Service categories |
| `country.js` | Country info + currency |
| `state.js` | States/provinces |
| `city.js` | Cities (dynamic lookup) |
| `currencyDailyRates.js` | Exchange rates cache |

**City Data:**
- JSON files per country: `/public/data/cities/[Country].json`
- Loaded on demand

---

## 14. EXISTING ISSUES & OPPORTUNITIES

### 14.1 Security Concerns

1. **Credit Card Storage** - paymentInfo.js stores card data directly (PCI violation)
   - Solution: Use Stripe tokenization exclusively

2. **Secrets in .env** - Visible in git history
   - Solution: Rotate all exposed keys

3. **File Upload Validation** - Minimal type checking
   - Solution: Add MIME type validation

---

### 14.2 Data Model Gaps

1. **Invoice Model** - Structure is minimal, missing:
   - Line items
   - Tax information
   - Payment status tracking
   - Dispute handling

2. **No explicit Payment Transaction model** - Only subscription tracking

3. **Booking Status** - Limited states, missing:
   - "disputed"
   - "refunded"
   - "hold"

---

### 14.3 Missing Features

1. **Escrow/Payment Hold** - No mechanism to hold funds during service delivery
2. **Dispute Resolution** - No dispute model or workflow
3. **Refund Management** - Not tracked
4. **Invoice Line Items** - Cannot track service breakdown
5. **Tax Calculation** - Not implemented
6. **Recurring/Subscription Services** - Only Stripe subscription, not service-based

---

## 15. DEPLOYMENT & INFRASTRUCTURE

### 15.1 Deployment

**Platform:** Google App Engine (Google Cloud Platform)
- Configuration: `/app.yaml`
- Storage: Google Cloud Storage
- No containerization (AppEngine standard)

### 15.2 Node.js Version

Required: `22.16.0`
Configured in `package.json`

### 15.3 Build Process

```bash
npm install  # Installs dependencies
npm start    # Runs: node app.js
```

---

## 16. FILE STRUCTURE SUMMARY

```
/Users/constant24/Desktop/Mosalapro_/
├── app.js                          # Main entry point
├── .env                            # Environment variables
├── package.json                    # Dependencies
├── api-routes/
│   ├── routes.js                   # All API endpoints (182KB)
│   └── prRoutes.js                 # Alternative routes?
├── models/                         # Mongoose schemas
│   ├── user.js
│   ├── booking.js
│   ├── postRequest.js
│   ├── quotation.js
│   ├── jobApplication.js
│   ├── notification.js
│   ├── rating.js
│   ├── invoice.js
│   ├── jobDelivery.js
│   └── ... (more models)
├── services/                       # Business logic
│   ├── booking.js
│   ├── quotation.js
│   ├── postrequest.js
│   ├── user.js
│   ├── notification.js
│   ├── emailsender.js
│   ├── twilioPhoneAuth.js
│   ├── chatSupport.js              # RAG-based AI
│   ├── ragService.js               # Vector search
│   └── ... (more services)
├── views/                          # EJS templates
├── public/                         # Static files
│   └── data/
│       ├── categories.json
│       ├── countries/
│       └── cities/
├── config/
│   └── firebase.js                 # Firebase config
└── locales/                        # i18n translations
```

---

## 17. KEY INSIGHTS FOR IMPLEMENTATION

1. **Booking Model is Primary** - Most transactions use Booking + PostRequest combination
2. **Quotation Workflow is Flexible** - Can be integrated into booking flow
3. **Payment Currently Subscription-Only** - Service-based payments not implemented
4. **Multi-Currency by Design** - All budgets stored with currency field
5. **Notification Hub Exists** - Reuse for payment confirmations
6. **Email System Mature** - Can leverage for payment receipts
7. **User Verification Exists** - Phone & email verification already implemented
8. **Rating System Complete** - Can tie ratings to payment completion

---

## 18. NEXT STEPS FOR PAYMENT IMPLEMENTATION

1. **Extend Invoice Model** - Add line items, tax, payment method
2. **Create Transaction Model** - Track payment attempts, status, refunds
3. **Payment Workflow** - Integrate with booking completion
4. **Escrow Logic** - Hold payment until delivery accepted
5. **Dispute System** - Handle refund requests
6. **Webhook Handlers** - Stripe webhook processing
7. **Tax Calculation** - Location-based tax rates
8. **Audit Logging** - All payment transactions logged

EOF
cat /tmp/mosalapro_analysis.md
