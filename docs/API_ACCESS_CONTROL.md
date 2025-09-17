# API Access Control Documentation

## Overview

The ACH Processing System implements role-based access control (RBAC) to restrict API access based on user roles. This ensures that organizations can only submit transactions while all other administrative functions are restricted to internal users.

## User Roles

### ORGANIZATION
- **Purpose**: External organizations that submit ACH transactions
- **Access Level**: Minimal - transaction submission only
- **Restrictions**: Cannot view, manage, or access any administrative functions

### OPERATOR
- **Purpose**: Internal staff responsible for day-to-day operations
- **Access Level**: Full access to all transaction and operational APIs
- **Capabilities**: Process transactions, manage NACHA files, configure system

### ADMIN
- **Purpose**: System administrators with full access
- **Access Level**: Complete system access including user management
- **Capabilities**: All operator functions plus user and system administration

### VIEWER
- **Purpose**: Read-only access for auditing and reporting
- **Access Level**: View-only access to transactions and reports
- **Restrictions**: Cannot modify data or perform operations

## API Access Matrix

| API Endpoint | ORGANIZATION | OPERATOR | ADMIN | VIEWER |
|-------------|--------------|----------|-------|--------|
| **Authentication APIs** |
| POST `/api/auth/register` | ❌ | ✅ | ✅ | ❌ |
| POST `/api/auth/login` | ✅ | ✅ | ✅ | ✅ |
| GET `/api/auth/profile` | ✅ | ✅ | ✅ | ✅ |
| PUT `/api/auth/profile` | ✅ | ✅ | ✅ | ✅ |
| PUT `/api/auth/change-password` | ✅ | ✅ | ✅ | ✅ |
| **Transaction APIs** |
| POST `/api/transactions` | ✅ | ✅ | ✅ | ❌ |
| GET `/api/transactions` | ❌ | ✅ | ✅ | ✅ |
| GET `/api/transactions/:id` | ❌ | ✅ | ✅ | ✅ |
| PATCH `/api/transactions/:id/status` | ❌ | ✅ | ✅ | ❌ |
| GET `/api/transactions/stats/summary` | ❌ | ✅ | ✅ | ✅ |
| **NACHA File APIs** |
| POST `/api/nacha/generate` | ❌ | ✅ | ✅ | ❌ |
| GET `/api/nacha/files` | ❌ | ✅ | ✅ | ✅ |
| GET `/api/nacha/files/:id` | ❌ | ✅ | ✅ | ✅ |
| GET `/api/nacha/files/:id/download` | ❌ | ✅ | ✅ | ❌ |
| POST `/api/nacha/files/:id/validate` | ❌ | ✅ | ✅ | ❌ |
| PATCH `/api/nacha/files/:id/transmitted` | ❌ | ✅ | ✅ | ❌ |
| GET `/api/nacha/stats/generation` | ❌ | ✅ | ✅ | ✅ |
| **Federal Holidays APIs** |
| GET `/api/holidays` | ❌ | ✅ | ✅ | ✅ |
| POST `/api/holidays` | ❌ | ✅ | ✅ | ❌ |
| PUT `/api/holidays/:id` | ❌ | ✅ | ✅ | ❌ |
| DELETE `/api/holidays/:id` | ❌ | ✅ | ✅ | ❌ |
| POST `/api/holidays/generate/:year` | ❌ | ✅ | ✅ | ❌ |
| GET `/api/holidays/business-day/*` | ❌ | ✅ | ✅ | ✅ |
| **System Configuration APIs** |
| GET `/api/config` | ❌ | ✅ | ✅ | ✅ |
| GET `/api/config/:key` | ❌ | ✅ | ✅ | ✅ |
| PUT `/api/config/:key` | ❌ | ✅ | ✅ | ❌ |
| POST `/api/config/bulk` | ❌ | ✅ | ✅ | ❌ |
| GET `/api/config/sftp/settings` | ❌ | ✅ | ✅ | ✅ |
| PUT `/api/config/sftp/settings` | ❌ | ✅ | ✅ | ❌ |
| GET `/api/config/ach/settings` | ❌ | ✅ | ✅ | ✅ |
| PUT `/api/config/ach/settings` | ❌ | ✅ | ✅ | ❌ |
| POST `/api/config/sftp/test` | ❌ | ✅ | ✅ | ❌ |

