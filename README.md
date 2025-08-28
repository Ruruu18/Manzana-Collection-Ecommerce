# Manzana Collection E-commerce Platform

A full-stack e-commerce solution built with React Native (mobile app) and React (web admin dashboard) with Supabase as the backend. This platform is designed for fashion retail, supporting both consumer customers and resellers.

## 🏗️ Project Structure

```
Manzana-Collection/
├── Manzana/                    # React Native Mobile App (Expo)
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── screens/           # App screens (auth, main, shared)
│   │   ├── navigation/        # Navigation configuration
│   │   ├── hooks/            # Custom React hooks
│   │   ├── services/         # API services (Supabase)
│   │   ├── types/            # TypeScript type definitions
│   │   ├── utils/            # Utility functions
│   │   └── constants/        # App configuration and themes
│   ├── assets/               # Images and static files
│   └── package.json          # Mobile app dependencies
├── Manzana-web/               # React Web Admin Dashboard (Vite)
│   ├── src/
│   │   ├── pages/admin/      # Admin dashboard pages
│   │   ├── components/       # Web UI components
│   │   ├── context/          # React context providers
│   │   ├── lib/              # Supabase client configuration
│   │   └── utils/            # Web utility functions
│   └── package.json          # Web app dependencies
└── README.md                 # This file
```

## 🚀 Features

### Mobile App (React Native)
- **User Authentication**: Login, registration, password reset
- **Product Catalog**: Browse products by categories
- **Product Details**: Detailed product views with images and variants
- **Shopping Cart**: Add/remove items, quantity management
- **Wishlist**: Save favorite products
- **Push Notifications**: Promotions, stock alerts, order updates
- **User Profiles**: Manage personal information and preferences
- **Order History**: View past purchases
- **Stock Alerts**: Get notified when items are back in stock
- **Promotions**: View current sales and discounts

### Web Admin Dashboard (React)
- **Product Management**: CRUD operations for products and categories
- **Order Management**: View and manage customer orders
- **Customer Management**: View customer information and orders
- **Promotions Management**: Create and manage sales campaigns
- **Staff Management**: Admin user management
- **Dashboard Analytics**: Overview of key metrics

### Backend (Supabase)
- **PostgreSQL Database**: Comprehensive schema with RLS policies
- **Authentication**: Built-in auth with email/password
- **Storage**: Image upload for products and promotions
- **Real-time**: Live updates for notifications
- **Row Level Security**: Secure data access policies

## 📱 Screenshots & Demo

*Mobile App Features:*
- Clean, modern UI designed for fashion retail
- Support for both consumer and reseller user types
- Comprehensive notification system
- Shopping cart and wishlist functionality

*Web Admin Dashboard:*
- Professional admin interface
- Comprehensive product and order management
- Real-time data updates

## 🛠️ Technology Stack

### Mobile App
- **Framework**: React Native with Expo
- **Navigation**: React Navigation v6
- **State Management**: React Hooks + Context
- **Styling**: React Native StyleSheet
- **Icons**: Expo Vector Icons
- **Image Handling**: Expo Image
- **Notifications**: Expo Notifications

### Web Dashboard
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router DOM v7
- **Styling**: CSS3 with custom styling
- **Icons**: Native web icons

### Backend & Database
- **Backend as a Service**: Supabase
- **Database**: PostgreSQL with advanced features
- **Authentication**: Supabase Auth
- **Storage**: Supabase Storage for images
- **Real-time**: Supabase Realtime

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or later)
- **npm** or **yarn**
- **Git**
- **Expo CLI** (for mobile development)
- **Supabase Account** (for backend services)

### Mobile Development
- **iOS**: Xcode (for iOS simulator)
- **Android**: Android Studio (for Android emulator)
- **Expo Go App** (for testing on physical devices)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone git@github.com:Ruruu18/Manzana-Collection-Ecommerce.git
cd Manzana-Collection-Ecommerce
```

### 2. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to your project settings and copy:
   - Project URL
   - Anon public key
3. In your Supabase SQL Editor, run the `supabase.sql.txt` file to set up the database schema
4. Enable Storage and create the required buckets:
   - `product-images` (public)
   - `promotion-images` (public)

### 3. Mobile App Setup (Manzana/)

```bash
cd Manzana
npm install

# Update Supabase configuration in src/constants/theme.ts
# Replace with your actual Supabase URL and key
export const APP_CONFIG = {
  API_URL: "your-supabase-url",
  API_KEY: "your-supabase-anon-key",
  // ... other config
};
```

**Start the mobile app:**
```bash
npm start
# or
npx expo start
```

### 4. Web Dashboard Setup (Manzana-web/)

```bash
cd Manzana-web
npm install

