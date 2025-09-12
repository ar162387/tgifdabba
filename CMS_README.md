# TGIF Dabba CMS (Content Management System)

A comprehensive Content Management System for the TGIF Dabba restaurant, built with React frontend and Node.js/Express backend.

## Features

### Authentication & Security
- JWT-based authentication with httpOnly cookies
- Protected routes with role-based access control
- Rate limiting for API endpoints
- Input validation and sanitization

### Core Functionality
- **Items Management**: CRUD operations for menu items with categories, allergens, and pricing
- **Daily Menu**: Create and manage daily menus for each day of the week
- **Orders Management**: View, update status, and manage customer orders
- **Contacts**: Handle customer inquiries and messages
- **Dashboard**: Overview with statistics and recent activity
- **Profile Management**: Update email and password

### User Experience
- Responsive design with Tailwind CSS
- Real-time notifications for new orders and contacts
- Search, filter, and pagination for all data tables
- Toast notifications for user feedback
- Modal dialogs for detailed views and forms

## Backend Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Update `.env` with your configuration:
```env
MONGODB_URI=mongodb://localhost:27017/tgif-dabba
JWT_SECRET=your-super-secret-jwt-key-here
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

5. Seed the database with initial data:
```bash
node seed.js
```

6. Start the server:
```bash
npm run dev
```

The backend will be available at `http://localhost:5000`

### API Endpoints

#### Authentication
- `POST /api/cms/auth/login` - User login
- `POST /api/cms/auth/logout` - User logout
- `GET /api/cms/auth/me` - Get current user
- `PATCH /api/cms/auth/profile` - Update user profile

#### Items
- `GET /api/cms/items` - Get all items (with pagination, search, filters)
- `GET /api/cms/items/:id` - Get item by ID
- `POST /api/cms/items` - Create new item
- `PUT /api/cms/items/:id` - Update item
- `DELETE /api/cms/items/:id` - Delete item
- `PATCH /api/cms/items/:id/toggle-status` - Toggle item active status

#### Daily Menu
- `GET /api/cms/daily-menu` - Get all daily menus
- `GET /api/cms/daily-menu/day/:day` - Get menu for specific day
- `POST /api/cms/daily-menu` - Create daily menu
- `PUT /api/cms/daily-menu/:id` - Update daily menu
- `DELETE /api/cms/daily-menu/:id` - Delete daily menu
- `PATCH /api/cms/daily-menu/:id/publish` - Publish daily menu

#### Orders
- `GET /api/cms/orders` - Get all orders (with pagination, search, filters)
- `GET /api/cms/orders/:id` - Get order by ID
- `PATCH /api/cms/orders/:id/status` - Update order status
- `PATCH /api/cms/orders/:id/read` - Mark order as read
- `GET /api/cms/orders/stats` - Get order statistics

#### Contacts
- `GET /api/cms/contacts` - Get all contacts (with pagination, search, filters)
- `GET /api/cms/contacts/:id` - Get contact by ID
- `PATCH /api/cms/contacts/:id/read` - Mark contact as read
- `PATCH /api/cms/contacts/:id/respond` - Add response to contact
- `DELETE /api/cms/contacts/:id` - Delete contact
- `GET /api/cms/contacts/stats` - Get contact statistics

#### Notifications
- `GET /api/cms/notifications/counters` - Get notification counters
- `GET /api/cms/notifications/activity` - Get recent activity

## Frontend Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

### CMS Access

The CMS is accessible at:
- Login: `http://localhost:5173/cms/login`
- Dashboard: `http://localhost:5173/cms/dashboard`

### Default Credentials

After running the seed script, you can login with:
- **Email**: admin@tgifdabba.com
- **Password**: admin123

## Project Structure

### Backend
```
backend/
├── src/
│   ├── models/          # MongoDB models
│   ├── controllers/     # Route controllers
│   ├── routes/          # API routes
│   ├── middleware/      # Custom middleware
│   └── utils/           # Utility functions
├── config.js           # Configuration
├── server.js           # Server entry point
├── seed.js             # Database seeding
└── package.json
```

### Frontend CMS
```
frontend/src/cms/
├── components/
│   └── ui/             # Reusable UI components
├── layout/             # Layout components
├── pages/              # Page components
├── services/           # API service functions
└── App.jsx             # CMS main app
```

## Key Features

### Dashboard
- Overview statistics (orders, contacts, revenue)
- Recent activity feed
- Quick action buttons
- Real-time notification counters

### Items Management
- Create, edit, delete menu items
- Categorize items (appetizer, main, dessert, etc.)
- Set allergens and pricing
- Toggle active/inactive status
- Search and filter functionality

### Daily Menu
- Create menus for each day of the week
- Assign items to specific days
- Organize items into sections
- Publish/unpublish daily menus
- Visual day-by-day management

### Orders Management
- View all customer orders
- Update order status (pending, preparing, delivered, canceled)
- View detailed order information
- Mark orders as read/unread
- Search and filter orders

### Contacts Management
- View customer inquiries
- Respond to messages
- Mark contacts as read/unread
- Search and filter contacts
- Delete old contacts

### Profile Management
- Update email address
- Change password
- View account information
- Security settings

## Security Features

- JWT token authentication
- Protected routes
- Rate limiting
- Input validation
- CORS configuration
- Helmet security headers
- Password hashing with bcrypt

## Development

### Running in Development Mode

1. Start MongoDB
2. Start backend: `cd backend && npm run dev`
3. Start frontend: `cd frontend && npm run dev`

### Environment Variables

#### Backend (.env)
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `PORT`: Server port (default: 5000)
- `NODE_ENV`: Environment (development/production)
- `FRONTEND_URL`: Frontend URL for CORS

## Deployment

### Backend Deployment
1. Set production environment variables
2. Build and start the server
3. Ensure MongoDB is accessible
4. Configure reverse proxy (nginx)

### Frontend Deployment
1. Build the application: `npm run build`
2. Deploy the `dist` folder to your hosting service
3. Configure routing for SPA

## API Documentation

The API follows RESTful conventions with consistent response formats:

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "errors": [ ... ]
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
