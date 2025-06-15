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

### API Endpoints
- `GET /api/user` - Retrieve current user information
- `GET /api/navigation` - Fetch navigation menu structure
- `GET /api/dashboard/stats` - Get user dashboard statistics

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
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
Interface language: Portuguese for user-facing elements
Theme preference: System default with manual toggle capability
```