# Replit.md

## Overview

This is a comprehensive restaurant management admin panel system called "Airavata Technologies Restaurant Management System". The application is designed for restaurant administrators to manage multiple restaurants and their menus efficiently.

**Key Features:**
- **Admin Panel**: Full restaurant management system with MongoDB integration for managing multiple restaurants and their menus
- **Light Theme**: Clean, professional UI with white and blue colors for business applications
- **Multi-Restaurant Support**: Each restaurant can have its own MongoDB URI for dynamic database connections

## Recent Changes (January 2025)

- **Customer-facing App Removed**: Removed Maharaja Feast customer-facing application to focus on admin-only system
- **Admin-Only System**: Streamlined to pure restaurant management system for business users
- **MongoDB Integration**: Connected to MongoDB Atlas database for persistent data storage
- **Light Theme**: Professional light theme with white and blue colors throughout
- **Restaurant Management**: Full CRUD operations with MongoDB URI support for dynamic database connections
- **Menu Management**: Category-based menu item management with vegetarian indicators
- **Authentication**: JWT-based admin authentication with bcrypt password hashing and fallback system
- **Dynamic Categories**: Restaurant-specific menu categories and custom attributes
- **Image Management**: Image upload functionality for restaurants and menu items
- **Performance Optimization**: Optimized authentication and database operations
- **Replit Migration**: Successfully migrated from Replit Agent to Replit environment with proper security practices
- **UI Fixes**: Fixed double rupees symbol display in menu items and improved edit form autofilling
- **Dynamic Menu System**: Fully adaptive menu system that analyzes any MongoDB database structure
- **Automatic Category Extraction**: System automatically extracts menu categories from custom MongoDB databases
- **Smart Collection Detection**: Automatically detects menu-related collections in any database structure
- **Field Mapping**: Maps various field names (name/title, price/cost, description/desc) to consistent format
- **Dynamic CRUD Operations**: Full create, read, update, delete operations work with any database structure
- **Migration to Replit (January 14, 2025)**: Successfully migrated from Replit Agent with security improvements and performance optimization
- **Security Hardening**: Removed hardcoded credentials, implemented proper JWT authentication, added timeout protection
- **Performance Fixes**: Reduced database timeouts from 10s to 1s, added graceful fallbacks, fixed ObjectId compatibility issues
- **Dynamic Category System (January 14, 2025)**: Fully implemented dynamic category extraction from any MongoDB URI - system now automatically detects and maps categories like "starters" → "Starters", "mains" → "Main Course", "drinks" → "Beverages", etc. Added refresh categories functionality with visual category display in UI
- **Replit Environment Setup (January 14, 2025)**: Completed migration to Replit environment with proper MongoDB Atlas connection, dotenv configuration, and PostgreSQL database setup for full compatibility
- **MongoDB Integration Complete (January 15, 2025)**: Successfully connected to user's MongoDB Atlas database (DigitalMenuQR) with proper authentication and data structure alignment. Updated menu item schema to match exact MongoDB format with 'veg' field instead of 'isVeg', implemented proper field mapping for all CRUD operations, and ensured all menu items follow the exact structure from the database screenshot
- **UI/Layout Fixes (January 14, 2025)**: Fixed restaurant card action button layout using flexbox with proper spacing and responsive design. Resolved authentication issues causing JSON parsing errors in Admin Settings panel
- **QR Code Integration (January 14, 2025)**: Added optional website field to restaurant form with automatic QR code generation using qrcode library. QR codes are displayed in restaurant dashboard and stored in database. When scanned, QR codes redirect to restaurant websites
- **QR Code Modal & Admin Settings (January 14, 2025)**: Created QR code popup modal with zoomed view for easier scanning and clickable website links. Added comprehensive admin settings panel with profile management, theme customization (6 color themes), security settings, and system configuration options
- **Admin Settings Complete Implementation (January 14, 2025)**: Fixed all admin settings functionality including password change capability for fallback admin, global theme context that applies to all pages including login, dark mode implementation, security tab save button, functional Export Database feature, and View System Logs functionality. All admin settings now persist correctly during session with proper fallback storage system
- **Replit Migration Complete (January 15, 2025)**: Successfully migrated restaurant management system from Replit Agent to Replit environment with MongoDB Atlas integration, proper environment configuration, PostgreSQL database setup, and fixed restaurant update route error handling with fallback mechanisms for robust operation
- **Admin Password Change Fix (January 15, 2025)**: Fixed admin settings password change functionality to properly validate current password against stored fallback password instead of hardcoded value, enabling correct password updates and validation flow
- **Collection-Based Category System (January 15, 2025)**: Completely restructured menu system to fetch categories from MongoDB collection names instead of menu items. Each collection (drinks, starters, desserts, etc.) becomes a category, and menu items are fetched per collection. Added new API endpoint for category-specific menu fetching using exact collection names without any mapping - categories are strictly limited to only the collection names that exist in the database. Fixed menu item creation and editing to save items in the correct collection based on their category, including support for empty collections like "chefspecial" and "maincourse"
- **MongoDB Atlas Integration Complete (January 15, 2025)**: Successfully migrated project from Replit Agent to Replit environment with direct MongoDB Atlas connection using provided MONGODB_URI. Updated all menu item schemas to match exact MongoDB document structure with fields: _id, name, description, price, category, isVeg, image, restaurantId, isAvailable, createdAt, updatedAt, __v. System now properly handles 9 collections (bread, chefspecial, combos, desserts, drinks, maincourse, ricebiryani, soups, starters) with 18 total menu items from maharajafeast database

