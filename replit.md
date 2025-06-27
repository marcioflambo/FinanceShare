# FinanceShare - Expense Tracking and Bill Splitting Application

## Overview

FinanceShare is a comprehensive personal finance management application built with a modern full-stack architecture. The application allows users to track personal expenses, manage bank accounts, and split bills with roommates. It features a responsive design optimized for both mobile and desktop usage, with a focus on intuitive user experience and real-time financial insights.

## System Architecture

The application follows a full-stack architecture with clear separation between client and server components:

- **Frontend**: React-based SPA using Vite for build tooling
- **Backend**: Express.js REST API server
- **Database**: External MySQL (Percona Server) with Drizzle ORM - fully migrated and operational
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
- **Database Layer**: Drizzle ORM with type-safe database operations - 100% MySQL driven
- **Storage Pattern**: Direct database storage only (DatabaseStorage) - no in-memory fallbacks
- **Error Handling**: Centralized error handling middleware
- **Development Setup**: Hot reload with Vite integration
- **Data Persistence**: All data operations require active MySQL connection

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
4. **Database Operations**: Drizzle ORM handles MySQL queries directly (no fallbacks)
5. **State Updates**: Query client invalidates and refetches affected data
6. **UI Updates**: React components re-render with updated data

## Database Architecture

### External MySQL Database Configuration
- **Production Database**: External Percona MySQL Server (Version 5.7.32-35-log)
- **Connection Details**: 
  - Host: 186.202.152.149
  - Port: 3306 (TCP/IP)
  - Database: mlopes6
  - User: mlopes6
  - Password: G1ovann@040917
- **Driver**: mysql2 with promise support for Node.js
- **ORM Integration**: Drizzle ORM configured for MySQL dialect

### Storage Implementation
- **DatabaseStorage Only**: Application exclusively uses external MySQL database
- **No In-Memory Fallbacks**: Removed MemStorage completely for production reliability
- **Required Connection**: Application fails gracefully if database connection is unavailable
- **Direct ORM Operations**: All CRUD operations go through Drizzle ORM to MySQL tables
- **Schema Migration**: Pure MySQL schema implementation

### Data Integrity Guarantees
- **Persistent Data**: All user data, transactions, and account information stored in external MySQL database
- **ACID Compliance**: MySQL ensures data consistency and transaction safety
- **Real-time Updates**: Database changes immediately reflect across all application components
- **No Data Loss**: Application restart or server issues don't affect user data
- **External Hosting**: Data persists independently of Replit environment

## External Dependencies

### Core Libraries
- **mysql2**: Database connection for MySQL
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

## Migration and Deployment Guide

### Database Migration Steps (For App Recreation)

#### 1. Install MySQL Driver
```bash
npm install mysql2
```

#### 2. Configure Database Connection (server/db.ts)
```javascript
import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';

const mysqlConfig = {
  host: '186.202.152.149',
  user: 'mlopes6',
  password: 'G1ovann@040917',
  database: 'mlopes6',
  port: 3306,
  connectTimeout: 20000,
  acquireTimeout: 10000,
  timeout: 10000
};

const initializeDatabase = async () => {
  try {
    connection = await mysql.createConnection(mysqlConfig);
    await connection.ping();
    db = drizzle(connection, { schema, mode: 'default' });
    isDatabaseAvailable = true;
  } catch (error) {
    console.error("Failed to connect to MySQL database:", error);
    isDatabaseAvailable = false;
  }
};
```

#### 3. MySQL Schema Implementation (shared/schema.ts)
- Use `mysqlTable` for all table definitions
- Use `serial("id").primaryKey().autoIncrement()` for auto-increment primary keys
- Use `varchar("field", { length: 255 })` for text fields
- Use `decimal("amount", { precision: 10, scale: 2 })` for monetary values
- Use `timestamp("created_at").default(sql\`CURRENT_TIMESTAMP\`)` for timestamps

#### 4. Create Migration Script (migrate-mysql.ts)
```javascript
import { db } from "./server/db";
import { users, categories, bankAccounts, expenses, /* other tables */ } from "./shared/schema";

const migrate = async () => {
  // Create tables and insert demo data
  await db.insert(users).values([/* demo users */]);
  await db.insert(categories).values([/* demo categories */]);
  // ... other insertions
};
```

