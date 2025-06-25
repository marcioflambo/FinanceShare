# FinanceShare - Expense Tracking and Bill Splitting Application

## Overview

FinanceShare is a comprehensive personal finance management application built with a modern full-stack architecture. The application allows users to track personal expenses, manage bank accounts, and split bills with roommates. It features a responsive design optimized for both mobile and desktop usage, with a focus on intuitive user experience and real-time financial insights.

## System Architecture

The application follows a full-stack architecture with clear separation between client and server components:

- **Frontend**: React-based SPA using Vite for build tooling
- **Backend**: Express.js REST API server
- **Database**: PostgreSQL with Drizzle ORM (migrated from in-memory storage)
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
- **Database Layer**: Drizzle ORM with type-safe database operations
- **Storage Pattern**: Interface-based storage abstraction for testability
- **Error Handling**: Centralized error handling middleware
- **Development Setup**: Hot reload with Vite integration

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
4. **Database Operations**: Drizzle ORM handles PostgreSQL queries
5. **State Updates**: Query client invalidates and refetches affected data
6. **UI Updates**: React components re-render with updated data

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
- June 25, 2025. Migrated from in-memory storage to PostgreSQL database with complete data persistence
- June 25, 2025. Implementing user authentication system with email/password registration and Google OAuth support

## Key Features

### Financial Goals System
- **Goal Creation**: Users can create custom financial goals with target amounts and dates
- **Account Linking**: Goals can be linked to multiple bank accounts for automatic progress calculation
- **Progress Tracking**: Real-time calculation of goal completion based on selected account balances
- **Goal Presets**: Quick templates for common goals (travel, emergency fund, electronics, etc.)
- **Visual Progress**: Color-coded progress bars and completion indicators

### Expense Management
- **Quick Expense Entry**: Floating action button and modal for rapid expense recording
- **Category Management**: Icon and color-coded expense categories
- **Transaction History**: Chronological listing of recent transactions with account details
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