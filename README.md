# ACH Processing System

A production-ready secure cloud system for processing ACH transactions with NACHA file generation and SFTP transmission capabilities.

## Features

- **ACH Transaction Processing**: Accept and process ACH transactions with full encryption
- **NACHA File Generation**: Create NACHA-compliant files for DR and CR transactions
- **Business Day Calculations**: Federal holiday support with automatic business day calculations
- **SFTP/FTP Transmission**: Secure file transmission capabilities
- **Role-Based Access Control**: Admin, Operator, and Viewer roles
- **Encryption**: AES-256 encryption for sensitive data
- **Modern UI**: React/Next.js frontend with responsive design

## Tech Stack

### Backend
- **Framework**: Node.js with Express and TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT with role-based access control
- **Encryption**: AES-256 for sensitive data
- **File Generation**: NACHA-compliant ACH file generation
- **Hosting**: Railway (recommended)

### Frontend
- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Headless UI
- **Icons**: Heroicons
- **State Management**: React Context API
- **Forms**: React Hook Form with Zod validation
- **Hosting**: Vercel (recommended)

### Database
- **Type**: PostgreSQL via Supabase
- **Features**: Row Level Security (RLS), real-time subscriptions
- **Encryption**: Sensitive data encrypted before storage

## Quick Start

1. **Setup Backend**: Navigate to `backend/` directory, install dependencies, configure environment
2. **Setup Database**: Run the SQL schema in `database/schema.sql` on Supabase
3. **Setup Frontend**: Navigate to `frontend/` directory, install dependencies, configure environment
4. **Demo Access**: Use `admin@achprocessing.com` / `admin123` to login

See full documentation in the `docs/` directory for detailed setup instructions.

## Railway Deployment

This system is configured for easy deployment on Railway's free tier:

### Quick Deploy to Railway

1. **Connect Repository**: Go to [Railway](https://railway.app), create a new project, and connect this GitHub repository
2. **Configure Environment Variables**: Set the following in Railway's environment settings:
   ```
   NODE_ENV=production
   PORT=3001
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   FRONTEND_URL=https://your-frontend-domain.vercel.app
   JWT_SECRET=your_very_long_random_jwt_secret_key_here
   ENCRYPTION_KEY=your_32_character_encryption_key_here
   ACH_IMMEDIATE_DESTINATION=123456789
   ACH_IMMEDIATE_ORIGIN=987654321
   ACH_COMPANY_NAME=Your Company Name
   ACH_COMPANY_ID=1234567890
   ```
3. **Deploy**: Railway will automatically build and deploy your backend
4. **Health Check**: Verify deployment at `https://your-app.railway.app/health`

### Prerequisites
- [Supabase](https://supabase.com) account (free tier available)
- [Railway](https://railway.app) account (free tier available)
- GitHub repository connected to Railway

See `docs/DEPLOYMENT.md` for complete deployment instructions including frontend setup on Vercel.

## Architecture

The system follows a modern three-tier architecture with React frontend, Express API backend, and PostgreSQL database, designed for scalability and security in processing ACH transactions and generating NACHA-compliant files.
