# ACH Processing System
A secure cloud-based ACH (Automated Clearing House) processing system built with modern web technologies. This system provides a comprehensive solution for managing ACH transactions, generating NACHA-compliant files, and handling secure financial data processing.

## 🏗️ Architecture

### Backend (Railway)
- **Node.js + Express.js** with TypeScript
- **Supabase** for PostgreSQL database with Row Level Security
- **JWT Authentication** with role-based access control
- **AES Encryption** for sensitive data (account numbers)
- **NACHA File Generation** with business day calculations
- **SFTP/FTP Support** for file transmission
- **Comprehensive Logging** with Winston

### Frontend (Vercel)
- **Next.js 14** with React 18 and TypeScript
- **Tailwind CSS** for responsive UI design
- **React Query** for efficient data fetching
- **React Hook Form** for form validation
- **Headless UI** for accessible components

### Database (Supabase)
- **PostgreSQL** with Row Level Security policies
- **Encrypted storage** for sensitive financial data
- **Audit trails** for all transactions
- **Real-time subscriptions** capability

## 🚀 Features

### Core Functionality
- ✅ **ACH Transaction Management** - Create, view, and manage ACH transactions
- ✅ **NACHA File Generation** - Generate compliant ACH files with proper formatting
- ✅ **Business Day Calculations** - Automatic handling of weekends and federal holidays
- ✅ **Secure Data Handling** - AES encryption for account numbers and sensitive data
- ✅ **Role-Based Access Control** - Admin, Operator, and Viewer roles
- ✅ **Real-time Dashboard** - Live transaction monitoring and statistics

### Security Features
- 🔒 **JWT Authentication** with secure token management
- 🔒 **Data Encryption** for sensitive financial information
- 🔒 **Row Level Security** in database
- 🔒 **Input Validation** and sanitization
- 🔒 **Audit Logging** for all operations

### Compliance & Standards
- 📋 **NACHA Compliance** - Full ACH file format compliance
- 📋 **Federal Holiday Management** - Configurable holiday calendar
- 📋 **Transaction Validation** - Routing number and account validation
- 📋 **Error Handling** - Comprehensive error tracking and reporting

### Reporting & Analytics
- 📊 **Daily Summaries** - Transaction counts and amounts by day
- 📊 **Monthly Reports** - Aggregate statistics and trends
- 📊 **Export Capabilities** - CSV export for external analysis
- 📊 **User Activity Tracking** - Monitor system usage

## 🛠️ Technology Stack

### Backend Dependencies
```json
{
  "express": "^4.18.2",
  "@supabase/supabase-js": "^2.38.4",
  "jsonwebtoken": "^9.0.2",
  "bcryptjs": "^2.4.3",
  "crypto-js": "^4.2.0",
  "joi": "^17.11.0",
  "winston": "^3.11.0",
  "ssh2-sftp-client": "^10.0.3",
  "moment": "^2.29.4"
}
```

### Frontend Dependencies
```json
{
  "next": "14.0.3",
  "react": "18.2.0",
  "react-query": "^3.39.3",
  "react-hook-form": "^7.48.2",
  "@headlessui/react": "^1.7.17",
  "tailwindcss": "3.3.5",
  "axios": "^1.6.2"
}
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Railway account (for backend deployment)
- Vercel account (for frontend deployment)

### Local Development Setup

1. **Clone the repository**
```bash
git clone https://github.com/joelmooyoung/Ach-processing-system.git
cd Ach-processing-system
```

2. **Install dependencies**
```bash
npm run install:all
```

3. **Set up Supabase database**
   - Create a new Supabase project
   - Run the SQL schema from `shared/database-schema.sql`
   - Configure Row Level Security policies

4. **Configure environment variables**

Backend (`backend/.env`):
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
JWT_SECRET=your_jwt_secret_key
ENCRYPTION_KEY=your_encryption_key
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

Frontend (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api
```

5. **Start development servers**
```bash
npm run dev
```


This will start:
- Backend API on http://localhost:3001
- Frontend on http://localhost:3000

