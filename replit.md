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
- June 15, 2025. Built complete sales management system with CRUD operations for sales and sale items
- June 15, 2025. Added 8 example sales with real data including payment methods, status tracking, and delivery information
- June 15, 2025. Created comprehensive sales page with advanced filtering, search, and modern card-based layout
- June 15, 2025. Implemented sales form with client selection, payment tracking, and delivery management features
- June 15, 2025. Fixed client card layout overflow issues with custom CSS classes for proper content containment
- June 15, 2025. Enhanced sales page to show only latest status, product photos instead of icons, and product names with smaller SKU text
- June 15, 2025. Implemented non-fiscal receipt generation system with downloadable text format cupons for customers
- June 15, 2025. Added product pricing display in sales with quantity, unit price, and calculated totals for each item
- June 15, 2025. Reorganized sales cards to display products in clean format: photo + quantity + name + total price (e.g. "1x iPhone 14 Pro Max R$ 10.000,00")
- June 15, 2025. Fixed sale items loading system with proper async data fetching and JSON conversion for reliable product display
- June 15, 2025. Implemented complete support ticket system with PostgreSQL integration and Chatwoot compatibility
- June 15, 2025. Created comprehensive ticket management with categories, priorities, status tracking, and message threading
- June 15, 2025. Added support navigation item and 5 sample tickets with realistic data including client associations and message history
- June 15, 2025. Built ticket detail view with expandable information, Chatwoot integration links, and message management interface
- June 15, 2025. Implemented complete WebSocket real-time system for all data updates (clients, products, sales, support tickets)
- June 15, 2025. Created minimalist WebSocket indicator with bolt icon in bottom-right corner showing connection status via colors
- June 15, 2025. Added expandable connection details panel with technical information, last message data, and reconnection capabilities
- June 15, 2025. All CRUD operations now broadcast real-time updates to connected clients with automatic cache invalidation
- June 15, 2025. Migrated all data from local storage to PostgreSQL database for complete persistence
- June 15, 2025. Implemented dynamic data loading via WebSocket with real-time synchronization across all pages
- June 15, 2025. Enhanced WebSocket indicator with tunnel animation showing data flow from server to client via dotted lines
- June 15, 2025. System now fully database-driven with 40+ records across clients, products, sales, suppliers, and support tickets
- June 15, 2025. Implemented comprehensive toast notification system for all CRUD operations with Portuguese messages and real-time WebSocket synchronization
- June 15, 2025. Enhanced toast notifications with contextual sounds (success chimes, error tones, info beeps) and emoji icons (✅📦👤🗑️🚛🛒🎫) for visual feedback
- June 16, 2025. Created comprehensive Help page with interactive examples of all CRUD operations, toast notification demonstrations, and complete feature documentation
- June 16, 2025. Implemented interactive API Reference tab with Swagger-like functionality including editable JSON payloads, customizable resource IDs, and real-time API testing capabilities
- June 16, 2025. Implemented complete email accounts management system with PostgreSQL database integration
- June 16, 2025. Created email_accounts table with SMTP/IMAP configuration fields, security settings, and sync preferences
- June 16, 2025. Built EmailAccounts page with single-column card layout (1 card per line) as requested by user
- June 16, 2025. Added CRUD operations for email accounts with real-time WebSocket synchronization and toast notifications
- June 16, 2025. Integrated email accounts navigation item and populated database with 3 sample accounts (SMTP, Gmail, Outlook)
- June 16, 2025. Fixed sidebar navigation icons by adding missing imports (HelpCircle, Mail, Headphones) to iconMap
- June 16, 2025. Implemented system monitoring dashboard with CPU gauge, RAM/Storage/Swap progress bars at top of homepage
- June 16, 2025. Created animated CPU gauge with color-coded status (green/yellow/red) and real-time updates every 5 seconds
- June 16, 2025. Added system information panel showing uptime, platform, Node.js version, and last update timestamp
- June 16, 2025. Completely redesigned Help page with sidebar navigation organized by categories (clientes, produtos, fornecedores, vendas, suporte, email, sistema)
- June 16, 2025. Implemented VS Code-style JSON editor with syntax highlighting, line numbers, and window controls (red/yellow/green buttons)
- June 16, 2025. Created interactive API testing interface with real-time execution, result display, and downloadable responses in JSON/TXT formats
- June 16, 2025. Enhanced API documentation with color-coded HTTP method badges, editable resource IDs, and comprehensive endpoint coverage
- June 16, 2025. Implemented complete database administration system with full CRUD operations for all tables
- June 16, 2025. Added "Admin DB" navigation item with Database icon and comprehensive data management interface
- June 16, 2025. Created user management APIs (/api/users) with create, read, update, delete operations
- June 16, 2025. Fixed dashboard data counters to show real database statistics (clients, products, sales, suppliers, support tickets)
- June 16, 2025. Corrected data access in dashboard to display authentic counts from PostgreSQL database
- June 16, 2025. Implemented comprehensive user profile management system with tabbed interface (Perfil, Endereço, Permissões)
- June 16, 2025. Created UserProfile page with React Tabs component for organized data management
- June 16, 2025. Added profile editing capabilities with personal information, phone, biography, and avatar URL fields
- June 16, 2025. Implemented address management with complete Brazilian address structure (street, number, neighborhood, city, state, CEP)
- June 16, 2025. Added permissions visualization tab showing user access rights for each system module with color-coded badges
- June 16, 2025. Created user profile and address APIs (/api/users/:id, /api/users/:id/address) with PUT methods for updates
- June 16, 2025. Added "Perfil" navigation item with User icon and integrated profile page routing at /user-profile
- June 16, 2025. Implemented granular CRUD-based permissions system with 30+ module-specific permissions
- June 16, 2025. Organized permissions by functional categories (Páginas Principais, Gestão de Produtos, Gestão de Vendas, Sistema de Suporte, Administração, Funcionalidades do Sistema)
- June 16, 2025. Enhanced permissions interface with categorized display showing specific CRUD operations for each module
- June 16, 2025. Added detailed permissions for sub-modules including categories, manufacturers, product groups, sale items, support tickets, and system functionalities
- June 16, 2025. Integrated "Perfil" link in user dropdown menu in header for easy access to profile management
- June 16, 2025. Fixed API request parameter ordering issue in permission mutations (PUT method first, URL second, data third)
- June 16, 2025. Made user profile page fully responsive with adaptive layout for mobile (1 column), tablet (2 columns), and desktop (4 columns)
- June 16, 2025. Enhanced tab navigation with responsive text labels (abbreviated on mobile, full on desktop)
- June 16, 2025. Optimized permission badges and grid layout for mobile devices with smaller text and spacing
- June 16, 2025. Verified clickable permission badges working correctly with automatic saving and real-time updates
- June 16, 2025. Implemented automatic mail_accounts.cf file generation for Postfix integration
- June 16, 2025. Added SHA512 password hashing in base64 format compatible with Postfix authentication
- June 16, 2025. File automatically updated on email account create, edit, delete operations in format: email@domain|{SHA512}base64hash
- June 16, 2025. Generated initial mail_accounts.cf file on server startup with existing email accounts
- June 16, 2025. Implemented complete Docker containers management system with PostgreSQL backend integration
- June 16, 2025. Created docker_containers table with comprehensive fields (ports, volumes, environment, CPU/memory limits)
- June 16, 2025. Built responsive Docker page with 3 cards per row layout and custom Docker SVG icon
- June 16, 2025. Added full CRUD operations and container control (start, stop, restart, pause) with real-time WebSocket updates
- June 16, 2025. Created 6 sample containers (nginx, mysql, redis, node, postgres, mongodb) with realistic configurations
- June 16, 2025. Added "Docker" navigation item with Container icon to sidebar
- June 16, 2025. Optimized control buttons to display only icons (play, stop, restart, pause) with tooltips for compact interface
- June 16, 2025. Implemented dynamic environment variables management in Docker container forms
- June 16, 2025. Added ability to add, update, and delete environment variables with key-value pairs interface
- June 16, 2025. Environment variables automatically loaded when editing existing containers and properly saved to database
- June 16, 2025. Created comprehensive tabbed interface for Docker container forms with three organized sections (Informações, Variáveis, Volumes)
- June 16, 2025. Implemented complete volume mapping management with host:container path configuration in Docker forms
- June 16, 2025. Enhanced Docker container editing with improved UX including empty state messages and better organization
- June 16, 2025. Restored complete Help page with all previous sections: Documentation, Interactive Examples, and API Reference
- June 16, 2025. Maintained comprehensive help system with VS Code-style API testing interface and complete feature documentation
- June 16, 2025. Enhanced sidebar collapsed state with larger icons (w-7 h-7), better spacing (px-2 py-3), and increased width (w-24)
- June 16, 2025. Improved sidebar icon visibility and organization when collapsed for better user experience
- June 16, 2025. Created comprehensive Webhooks configuration tab in Help page with complete event management system
- June 16, 2025. Implemented webhook interface with URL configuration, 20+ categorized events, payload examples, security settings, and testing capabilities
- June 16, 2025. Added webhook events for all system modules: clients, products, sales, support, system, and Docker containers
- June 16, 2025. Implemented functional webhook system with select dropdown for 20 different event types and realistic payload examples
- June 16, 2025. Added VS Code-style response viewer with JSON formatting, window controls, and complete request/response details
- June 16, 2025. Created HMAC SHA256 signature generation system with automatic X-Hub-Signature header injection
- June 16, 2025. Built 64-character secret key generator with show/hide toggle functionality for enhanced security
- June 16, 2025. Implemented individual header management system replacing JSON textarea with key-value pair interface
- June 16, 2025. Added automatic Content-Type header creation and protected header system (Content-Type, X-Hub-Signature)
- June 16, 2025. Integrated localStorage persistence for webhook configurations and custom headers with auto-loading functionality
- June 16, 2025. Created comprehensive user preferences system with PostgreSQL backend integration
- June 16, 2025. Implemented functional sidebar configuration dropdown with theme controls, color customization, and sidebar toggle
- June 16, 2025. Added user_preferences table with fields for sidebar state, colors (sidebar, header, primary), and auto-collapse settings
- June 16, 2025. Built interactive color selection submenus with visual color indicators and checkmarks for active selections
- June 16, 2025. Integrated automatic preference saving to user account with toast notifications and WebSocket synchronization
- June 16, 2025. Enhanced webhook system to automatically populate X-Hub-Signature header with generated secret key (without sha256= prefix)
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
Interface language: Portuguese for user-facing elements
Theme preference: System default with manual toggle capability
```