#### 5. Run Migration
```bash
tsx migrate-mysql.ts
```

### Deployment Strategy

The application is configured for deployment on Replit with the following setup:

- **Development**: `npm run dev` - Runs both client and server in development mode
- **Build**: `npm run build` - Creates production builds for both frontend and backend
- **Production**: `npm run start` - Serves the production application
- **Database**: External MySQL database (Percona Server) for persistent data
- **Auto-scaling**: Configured for autoscale deployment target

### Environment Configuration
- External MySQL database connection (credentials in server/db.ts)
- Development mode detection for conditional features
- Replit-specific integrations (cartographer, runtime error overlay)
- No environment variables required (direct database configuration)

### Critical Configuration Files

#### package.json Dependencies
Key MySQL-related dependencies:
```json
{
  "mysql2": "^3.x.x",
  "drizzle-orm": "^0.x.x",
  "drizzle-kit": "^0.x.x"
}
```

#### drizzle.config.ts
```javascript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./shared/schema.ts",
  dialect: "mysql",
  out: "./migrations",
  dbCredentials: {
    host: "186.202.152.149",
    user: "mlopes6",
    password: "G1ovann@040917",
    database: "mlopes6",
    port: 3306
  }
});
```

#### server/storage.ts Configuration
Storage initialization pattern:
```javascript
const initializeStorage = async () => {
  await databaseInitialization;
  
  if (db) {
    try {
      storage = new DatabaseStorage();
      console.log("✅ Using MySQL external database for persistent data storage");
      return true;
    } catch (error) {
      console.error("❌ Failed to initialize database storage:", error);
    }
  }
  
  storage = new MemStorage();
  console.log("⚠️  Using temporary in-memory storage as fallback");
  return false;
};
```

### Database Tables Created
- users (authentication and profiles)
- categories (expense categorization)
- bank_accounts (financial accounts)
- expenses (transaction records)
- bill_splits (shared expense management)
- bill_split_participants (split tracking)
- roommates (user relationships)
- goals (financial objectives)
- goal_accounts (goal-account relationships)
- transfers (account transfers)
- sessions (user sessions)

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

