# SuShi Backend API

A robust Node.js/Express.js backend for the SuShi food delivery application.

## Features

- User authentication with JWT
- Food catalog management
- Order processing and tracking
- Payment integration with Stripe
- Real-time order status updates
- Push notifications
- Admin dashboard
- Analytics and reporting

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- Redis (for caching and rate limiting)
- AWS S3 (for image storage)
- Stripe account (for payments)
- Firebase account (for push notifications)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/sushi-backend.git
cd sushi-backend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment variables:
```bash
cp .env.example .env
```
Edit `.env` with your configuration values.

4. Start the development server:
```bash
npm run dev
```

## API Documentation

### Authentication Endpoints

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/forgot-password` - Request password reset
- `PATCH /api/auth/reset-password/:token` - Reset password
- `PATCH /api/auth/update-password` - Update password (protected)

### Food Endpoints

- `GET /api/foods` - Get all food items
- `GET /api/foods/search` - Search food items
- `GET /api/foods/category/:category` - Get foods by category
- `GET /api/foods/:id` - Get single food item
- `POST /api/foods` - Create food item (admin)
- `PATCH /api/foods/:id` - Update food item (admin)
- `DELETE /api/foods/:id` - Delete food item (admin)

### Order Endpoints

- `POST /api/orders` - Create new order
- `GET /api/orders/my-orders` - Get user's orders
- `GET /api/orders/:id` - Get order details
- `POST /api/orders/:id/cancel` - Cancel order
- `POST /api/orders/:id/feedback` - Submit order feedback
- `PATCH /api/orders/:id/status` - Update order status (driver)
- `PATCH /api/orders/:id/location` - Update order location (driver)

## Database Schema

### User Model
- Basic info (name, email, password)
- Role (user, admin, driver)
- Address and preferences
- Order history

### Food Model
- Basic info (name, description, price)
- Category and availability
- Nutritional information
- Ratings and reviews
- Customization options

### Order Model
- User reference
- Food items with quantities
- Delivery address
- Status tracking
- Payment information
- Feedback and ratings

## Security Features

- JWT authentication
- Password hashing with bcrypt
- Rate limiting
- CORS configuration
- Input validation
- XSS protection
- Helmet security headers

## Deployment

### Local Development

1. Install MongoDB locally or use MongoDB Atlas
2. Set up environment variables
3. Run development server:
```bash
npm run dev
```

### Production Deployment

1. Set up a production MongoDB instance
2. Configure environment variables
3. Build the application:
```bash
npm run build
```
4. Start the production server:
```bash
npm start
```

### Docker Deployment

1. Build the Docker image:
```bash
docker build -t sushi-backend .
```

2. Run the container:
```bash
docker run -p 3000:3000 --env-file .env sushi-backend
```

### Cloud Deployment (AWS)

1. Create an EC2 instance
2. Install Node.js and MongoDB
3. Clone the repository
4. Install dependencies
5. Set up environment variables
6. Use PM2 for process management:
```bash
npm install -g pm2
pm2 start src/server.js
```

## Testing

Run tests:
```bash
npm test
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. 