# FinanceShare - Expense Tracking and Bill Splitting Application

## Overview

FinanceShare is a comprehensive personal finance management application built with a modern full-stack architecture. The application allows users to track personal expenses, manage bank accounts, and split bills with roommates. It features a responsive design optimized for both mobile and desktop usage, with a focus on intuitive user experience and real-time financial insights.

## System Architecture

The application follows a full-stack architecture with clear separation between client and server components:

- **Frontend**: React-based SPA using Vite for build tooling
- **Backend**: Express.js REST API server
- **Database**: PostgreSQL with Drizzle ORM - fully migrated and operational
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for client-side routing

## Key Components

### Frontend Architecture
- **Component Library**: shadcn/ui components for consistent UI design
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **Form Handling**: React Hook Form with Zod validation
- **Data Fetching**: TanStack Query for caching and synchronization
- **Responsive Design**: Mobile-first approach with 2x2 card grid on mobile, 4-column on desktop

### Backend Architecture
- **API Design**: RESTful endpoints following conventional patterns
- **Database Layer**: Drizzle ORM with type-safe database operations - 100% PostgreSQL driven
- **Storage Pattern**: Direct database storage only (DatabaseStorage) - no in-memory fallbacks
- **Error Handling**: Centralized error handling middleware
- **Development Setup**: Hot reload with Vite integration
- **Data Persistence**: All data operations require active PostgreSQL connection

### Database Schema
- **Users**: Basic user authentication and profile management
- **Categories**: Expense categorization with icons and colors
- **Bank Accounts**: Multiple account types (checking, savings, credit)
- **Expenses**: Transaction records with category and account references
- **Bill Splits**: Shared expense management with participant tracking
- **Roommates**: User relationship management for bill splitting
- **Goals**: Financial goal tracking with target amounts and progress monitoring
- **Goal Accounts**: Many-to-many relationship linking goals to specific bank accounts

## Data Flow

1. **User Interactions**: UI components trigger actions through event handlers
2. **Form Validation**: Client-side validation using Zod schemas
3. **API Requests**: TanStack Query manages HTTP requests to Express endpoints
4. **Database Operations**: Drizzle ORM handles PostgreSQL queries directly (no fallbacks)
5. **State Updates**: Query client invalidates and refetches affected data
6. **UI Updates**: React components re-render with updated data

## Database Architecture

### Storage Implementation
- **DatabaseStorage Only**: Application exclusively uses PostgreSQL database
- **No In-Memory Fallbacks**: Removed MemStorage completely for production reliability
- **Required Connection**: Application fails gracefully if DATABASE_URL is unavailable
- **Direct ORM Operations**: All CRUD operations go through Drizzle ORM to PostgreSQL tables

### Data Integrity Guarantees
- **Persistent Data**: All user data, transactions, and account information stored in database
- **ACID Compliance**: PostgreSQL ensures data consistency and transaction safety
- **Real-time Updates**: Database changes immediately reflect across all application components
- **No Data Loss**: Application restart or server issues don't affect user data

## External Dependencies

### Core Libraries
- **@neondatabase/serverless**: Database connection for PostgreSQL
- **drizzle-orm**: Type-safe database ORM
- **@tanstack/react-query**: Data fetching and caching
- **@hookform/resolvers**: Form validation integration
- **date-fns**: Date manipulation utilities