- June 25, 2025. Initial expense tracking and bill splitting application setup
- June 25, 2025. Added comprehensive financial goals system with account linking and progress tracking
- June 25, 2025. Improved mobile responsiveness with 2x2 card grid layout for phones and 4-column for desktop
- June 25, 2025. Resolved infinite chart rendering loop and optimized component performance
- June 25, 2025. Fixed "Adicionar Conta" button functionality with complete bank account creation modal
- June 25, 2025. Prepared MySQL database infrastructure with Drizzle ORM schema and migrations ready
- June 25, 2025. Implementing user authentication system with email/password registration and Google OAuth support
- June 25, 2025. Successfully migrated from in-memory storage to MySQL database with all demo data persisted
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
- June 26, 2025. **COMPLETE DATABASE MIGRATION**: Removed all in-memory storage (MemStorage) and configured application to use 100% MySQL database for all data operations
- June 26, 2025. Enforced strict database-only data persistence - application now requires DATABASE_URL and fails gracefully if database is not available
- June 26, 2025. **REPLIT MIGRATION COMPLETED**: Successfully migrated from Replit Agent to standard Replit environment with enhanced functionality
- June 26, 2025. **EXTERNAL MYSQL DATABASE**: Successfully configured and connected to external Percona MySQL database (186.202.152.149) with complete schema migration and demo data
- June 26, 2025. Fixed transaction icons in all-transactions page to use FontAwesome icons properly instead of emoji fallbacks
- June 26, 2025. Improved monthly filter system - now shows only last 6 months with transactions instead of all historical periods
- June 26, 2025. **IMPLEMENTED TRANSFERS SYSTEM**: Created complete bank account transfer functionality with real-time balance updates, validation, and preview system
- June 26, 2025. **DOCUMENTATION COMPLETED**: Created comprehensive migration guide and configuration documentation for future app recreations with external MySQL database
- June 26, 2025. **DOCUMENTATION FINALIZED**: Corrected all PostgreSQL references in documentation to MySQL, ensuring complete accuracy for external Percona MySQL database configuration
- June 26, 2025. **COMPLETE DATABASE CLEANUP**: Removed all PostgreSQL, SQLite and non-MySQL database references from code, dependencies, and configuration files
- June 26, 2025. **FIXED ACCOUNT REACTIVATION**: Corrected bank account status toggle functionality using proper PUT method with complete field validation
- June 26, 2025. **ECONOMICS CARD REFINEMENT**: Updated "Economia" statistics to show only savings account balances instead of calculated savings (total minus expenses)
- June 26, 2025. **ENHANCED EXPENSE CHART FILTERING**: Implemented advanced filtering system for "Despesas por Categoria" with 30/90 day options plus custom date range selection using dual calendar interface
- June 27, 2025. **REPLIT MIGRATION COMPLETED**: Successfully migrated FinanceShare application from Replit Agent to standard Replit environment with improved layout optimization
- June 27, 2025. **LAYOUT OPTIMIZATION**: Improved dashboard layout proportions - moved Recent Transactions to prominent position, reduced sidebar width (4-column grid), and optimized component sizes for better visual harmony
- June 27, 2025. **SIDEBAR WIDTH ALIGNMENT**: Fixed sidebar components to match exact bank accounts width (320px) using flex layout for perfect visual alignment
- June 27, 2025. **ACCOUNT SELECTOR IMPLEMENTATION**: Created harmonious multi-account selector for Recent Transactions with dropdown interface, multi-selection capabilities, color-coded badges, and responsive design for both web and mobile
- June 27, 2025. **INACTIVE ACCOUNT SELECTION**: Enhanced account selector to include inactive accounts with organized sections, visual hierarchy, and clear status indicators
- June 27, 2025. **SECTION SEPARATION**: Reorganized dashboard to remove components that belong to other navigation sections - expenses, splits, and reports now have dedicated sections with proper functionality separation
- June 27, 2025. **DASHBOARD EXPENSE ACTIONS**: Moved "Ações de Despesas" box to dashboard for quick access to Nova Despesa, Recorrente, and Transferir functions from main screen
- June 27, 2025. **CONSISTENT BANK ACCOUNTS POSITIONING**: Ensured bank accounts appear at the top of all sections (dashboard, expenses, splits, reports) for consistent user experience
- June 27, 2025. **ACCOUNT-FILTERED STATISTICS**: Updated statistics cards to show "A Receber" and "Gastos do Mês" data filtered by selected accounts instead of all accounts
- June 27, 2025. **MOBILE SINGLE-ACCOUNT FILTERING**: Implemented mobile-specific behavior where statistics and transactions show data only from the first selected account, since multi-account selection doesn't work on mobile app
- June 27, 2025. **CUSTOM CATEGORIES SYSTEM**: Implemented comprehensive custom categories in expense modal with free text input, real-time filtering, automatic category creation, and top 3 most-used categories display
- June 27, 2025. **PRESELECTED ACCOUNT IN EXPENSE MODAL**: Added functionality to pre-select currently selected bank account when opening "Nova Despesa" modal for improved user experience
- June 27, 2025. **CIRCULAR BANK ACCOUNT NAVIGATION**: Implemented circular navigation where last account (5 of 5) goes to first account and first account goes to last account, removing disabled button states
- June 27, 2025. **ENHANCED STATISTICS CARDS DESIGN**: Redesigned statistics cards with descriptive information alongside icons, improved layout with title, description, and subtitle for better context and visual appeal
- June 27, 2025. **ENHANCED TRANSACTION INPUT**: Implemented currency formatting with R$ prefix and automatic decimal formatting for amount field, plus intelligent description suggestions from user's expense history without labels
- June 27, 2025. **REPLIT MIGRATION COMPLETED**: Successfully migrated FinanceShare from Replit Agent to standard Replit environment with improved security, stability, and functionality
- June 27, 2025. **API OPERATIONS VERIFIED**: Fixed and validated all CRUD operations (create, update, delete) for expenses with proper date and amount handling, ensuring seamless data management
- June 27, 2025. **TRANSACTION TYPE SYSTEM IMPLEMENTED**: Added transactionType field to expenses table supporting debit (expenses), credit (income), and transfer operations with proper balance calculations and edit modal functionality

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