## User Preferences

Preferred communication style: Simple, everyday language.
UI/UX Preference: Clean, light theme with white and blue colors, professional design for business applications.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite for fast development and building
- **Styling**: Tailwind CSS with custom royal theme variables
- **UI Components**: Radix UI primitives with shadcn/ui components
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Animations**: Framer Motion for smooth transitions and interactions

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Session Storage**: PostgreSQL-based sessions using connect-pg-simple
- **API**: RESTful API with JSON responses

### Key Design Decisions
1. **Monorepo Structure**: Client, server, and shared code in one repository for easier development
2. **TypeScript Throughout**: Full type safety across frontend, backend, and shared schemas
3. **Component-Based UI**: Reusable components following shadcn/ui patterns
4. **Premium Royal Theme**: Enhanced luxury branding with sophisticated animations, premium gradients, and multi-layered visual effects
5. **Advanced Animation System**: Framer Motion with custom keyframes for premium user experience

## Key Components

### Database Schema (shared/schema.ts)
- **Menu Items**: Products with name, description, price, category, veg/non-veg status, and images
- **Cart Items**: User's selected items with quantities
- **Users**: Basic user authentication schema (prepared for future use)

### Frontend Components
- **Admin Login**: Secure authentication page for administrators
- **Admin Dashboard**: Overview of restaurants with statistics and management controls
- **Restaurant Form**: Create and edit restaurant information with MongoDB URI support
- **Menu Management**: Category-based menu item management with vegetarian indicators
- **UI Components**: Complete shadcn/ui component library with light theme styling

### Backend Routes
- **Admin Authentication**: JWT-based login and registration system
- **Restaurant Management**: CRUD operations for restaurant information
- **Menu Management**: CRUD operations for menu items within restaurants
- **Error Handling**: Centralized error handling middleware with fallback authentication

## Data Flow

1. **Admin Authentication**: Secure login with JWT tokens and fallback system
2. **Restaurant Management**: CRUD operations for restaurant data with MongoDB integration
3. **Menu Management**: Category-based menu item management with dynamic categories
4. **Image Handling**: Upload and display functionality for restaurant and menu item images
5. **State Management**: TanStack Query handles caching and synchronization for admin operations

## External Dependencies

### Frontend Dependencies
- **UI Framework**: React, React DOM
- **State Management**: TanStack React Query
- **Styling**: Tailwind CSS, Radix UI primitives
- **Animations**: Framer Motion
- **Forms**: React Hook Form with Zod validation
- **Routing**: Wouter
- **Utilities**: clsx, class-variance-authority

### Backend Dependencies
- **Server**: Express.js
- **Database**: Drizzle ORM with @neondatabase/serverless
- **Validation**: Zod schemas
- **Session Management**: connect-pg-simple
- **Development**: tsx for TypeScript execution

### Development Tools
- **Build**: Vite, esbuild
- **Database**: Drizzle Kit for migrations
- **Linting**: TypeScript compiler checks
- **Replit Integration**: Cartographer and error overlay plugins

## Deployment Strategy

### Development
- **Dev Server**: `npm run dev` runs both frontend (Vite) and backend (tsx)
- **Database**: Uses Neon PostgreSQL database via DATABASE_URL environment variable
- **Hot Reload**: Vite HMR for frontend, tsx watch mode for backend

### Production
- **Build Process**: 
  1. `vite build` compiles frontend to `dist/public`
  2. `esbuild` bundles backend to `dist/index.js`
- **Deployment**: Single Node.js process serving both static files and API
- **Database**: Production PostgreSQL database required

### Configuration
- **Environment Variables**: DATABASE_URL for database connection
- **Static Files**: Express serves built frontend from `dist/public`
- **API Routes**: Backend handles `/api/*` routes, frontend handles client-side routing

The application follows a traditional client-server architecture with a clear separation between frontend and backend, unified by shared TypeScript schemas and a luxurious royal theme throughout the user experience.