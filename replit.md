# ProjectHub Dashboard

## Overview

This is a modern full-stack dashboard application built with React, TypeScript, Express.js, and PostgreSQL. The application provides a clean, responsive interface for project management with a sidebar navigation system and dashboard statistics. It uses Drizzle ORM for database operations and includes a comprehensive UI component library based on Radix UI and Tailwind CSS.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Radix UI primitives with custom styling (shadcn/ui)
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Design**: RESTful API endpoints
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Session Management**: express-session with PostgreSQL store
- **Development**: Hot reloading with tsx

### Data Storage
- **Database**: PostgreSQL 16 (configured via Replit modules)
- **Connection**: Neon Database serverless driver
- **Schema Management**: Drizzle migrations
- **Storage Interface**: Abstracted storage layer with memory fallback for development

## Key Components

### Database Schema
- **Users Table**: User authentication and profile data (id, username, password, name, role, avatar)
- **Navigation Items Table**: Hierarchical navigation structure with parent-child relationships
- **Dashboard Stats Table**: User-specific dashboard metrics and statistics stored as JSONB
- **Clients Table**: Customer/client management with contact information and billing details
- **Categories Table**: Product categorization with hierarchical structure
- **Manufacturers Table**: Product manufacturer information with contact details
- **Product Groups Table**: Product grouping within categories for better organization
- **Products Table**: Complete product catalog with SKU, pricing, inventory, and media

### API Endpoints
- `GET /api/user` - Retrieve current user information
- `GET /api/navigation` - Fetch navigation menu structure
- `GET /api/dashboard/stats` - Get user dashboard statistics
- `GET /api/clients` - Retrieve all clients
- `POST /api/clients` - Create new client
- `PUT /api/clients/:id` - Update client information
- `DELETE /api/clients/:id` - Remove client
- `GET /api/categories` - Retrieve all product categories
- `POST /api/categories` - Create new category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Remove category
- `GET /api/manufacturers` - Retrieve all manufacturers
- `POST /api/manufacturers` - Create new manufacturer
- `PUT /api/manufacturers/:id` - Update manufacturer
- `DELETE /api/manufacturers/:id` - Remove manufacturer
- `GET /api/product-groups` - Retrieve all product groups
- `POST /api/product-groups` - Create new product group
- `PUT /api/product-groups/:id` - Update product group
- `DELETE /api/product-groups/:id` - Remove product group
- `GET /api/products` - Retrieve all products with full details
- `POST /api/products` - Create new product
- `PUT /api/products/:id` - Update product information
- `DELETE /api/products/:id` - Remove product

### UI Components
- **Layout System**: MainLayout with Header and collapsible Sidebar
- **Navigation**: Hierarchical sidebar with icon support and active state management
- **Dashboard**: Statistics cards with trend indicators and visual elements
- **Design System**: Comprehensive component library with consistent theming

## Data Flow

1. **Client Initialization**: React app loads and establishes TanStack Query client
2. **Authentication**: User data fetched on app mount (currently mocked)
3. **Navigation**: Sidebar loads hierarchical navigation items from API
4. **Dashboard Data**: Statistics and metrics loaded for dashboard display
5. **Real-time Updates**: Query invalidation ensures fresh data display

## External Dependencies

### Core Dependencies
- **@tanstack/react-query**: Server state management and caching
- **@neondatabase/serverless**: PostgreSQL connection for production
- **drizzle-orm**: Type-safe database operations
- **wouter**: Lightweight client-side routing
- **@radix-ui/***: Accessible UI primitives

### Development Tools
- **Vite**: Fast build tool and development server
- **TypeScript**: Type safety across the stack
- **Tailwind CSS**: Utility-first styling framework
- **tsx**: TypeScript execution for development

## Deployment Strategy

### Development Environment
- **Platform**: Replit with Node.js 20 runtime
- **Database**: PostgreSQL 16 module
- **Hot Reloading**: Enabled for both client and server
- **Port Configuration**: Frontend on 5000, auto-scaling deployment target

### Production Build
- **Frontend**: Vite builds optimized static assets
- **Backend**: esbuild bundles server code with external dependencies
- **Deployment**: Autoscale deployment with npm scripts
- **Environment**: Production environment variables for database connections

### Configuration Files
- **Replit Config**: `.replit` defines runtime, build, and deployment settings
- **Database Config**: `drizzle.config.ts` manages schema and migrations
- **Build Config**: `vite.config.ts` and `tsconfig.json` handle compilation

## Changelog

```
Changelog:
- June 15, 2025. Initial setup
- June 15, 2025. Added responsive mobile design and dark/light theme toggle with system preference detection and localStorage persistence
- June 15, 2025. Enhanced header with interactive dropdowns for cart (with quantity controls), notifications, and emails (with read/delete actions)
- June 15, 2025. Implemented Portuguese language interface for dropdown components
- June 15, 2025. Added user avatars on left and service indicators (email, WhatsApp, Telegram, push, system) on bottom for notifications and emails
- June 15, 2025. Fixed dark mode theme colors for Recent Projects, Team Activity, and user name in header
- June 15, 2025. Fixed sidebar icon sizes (increased to w-6 h-6) and added click-outside collapse functionality
- June 15, 2025. Added sample data for cart (3 items), notifications (5 items), and emails (10 items) with correct counters
- June 15, 2025. Made sidebar full height with configuration section at bottom including theme controls
- June 15, 2025. Implemented PostgreSQL database storage with comprehensive clients CRUD operations
- June 15, 2025. Created clients page with responsive card layout (3 per row), image support, search/filter functionality
- June 15, 2025. Built complete product management system with categories, manufacturers, product groups, and products
- June 15, 2025. Created 10 sample products with full data structure including SKU, pricing, inventory, and images
- June 15, 2025. Implemented comprehensive API endpoints for all product management entities (categories, manufacturers, product groups, products)
- June 15, 2025. Added modern product listing page with advanced filtering, search, and CRUD operations
- June 15, 2025. Implemented infinite scroll pagination for products (9 items per page) with smooth loading indicators
- June 15, 2025. Created complete supplier management system with category, manufacturer, and product group linking
- June 15, 2025. Added 5 sample suppliers with real data including contact info, commercial terms, and ratings
- June 15, 2025. Fixed sidebar navigation icons and removed duplicates for clean interface
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
Interface language: Portuguese for user-facing elements
Theme preference: System default with manual toggle capability
```