### UI Components
- **@radix-ui/***: Headless UI primitives for accessibility
- **class-variance-authority**: Component variant management
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library

### Development Tools
- **vite**: Fast build tool and development server
- **tsx**: TypeScript execution for development
- **esbuild**: Fast JavaScript bundler for production

## Deployment Strategy

The application is configured for deployment on Replit with the following setup:

- **Development**: `npm run dev` - Runs both client and server in development mode
- **Build**: `npm run build` - Creates production builds for both frontend and backend
- **Production**: `npm run start` - Serves the production application
- **Database**: PostgreSQL module configured in Replit environment
- **Auto-scaling**: Configured for autoscale deployment target

### Environment Configuration
- Database connection via `DATABASE_URL` environment variable
- Development mode detection for conditional features
- Replit-specific integrations (cartographer, runtime error overlay)

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

- June 25, 2025. Initial expense tracking and bill splitting application setup
- June 25, 2025. Added comprehensive financial goals system with account linking and progress tracking
- June 25, 2025. Improved mobile responsiveness with 2x2 card grid layout for phones and 4-column for desktop
- June 25, 2025. Resolved infinite chart rendering loop and optimized component performance
- June 25, 2025. Fixed "Adicionar Conta" button functionality with complete bank account creation modal
- June 25, 2025. Prepared PostgreSQL database infrastructure with Drizzle ORM schema and migrations ready
- June 25, 2025. Implementing user authentication system with email/password registration and Google OAuth support
- June 25, 2025. Successfully migrated from in-memory storage to PostgreSQL database with all demo data persisted
- June 25, 2025. Implemented active/inactive status for bank accounts - inactive accounts don't count in total balance but can still be used in financial goals
- June 26, 2025. Redesigned bank accounts section with compact layout - horizontal navigation with arrows on desktop, swipe navigation on mobile
- June 26, 2025. Added "Soma das Contas Ativas" statistics card showing real-time sum of active accounts only
- June 26, 2025. Added "Contas Ativas" card, removed "Saldo Total" card, removed last 4 digits display from bank accounts for cleaner interface
- June 26, 2025. Created comprehensive fake data for testing: expenses across categories, bill splits with pending payments, roommates, and financial goals with account linking - dashboard metrics now update dynamically with real transaction data
- June 26, 2025. Implemented proper active/inactive account filtering: dashboard statistics only count active accounts while inactive accounts remain visible with status indicators for easy reactivation
- June 26, 2025. Repositioned account status indicators to balance line to maintain consistent card height and prevent visual jumping between active/inactive accounts
- June 26, 2025. Added advanced transaction search and filtering system: month/year dropdown selection and real-time text search by description, category, or account name with live result counting and filter clearing
- June 26, 2025. Fixed application startup issues and server stability problems
- June 26, 2025. Restored missing inactive bank accounts functionality with reactivation feature in dropdown menu
- June 26, 2025. **COMPLETE DATABASE MIGRATION**: Removed all in-memory storage (MemStorage) and configured application to use 100% PostgreSQL database for all data operations
- June 26, 2025. Enforced strict database-only data persistence - application now requires DATABASE_URL and fails gracefully if database is not available

## Key Features

### Financial Goals System
- **Goal Creation**: Users can create custom financial goals with target amounts and dates
- **Account Linking**: Goals can be linked to multiple bank accounts for automatic progress calculation
- **Progress Tracking**: Real-time calculation of goal completion based on selected account balances
- **Goal Presets**: Quick templates for common goals (travel, emergency fund, electronics, etc.)
- **Visual Progress**: Color-coded progress bars and completion indicators

### Bank Account Management
- **Active/Inactive Status**: Accounts can be marked as active or inactive with toggle functionality
- **Selective Balance Calculation**: Only active accounts contribute to total balance statistics
- **Flexible Goal Integration**: Both active and inactive accounts can be linked to financial goals
- **Visual Status Indicators**: Clear labeling of inactive accounts throughout the interface
- **Account Reactivation**: Dropdown menu option to reactivate inactive accounts instantly
- **Navigation**: Horizontal arrow navigation on desktop, swipe gestures on mobile
- **Account Ordering**: Drag-and-drop organization with persistent sort order
- **Complete CRUD Operations**: Create, edit, deactivate, reactivate, and delete accounts

### Expense Management
- **Quick Expense Entry**: Floating action button and modal for rapid expense recording
- **Category Management**: Icon and color-coded expense categories
- **Transaction History**: Chronological listing of recent transactions with account details
- **Advanced Search & Filtering**: 
  - Month/year dropdown selection for period filtering
  - Real-time text search across descriptions, categories, and account names
  - Live result counting and filter status display
  - One-click filter clearing functionality
- **Visual Analytics**: Pie chart showing expense distribution by category

### Bill Splitting
- **Roommate Management**: Add and manage roommates for shared expenses
- **Equal Split**: Automatic equal division or custom amount allocation
- **Payment Tracking**: Mark participants as paid/unpaid with timestamp tracking
- **Multi-participant**: Support for complex splits across multiple people

### Responsive Design
- **Mobile-first**: 2-column card layout on mobile devices for better space utilization
- **Progressive Enhancement**: Expands to 4-column layout on larger screens
- **Touch-friendly**: Optimized button sizes and interaction areas for mobile use