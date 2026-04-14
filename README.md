
# MosalaPro

MosalaPro is a web application that acts as an interface between users and service providers or freelancers.
It allows users to book services, post requests, handle invoices, sign up as service providers and send instant messages.

The platform connects users with qualified mechanics, painters, personal trainers, dance teachers, and entrepreneurs who take what they are great at and turn it into something greater.
Busy moms, customers, homeowners, parents, folks with massive plans and even larger to-do lists, who need help with important tasks can reach out directly to qualified people through the application.

## Features

### User Features
- Service request posting and management
- Book services from qualified providers
- Real-time messaging with providers
- Track bookings and requests
- Email and SMS notifications
- Rate and review service providers
- Two-factor authentication
- **Enhanced session information** - View detailed location and session data
- Phone verification
- Secure payment processing (Stripe integration)

### Provider Features
- Manage service quotations
- Accept and manage bookings
- Invoice generation
- Portfolio management
- Browse service requests
- Performance analytics
- Skills and category management

### Platform Features
- Multi-language support (English, French)
- Location-based provider search
- Multi-currency support
- Email verification
- Secure authentication with Passport.js
- Google Cloud Storage integration
- Responsive design

## 🛠️ Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Passport.js** - Authentication
- **Stripe** - Payment processing
- **Twilio** - SMS notifications
- **Multer** - File upload handling
- **GeoIP** - Location services

### Frontend
- **EJS** - Template engine
- **HTML5** - Markup
- **CSS3** - Styling
- **JavaScript** - Client-side scripting
- **Bootstrap** - UI framework

### Infrastructure
- **Google Cloud Storage** - File storage
- **Sharp** - Image processing
- **Nodemailer** - Email services

## Project Structure

```
MosalaPro/
├── api-routes/              # Modularized route files
│   ├── routesNew.js        # Main routes integration
│   ├── sharedDependencies.js  # Shared imports & configs
│   ├── authRoutes.js       # Authentication routes
│   ├── userRoutes.js       # User profile routes
│   ├── notificationRoutes.js  # Notification routes
│   ├── staticRoutes.js     # Static page routes
│   └── routes.js           # Original routes (legacy)
├── models/                  # MongoDB models
├── services/               # Business logic services
├── views/                  # EJS templates
├── public/                 # Static assets
│   ├── css/
│   ├── js/
│   └── data/
└── uploads/                # User uploaded files
```


## Live Demo

The project is live at [https://mosalapro.com](https://mosalapro.com)

### Screenshots

![Home Page](https://github.com/constant17/MosalaPro-Web/assets/29698810/f326da83-7dcc-48b6-aed1-18c6e2696b8f)

![Service Providers](https://github.com/constant17/MosalaPro-Web/assets/29698810/e88c6f0b-b61d-44d5-969e-becabf3cd854)


For a complete list of endpoints, see the route modules in [api-routes/](api-routes/)

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (`git commit -m 'Add YourFeature'`)
4. Push to the branch (`git push origin feature/YourFeature`)
5. Open a Pull Request

## License

This project is proprietary software.

**Copyright © 2023-2026 MosalaPro™**

All rights reserved.

##  Author

**Constant Pagoui**

##  Contact

For questions or support, please contact us through the application's contact page or visit [https://mosalapro.com/contact-us](https://mosalapro.com/contact-us)


---

