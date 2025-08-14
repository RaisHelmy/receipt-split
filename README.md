# Bill Manager - Receipt Split Application

A modern React web application for managing bills and splitting costs among multiple people. Built with Next.js, TypeScript, Tailwind CSS, Prisma, and SQLite.

## Features

- **User Authentication**: Sign up and sign in functionality with secure password hashing
- **Bill Management**: Create, view, and manage bills with items
- **Public Bills**: Make bills public and share them via unique links for anonymous viewing
- **Item Assignment**: Assign items to specific people and track payment status
- **Cost Calculation**: Automatic calculation of service charges, taxes, and discounts
- **Real-time Updates**: Live updates to bill totals and payment status
- **Responsive Design**: Built with Tailwind CSS using Preline components

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: SQLite with Prisma ORM
- **Authentication**: JWT-based authentication with httpOnly cookies
- **Password Security**: bcryptjs for password hashing

## Database Schema

- **Users**: User accounts with email and password
- **Bills**: Bill information with public/private settings and share tokens
- **Bill Items**: Individual items within bills with quantities and amounts
- **Item Assignments**: Assignment of items to specific people

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up the database**:
   ```bash
   npx prisma generate
   npx prisma db push
   ```

3. **Set up environment variables** (`.env`):
   ```
   DATABASE_URL="file:./dev.db"
   NEXTAUTH_SECRET="your-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Open your browser** and go to `http://localhost:3000`

## Usage

1. **Sign Up/Sign In**: Create an account or sign in to an existing one
2. **Create a Bill**: Click "Create New Bill" and optionally make it public
3. **Add Items**: Add items with names, amounts, and quantities
4. **Assign Items**: Assign items to people by entering their names
5. **Track Payments**: Mark items as paid and verified
6. **Share Bills**: Public bills can be shared via generated links for anonymous viewing
7. **Calculate Totals**: Automatic calculation of service charges, taxes, and final totals

## API Routes

- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/signin` - Sign in user
- `POST /api/auth/signout` - Sign out user
- `GET /api/auth/me` - Get current user info
- `GET /api/bills` - Get user's bills
- `POST /api/bills` - Create new bill
- `GET /api/bills/[id]` - Get specific bill
- `PATCH /api/bills/[id]` - Update bill settings
- `POST /api/bills/[id]/items` - Add item to bill
- `PATCH /api/bills/[id]/items/[itemId]` - Update item assignment/status

## Public Bill Sharing

Bills can be made public during creation and accessed anonymously via share links in the format:
`/shared/[shareToken]`

## Security Features

- Passwords are hashed using bcryptjs
- JWT tokens stored in httpOnly cookies
- User authentication required for all bill operations
- Public bills only accessible via share tokens when enabled

## Development

The application uses:
- Turbopack for fast development builds
- TypeScript for type safety
- Prisma for database operations
- Tailwind CSS for styling
- Next.js App Router for routing