### Default Login Credentials
- **Email**: admin@achprocessing.com
- **Password**: admin123!

## 🌐 Deployment

### Backend Deployment (Railway)

1. **Connect Railway to your repository**
2. **Set environment variables** in Railway dashboard
3. **Deploy automatically** from main branch

Required Railway environment variables:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY` 
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET`
- `ENCRYPTION_KEY`
- `FRONTEND_URL`

### Frontend Deployment (Vercel)

1. **Connect Vercel to your repository**
2. **Set root directory** to `frontend`
3. **Configure environment variable**:
   - `NEXT_PUBLIC_API_BASE_URL`: Your Railway backend URL

### Database Setup (Supabase)

1. **Create new Supabase project**
2. **Run database schema**:
```sql
-- Copy and paste content from shared/database-schema.sql
-- This creates all tables, indexes, and RLS policies
```

3. **Configure authentication** (optional for admin users)

## 📊 Database Schema

### Core Tables
- **users** - System users with role-based access
- **ach_transactions** - ACH transaction records with encrypted account data
- **nacha_files** - Generated NACHA files with metadata
- **system_configs** - Application configuration settings
- **federal_holidays** - Configurable federal holiday calendar

### Security Features
- **Row Level Security (RLS)** on all tables
- **Encrypted account numbers** using AES encryption
- **Audit fields** for tracking changes
- **Role-based access policies**

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration (admin only)
- `POST /api/auth/refresh` - Token refresh

### ACH Transactions
- `GET /api/ach` - List transactions with filtering
- `POST /api/ach` - Create new transaction
- `GET /api/ach/:id` - Get transaction details
- `PATCH /api/ach/:id/status` - Update transaction status

### NACHA Files
- `POST /api/ach/nacha/generate` - Generate NACHA file
- `GET /api/ach/nacha/files` - List NACHA files
- `GET /api/ach/nacha/files/:id/download` - Download NACHA file

### Reports
- `GET /api/reports/daily-summary` - Daily transaction summary
- `GET /api/reports/monthly-summary` - Monthly statistics
- `POST /api/reports/transaction-stats` - Custom date range statistics

### Configuration
- `GET /api/config` - List configuration settings
- `PUT /api/config/:key` - Update configuration
- `GET /api/config/holidays/list` - Federal holidays
- `POST /api/config/holidays` - Add federal holiday

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

### Test Coverage
- Unit tests for encryption utilities
- Business day calculation tests
- API endpoint integration tests
- React component tests

## 🔒 Security Considerations

### Data Protection
- **Account numbers** are encrypted using AES-256
- **Passwords** are hashed using bcrypt
- **JWT tokens** have expiration and refresh logic
- **Database access** is controlled by RLS policies

### Compliance
- **NACHA format compliance** for all generated files
- **PCI DSS considerations** for sensitive data handling
- **Audit trails** for all financial transactions
- **Business day calculations** follow banking standards

## 📈 Scalability

### Current Capacity
- **1,000+ transactions/month** initial capacity
- **Horizontal scaling** via Railway auto-scaling
- **Database optimization** with proper indexing
- **Caching strategy** for frequently accessed data

### Performance Optimizations
- **Database indexes** on frequently queried fields
- **React Query caching** for frontend data
- **Efficient pagination** for large datasets
- **Optimized NACHA file generation**

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Add tests for new features
- Update documentation as needed
- Follow existing code style and patterns

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation in the `/docs` folder
- Review the API documentation for endpoint details

## 🗺️ Roadmap

### Planned Features
- [ ] **Automated SFTP transmission** for NACHA files
- [ ] **Real-time notifications** for transaction status updates
- [ ] **Advanced reporting** with charts and analytics
- [ ] **Multi-tenant support** for multiple organizations
- [ ] **API rate limiting** and enhanced security
- [ ] **Mobile responsive** improvements
- [ ] **Bulk transaction import** from CSV/Excel files