Legend:
- ✅ Allowed
- ❌ Denied (403 Forbidden)

## Organization User Workflow

### 1. Registration
Organizations register using the standard registration endpoint:
```json
POST /api/auth/register
{
  "email": "organization@example.com",
  "password": "securePassword123",
  "name": "Example Organization",
  "role": "organization"
}
```

### 2. Authentication
Organizations authenticate like any other user:
```json
POST /api/auth/login
{
  "email": "organization@example.com",
  "password": "securePassword123"
}
```

### 3. Transaction Submission
Organizations can only submit new transactions:
```json
POST /api/transactions
Authorization: Bearer <jwt_token>
{
  "drRoutingNumber": "123456789",
  "drAccountNumber": "1234567890",
  "drId": "DEBIT123",
  "drName": "Debit Account Name",
  "crRoutingNumber": "987654321",
  "crAccountNumber": "0987654321",
  "crId": "CREDIT456",
  "crName": "Credit Account Name",
  "amount": 100.00,
  "effectiveDate": "2024-01-15T00:00:00.000Z",
  "senderDetails": "Payment for services"
}
```

## Security Features

### 1. Authentication
All API endpoints require valid JWT authentication tokens except:
- Health check endpoint
- Login endpoint

### 2. Authorization
Role-based middleware enforces access restrictions:
- `requireTransactionAccess`: Allows admin, operator, and organization roles
- `requireInternal`: Restricts access to admin and operator roles only
- `requireAdmin`: Restricts access to admin role only

### 3. Audit Logging
The system logs all unauthorized access attempts and organization activity:

#### Unauthorized Access Logging
```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "method": "GET",
  "url": "/api/nacha/files",
  "userAgent": "Mozilla/5.0...",
  "ip": "192.168.1.100",
  "user": {
    "userId": "org-123",
    "email": "org@example.com",
    "role": "organization"
  },
  "statusCode": 403,
  "response": {
    "success": false,
    "error": "Insufficient permissions."
  }
}
```

#### Organization Activity Logging
```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "method": "POST",
  "url": "/api/transactions",
  "userAgent": "Mozilla/5.0...",
  "ip": "192.168.1.100",
  "organization": {
    "userId": "org-123",
    "email": "org@example.com"
  },
  "statusCode": 200,
  "success": true
}
```

## Error Responses

### 401 Unauthorized
Returned when no authentication token is provided or token is invalid:
```json
{
  "success": false,
  "error": "Access denied. No token provided."
}
```

### 403 Forbidden
Returned when user lacks required permissions:
```json
{
  "success": false,
  "error": "Insufficient permissions."
}
```

## Implementation Details

### Database Changes
1. Updated `users` table to support `organization` role
2. Added CHECK constraint to validate role values
3. Updated RLS (Row Level Security) policies to allow organizations to insert transactions

### Middleware
1. `requireTransactionAccess`: Allows transaction submission for organizations
2. `requireInternal`: Restricts access to internal users (admin/operator)
3. `logUnauthorizedAccess`: Logs all 403 responses for security monitoring
4. `logOrganizationActivity`: Tracks all organization API calls

### Frontend Changes
1. Updated navigation to show appropriate menu items based on user role
2. Organizations only see transaction-related navigation items
3. Internal users see all administrative functions

## Security Considerations

1. **Principle of Least Privilege**: Organizations have minimal access required for their function
2. **Audit Trail**: All access attempts and organization activity are logged
3. **Input Validation**: All API endpoints validate input data using Joi schemas
4. **Data Encryption**: Sensitive account numbers are encrypted before storage
5. **JWT Security**: Tokens expire after 7 days and include role information

## Testing

Comprehensive test suite validates access restrictions:
- Organizations cannot access restricted endpoints (403 responses)
- Internal users can access all appropriate endpoints
- Proper authentication and authorization flow
- Logging functionality for security monitoring

## Monitoring

Monitor the following for security:
1. Repeated 403 errors from organization users
2. Attempts to access administrative endpoints
3. Unusual patterns in organization transaction submissions
4. Failed authentication attempts