# Create .env file in Manzana-web/
echo "VITE_SUPABASE_URL=your-supabase-url" > .env
echo "VITE_SUPABASE_ANON_KEY=your-supabase-anon-key" >> .env
```

**Start the web dashboard:**
```bash
npm run dev
```

### 5. Access the Applications

- **Mobile App**: Use Expo Go app to scan the QR code
- **Web Dashboard**: Open http://localhost:5173
  - Default admin login: `admin@manzana.com` (in development mode)

## 🔧 Configuration

### Mobile App Configuration
Edit `Manzana/src/constants/theme.ts`:

```typescript
export const APP_CONFIG = {
  API_URL: "https://your-project.supabase.co",
  API_KEY: "your-anon-key",
  ENVIRONMENT: "development", // or "production"
  APP_NAME: "Manzana Collection",
  VERSION: "1.0.0",
};
```

### Web Dashboard Configuration
Create `Manzana-web/.env`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 📊 Database Schema

The application uses a comprehensive PostgreSQL schema with the following main tables:

- **users**: Customer and admin user accounts
- **categories**: Product categorization
- **products**: Product catalog with pricing and inventory
- **product_variants**: Size, color, and style variations
- **product_images**: Product image management
- **promotions**: Sales and discount campaigns
- **orders**: Customer order management
- **order_items**: Individual items within orders
- **cart**: Shopping cart management
- **wishlist**: Customer wish lists
- **notifications**: Push notification system
- **stock_alerts**: Inventory alert system
- **reviews**: Product review system

### Key Features:
- Row Level Security (RLS) for data protection
- Automatic triggers for updating timestamps
- Comprehensive indexing for performance
- Built-in audit trails

## 🔐 Authentication & Authorization

### User Types
- **Consumer**: Regular customers
- **Reseller**: Bulk buyers with special pricing
- **Admin**: Full system access (web dashboard)

### Security Features
- Row Level Security policies
- JWT-based authentication
- Session management
- Password reset functionality

## 📱 Mobile App Features Detail

### Core Screens
- **Authentication Flow**: Login, Register, Forgot Password
- **Onboarding**: Welcome and profile setup
- **Home**: Featured products and promotions
- **Catalog**: Product browsing with filtering
- **Product Details**: Comprehensive product information
- **Shopping Cart**: Cart management
- **Profile**: User account management
- **Notifications**: Push notification center
- **Wishlist**: Saved products
- **Orders**: Order history and tracking

### Navigation
- Tab-based navigation for main sections
- Stack navigation for detailed flows
- Deep linking support for notifications

## 🌐 Web Dashboard Features Detail

### Admin Pages
- **Dashboard**: Overview metrics and analytics
- **Products**: Product and category management
- **Orders**: Order processing and fulfillment
- **Customers**: Customer information and support
- **Promotions**: Campaign and discount management
- **Staff**: Admin user management

### Key Features
- Responsive design for desktop and tablet
- Real-time data updates
- Image upload functionality
- Advanced filtering and search

## 🚀 Deployment

### Mobile App (Expo)
```bash
cd Manzana

# Build for production
npx expo build:android
npx expo build:ios

# Or use EAS Build (recommended)
npx eas build --platform android
npx eas build --platform ios
```

### Web Dashboard
```bash
cd Manzana-web

# Build for production
npm run build

# Deploy to your hosting provider
# The built files will be in the 'dist' directory
```

### Supabase (Production)
1. Update environment variables
2. Review and tighten RLS policies
3. Configure custom domain
4. Set up monitoring and backups

## 🧪 Development Mode

Both applications include development modes with mock data:

### Mobile App
- Automatically detects invalid Supabase credentials
- Falls back to mock data for development
- Mock authentication for testing

### Web Dashboard
- Mock admin authentication
- Local storage persistence for mock data
- Development indicators in the UI

## 📝 Environment Variables

### Required Environment Variables

**Mobile App** (`Manzana/src/constants/theme.ts`):
```typescript
export const APP_CONFIG = {
  API_URL: string,
  API_KEY: string,
  ENVIRONMENT: "development" | "production",
};
```

**Web Dashboard** (`Manzana-web/.env`):
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🐛 Troubleshooting

### Common Issues

**1. Supabase Connection Issues**
- Verify your Supabase URL and API key
- Check if your Supabase project is active
- Ensure RLS policies are configured correctly

**2. Mobile App Not Starting**
- Clear Expo cache: `npx expo start --clear`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check for React Native/Expo compatibility issues

**3. Web Dashboard Build Issues**
- Clear Vite cache: `rm -rf node_modules/.vite`
- Verify environment variables are set correctly
- Check for TypeScript errors

**4. Database Schema Issues**
- Re-run the SQL schema file in Supabase
- Check if all tables and policies are created
- Verify storage buckets are configured

### Getting Help
- Check the GitHub Issues page
- Review Supabase documentation
- Ensure all dependencies are up to date

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Maintain consistent code formatting
- Add tests for new features
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- **Developer**: Manzana Collection Team
- **Contact**: For questions and support

## 🙏 Acknowledgments

- Built with [Expo](https://expo.dev) and [React Native](https://reactnative.dev)
- Backend powered by [Supabase](https://supabase.com)
- UI inspiration from modern e-commerce platforms
- Icons provided by Expo Vector Icons

---

## 🚀 Getting Started Commands

**Quick setup for development:**

```bash
# Clone and setup
git clone git@github.com:Ruruu18/Manzana-Collection-Ecommerce.git
cd Manzana-Collection-Ecommerce

# Setup mobile app
cd Manzana && npm install && npm start

# Setup web dashboard (in new terminal)
cd ../Manzana-web && npm install && npm run dev
```

**Production deployment:**
1. Configure Supabase project
2. Update environment variables
3. Run database migrations
4. Build and deploy applications

For detailed setup instructions, follow the sections above.