### Technical Improvements
- [ ] **Redis caching** for improved performance
- [ ] **Webhooks** for external system integration
- [ ] **Advanced monitoring** with health checks
- [ ] **Automated testing** pipeline
- [ ] **Documentation site** with detailed guides

API and management GUI for a system that accepts data and uses it to create ACH files.

## Features

- **Web-based Management Interface**: Submit transactions and manage ACH processing through a clean, responsive web interface
- **RESTful API**: Programmatic access to all system functionality
- **ACH File Generation**: Creates NACHA-compliant ACH files for banking transactions
- **Transaction Management**: Store, track, and process financial transactions
- **Real-time Status Updates**: Monitor pending and processed transactions
- **File Download**: Download generated ACH files directly from the interface

## Quick Start

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Start the Application**:
   ```bash
   ./start.sh
   ```
   Or manually:
   ```bash
   python app.py
   ```

3. **Access the Web Interface**: 
   Open http://localhost:5000 in your browser

## API Endpoints

### Health Check
```
GET /api/health
```
Returns system status and version information.

### Submit Transaction
```
POST /api/submit
Content-Type: application/json

{
  "routing_number": "123456789",
  "account_number": "9876543210", 
  "amount": "100.50",
  "transaction_type": "CREDIT",
  "individual_name": "John Doe",
  "individual_id": "CUST001"
}
```

### Generate ACH File
```
POST /api/generate_ach
```
Processes all pending transactions and generates an ACH file.

### Get Transactions
```
GET /api/transactions
```
Returns all transactions with their current status.

### Download ACH File
```
GET /api/download_ach/<filename>
```
Downloads a generated ACH file.

## Usage Examples

### Submit a Credit Transaction
```bash
curl -X POST http://localhost:5000/api/submit \
  -H "Content-Type: application/json" \
  -d '{
    "routing_number": "123456789",
    "account_number": "9876543210",
    "amount": "100.50", 
    "transaction_type": "CREDIT",
    "individual_name": "John Doe",
    "individual_id": "CUST001"
  }'
```

### Generate ACH File
```bash
curl -X POST http://localhost:5000/api/generate_ach
```

## Configuration

Copy `.env.example` to `.env` and customize:

```bash
# Company Information  
COMPANY_NAME=YOUR_COMPANY
COMPANY_ID=YOUR_COMPANY_ID
ROUTING_NUMBER=YOUR_ROUTING_NUMBER

# Application Settings
SECRET_KEY=your-secret-key
DEBUG=False
PORT=5000
```

## Transaction Types

- **CREDIT**: Deposit money into an account
- **DEBIT**: Withdraw money from an account

## Testing

Run the test suite:
```bash
python test_ach_system.py
```

## Security Notes

- Change the default `SECRET_KEY` in production
- Use HTTPS in production environments
- Validate and sanitize all input data
- Implement proper authentication and authorization
- Store sensitive configuration in environment variables

## Production Deployment

For production use:

1. Set `DEBUG=False` in configuration
2. Use a production WSGI server like Gunicorn:
   ```bash
   gunicorn -w 4 -b 0.0.0.0:5000 app:app
   ```
3. Use a reverse proxy (nginx) for SSL termination
4. Use a production database (PostgreSQL, MySQL)
5. Implement proper logging and monitoring

## File Structure

```
Ach-processing-system/
├── app.py                 # Main Flask application
├── ach_processor.py       # ACH file generation logic
├── database.py           # Database operations
├── templates/
│   └── index.html        # Web interface
├── output/               # Generated ACH files
├── requirements.txt      # Python dependencies
├── start.sh             # Startup script
├── test_ach_system.py   # Test suite
├── .env.example         # Configuration template
└── .gitignore           # Git ignore rules
```

## ACH File Format

Generated files follow the NACHA (National Automated Clearing House Association) standard format with:

- File Header Record (Type 1)
- Batch Header Record (Type 5) 
- Entry Detail Records (Type 6)
- Batch Control Record (Type 8)
- File Control Record (Type 9)
- Filler Records as needed

## Support

For issues and questions, please check the test files for usage examples or review the API documentation above.

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
