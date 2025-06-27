# FinanceShare

A comprehensive personal finance management application for expense tracking and bill splitting.

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Start the application:
```bash
npm run dev
```

3. Open your browser to `http://localhost:5000`

## Features

- **Expense Tracking**: Record and categorize personal expenses
- **Bank Account Management**: Manage multiple accounts with real-time balances
- **Bill Splitting**: Share expenses with roommates and track payments
- **Financial Goals**: Set and track progress toward financial objectives
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Express.js + TypeScript
- **Database**: MySQL with Drizzle ORM
- **UI Components**: shadcn/ui + Radix UI
- **State Management**: TanStack Query

## Architecture

The application follows a clean separation between client and server:

- `client/` - Frontend React application
- `server/` - Backend Express API
- `shared/` - Shared TypeScript schemas and types

## Development

The application uses a single development server that runs both frontend and backend:

```bash
npm run dev
```

This starts:
- Express server on port 5000
- Vite development server integrated with Express
- Hot reload for both frontend and backend changes

## Database

The application uses an external MySQL database with the following configuration:
- Full MySQL schema with Drizzle ORM
- Persistent data storage
- Optimized balance calculations with caching

For detailed technical documentation, see `replit.md`.