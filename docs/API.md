# ACH Processing System API Documentation

## Table of Contents

1. [Overview](#overview)
   - [Key Features](#key-features)
   - [API Characteristics](#api-characteristics)
2. [Getting Started](#getting-started)
   - [Prerequisites](#prerequisites)
   - [Quick Start Guide](#quick-start-guide)
3. [Authentication](#authentication)
   - [Security Model](#security-model)
   - [Obtaining Access Token](#obtaining-access-token)
   - [Using the Token](#using-the-token)
   - [Token Lifecycle](#token-lifecycle)
4. [Response Format](#response-format)
5. [Core API Endpoints](#core-api-endpoints)
   - [Transaction Management](#transaction-management)
   - [NACHA File Management](#nacha-file-management)
6. [Error Handling](#error-handling)
   - [HTTP Status Codes](#http-status-codes)
   - [Error Response Format](#error-response-format)
   - [Common Error Examples](#common-error-examples)
7. [Rate Limiting](#rate-limiting)
   - [Rate Limits by Endpoint Category](#rate-limits-by-endpoint-category)
   - [Rate Limit Headers](#rate-limit-headers)
   - [Best Practices for Rate Limiting](#best-practices-for-rate-limiting)
8. [Best Practices](#best-practices)
   - [Security Best Practices](#security-best-practices)
   - [Performance Optimization](#performance-optimization)
   - [Integration Patterns](#integration-patterns)
   - [Workflow Examples](#workflow-examples)
9. [Support and Resources](#support-and-resources)
   - [API Versioning](#api-versioning)
   - [Environment URLs](#environment-urls)
   - [Technical Support](#technical-support)
   - [Compliance Notes](#compliance-notes)

---

## Overview

The ACH Processing System API provides a comprehensive solution for managing Automated Clearing House (ACH) transactions. This RESTful API enables customers to submit, track, and manage ACH transactions while ensuring compliance with NACHA standards and banking regulations.

### Key Features

- **Secure Transaction Processing**: Submit debit and credit ACH transactions with bank-grade security
- **NACHA File Generation**: Automatically generate compliant ACH files for transmission to financial institutions
- **Real-time Status Tracking**: Monitor transaction status in real-time
- **Business Day Calculations**: Intelligent handling of holidays and business days
- **Role-based Access Control**: Secure user management with admin, operator, and viewer roles
- **Comprehensive Reporting**: Transaction statistics and audit trails

### API Characteristics

- **Base URL**: `https://your-api-domain.com` (Production) | `http://localhost:3001` (Development)
- **Protocol**: HTTPS (required in production)
- **Data Format**: JSON
- **Authentication**: JWT Bearer tokens
- **Rate Limiting**: Applied to protect system resources

## Getting Started

### Prerequisites

Before using the API, ensure you have:

1. **API Access Credentials**: Contact your system administrator to obtain login credentials
2. **Network Access**: Ensure your application can reach the API endpoints
3. **HTTPS Support**: Production environment requires HTTPS

### Quick Start Guide

1. **Authenticate** using your credentials to obtain a JWT token
2. **Submit Transactions** using the transaction endpoints
3. **Monitor Status** by polling transaction status or using webhooks (if configured)
4. **Generate Files** when ready to transmit to your financial institution

## Authentication

### Security Model

All API endpoints require authentication except for health checks and the login endpoint. The system uses JWT (JSON Web Tokens) for secure, stateless authentication.

### Obtaining Access Token

**Endpoint**: `POST /api/auth/login`

**Request**:
```json
{
  "email": "your-email@company.com",
  "password": "your-secure-password"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user-uuid",
      "email": "your-email@company.com",
      "name": "Your Name",
      "role": "operator",
      "active": true
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "Login successful"
}
```

### Using the Token

Include your JWT token in all subsequent requests:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Token Lifecycle

- **Expiration**: Tokens expire after 7 days by default
- **Refresh**: Obtain a new token by re-authenticating before expiration
- **Security**: Store tokens securely and never expose them in client-side code

## Response Format

All API responses follow a consistent format to ensure predictable integration:

```json
{
  "success": boolean,
  "data": any,           // Present on successful requests
  "message": string,     // Optional success message
  "error": string,       // Present on failed requests
  "pagination": {        // Present on paginated list responses
    "page": number,
    "limit": number,
    "total": number,
    "totalPages": number
  }
}
```

### Success Response Example
```json
{
  "success": true,
  "data": {
    "id": "txn-12345",
    "amount": 1500.00,
    "status": "pending"
  },
  "message": "Transaction created successfully"
}
```

### Error Response Example
```json
{
  "success": false,
  "error": "Validation failed: Amount must be positive"
}
```

## Core API Endpoints

### Transaction Management


The transaction endpoints are the heart of the ACH processing system, allowing you to create, monitor, and manage ACH transactions.
Create a new ACH transaction (legacy format with single effective date).

**Request Body:**
```json
{
  "drRoutingNumber": "123456789",
  "drAccountNumber": "1234567890",
  "drId": "ACCT123",
  "drName": "John Doe",
  "crRoutingNumber": "987654321",
  "crAccountNumber": "0987654321",
  "crId": "ACCT456", 
  "crName": "Jane Smith",
  "amount": 1500.00,
  "effectiveDate": "2024-01-15",
  "senderDetails": "Payment for services"
}
```

### POST /api/transactions/separate

Create a new transaction with separate debit and credit entries (NEW).

**Request Body:**
```json
{
  "drRoutingNumber": "123456789",
  "drAccountNumber": "1234567890",
  "drId": "ACCT123",
  "drName": "John Doe",
  "drEffectiveDate": "2024-01-15",
  "crRoutingNumber": "987654321",
  "crAccountNumber": "0987654321",
  "crId": "ACCT456",
  "crName": "Jane Smith", 
  "crEffectiveDate": "2024-01-17",
  "amount": 1500.00,
  "senderDetails": "Payment for services"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "group-uuid",
    "drEntryId": "dr-entry-uuid",
    "crEntryId": "cr-entry-uuid",
    "amount": 1500.00,
    "drEffectiveDate": "2024-01-15",
    "crEffectiveDate": "2024-01-17",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Separate debit/credit transaction created successfully"
}
```

### GET /api/transactions

List transactions with pagination and filtering (legacy format).

### GET /api/transactions/entries

List individual transaction entries with pagination and filtering (NEW).

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)
- `status` (string): Filter by status (pending, processed, failed, cancelled)
- `effectiveDate` (string): Filter by effective date (YYYY-MM-DD)
- `entryType` (string): Filter by entry type (DR, CR)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "entry-uuid",
      "parentTransactionId": "parent-uuid",
      "entryType": "DR",
      "routingNumber": "123456789",
      "accountNumber": "****7890",
      "accountId": "ACCT123",
      "accountName": "John Doe",
      "amount": 1500.00,
      "effectiveDate": "2024-01-15",
      "status": "pending",
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### GET /api/transactions/groups

List transaction groups (linked debit/credit pairs) (NEW).

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "group-uuid",
      "drEntryId": "dr-entry-uuid",
      "crEntryId": "cr-entry-uuid",
      "drEntry": {
        "id": "dr-entry-uuid",
        "entryType": "DR",
        "accountName": "John Doe",
        "amount": 1500.00,
        "effectiveDate": "2024-01-15",
        "status": "pending"
      },
      "crEntry": {
        "id": "cr-entry-uuid", 
        "entryType": "CR",
        "accountName": "Jane Smith",
        "amount": 1500.00,
        "effectiveDate": "2024-01-17",
        "status": "pending"
      },
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

Create new ACH transaction.

#### Create Transaction

**Endpoint**: `POST /api/transactions`

Submit a new ACH transaction for processing. This endpoint accepts both debit and credit transactions.

**Required Permissions**: Operator or Admin role

**Request Body**:
```json
{
  "drRoutingNumber": "123456789",
  "drAccountNumber": "1234567890",
  "drId": "CUSTOMER001",
  "drName": "John Customer",
  "crRoutingNumber": "987654321",
  "crAccountNumber": "0987654321",
  "crId": "VENDOR001",
  "crName": "ABC Company",
  "amount": 1500.00,
  "effectiveDate": "2023-12-15",
  "senderDetails": "Monthly payment"
}
```

**Field Descriptions**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `drRoutingNumber` | string | Yes | 9-digit ABA routing number for debit account |
| `drAccountNumber` | string | Yes | Account number to debit (1-17 characters) |
| `drId` | string | Yes | Customer identifier (max 15 characters) |
| `drName` | string | Yes | Account holder name (max 22 characters) |
| `crRoutingNumber` | string | Yes | 9-digit ABA routing number for credit account |
| `crAccountNumber` | string | Yes | Account number to credit (1-17 characters) |
| `crId` | string | Yes | Vendor/recipient identifier (max 15 characters) |
| `crName` | string | Yes | Recipient name (max 22 characters) |
| `amount` | number | Yes | Transaction amount (positive, up to 2 decimal places) |
| `effectiveDate` | string | Yes | Date for transaction processing (YYYY-MM-DD format) |
| `senderDetails` | string | No | Additional transaction details (max 255 characters) |

**Success Response** (HTTP 201):
```json
{
  "success": true,
  "data": {
    "id": "txn-a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "drRoutingNumber": "123456789",
    "drAccountNumber": "****7890",
    "amount": 1500.00,
    "status": "pending",
    "effectiveDate": "2023-12-15",
    "createdAt": "2023-01-01T00:00:00.000Z"
  },
  "message": "ACH transaction created successfully"
}
```

**Important Notes**:
- Account numbers are automatically encrypted for security
- Effective date cannot be in the past
- Amount must be positive and formatted to 2 decimal places
- All routing numbers must be valid 9-digit ABA numbers

#### List Transactions

**Endpoint**: `GET /api/transactions`

Retrieve a paginated list of transactions with optional filtering.

**Query Parameters**:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number for pagination |
| `limit` | number | 50 | Items per page (max 100) |
| `status` | string | - | Filter by status: `pending`, `processed`, `failed`, `cancelled` |
| `effectiveDate` | string | - | Filter by effective date (YYYY-MM-DD) |

**Example Request**:
```http
GET /api/transactions?page=1&limit=25&status=pending&effectiveDate=2023-12-15
```

**Success Response** (HTTP 200):
```json
{
  "success": true,
  "data": [
    {
      "id": "txn-a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "drRoutingNumber": "123456789",
      "drAccountNumber": "****7890",
      "crRoutingNumber": "987654321",
      "crAccountNumber": "****4321",
      "drName": "John Customer",
      "crName": "ABC Company",
      "amount": 1500.00,
      "status": "pending",
      "effectiveDate": "2023-12-15",
      "createdAt": "2023-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 25,
    "total": 100,
    "totalPages": 4
  }
}
```

#### Get Transaction Details

**Endpoint**: `GET /api/transactions/{transactionId}`

Retrieve detailed information about a specific transaction.

**Path Parameters**:
- `transactionId` (string): Unique transaction identifier

**Success Response** (HTTP 200):
```json
{
  "success": true,
  "data": {
    "id": "txn-a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "drRoutingNumber": "123456789",
    "drAccountNumber": "****7890",
    "drId": "CUSTOMER001",
    "drName": "John Customer",
    "crRoutingNumber": "987654321",
    "crAccountNumber": "****4321",
    "crId": "VENDOR001",
    "crName": "ABC Company",
    "amount": 1500.00,
    "status": "pending",
    "effectiveDate": "2023-12-15",
    "senderDetails": "Monthly payment",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
}
```

#### Update Transaction Status

**Endpoint**: `PATCH /api/transactions/{transactionId}/status`

Update the status of a transaction (Admin/Operator only).

**Required Permissions**: Operator or Admin role

**Request Body**:
```json
{
  "status": "processed"
}
```

**Valid Status Values**:
- `pending`: Transaction submitted but not yet processed
- `processed`: Transaction successfully processed
- `failed`: Transaction processing failed
- `cancelled`: Transaction was cancelled

**Success Response** (HTTP 200):
```json
{
  "success": true,
  "data": {
    "id": "txn-a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "status": "processed",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  },
  "message": "Transaction status updated successfully"
}
```

#### Transaction Statistics

**Endpoint**: `GET /api/transactions/stats/summary`

Get aggregate statistics for transactions.

**Success Response** (HTTP 200):
```json
{
  "success": true,
  "data": {
    "totalTransactions": 250,
    "pendingTransactions": 15,
    "processedTransactions": 220,
    "failedTransactions": 15,
    "totalAmount": 125000.00,
    "averageAmount": 500.00
  }
}
```

### NACHA File Management

NACHA (National Automated Clearing House Association) files are the standard format for transmitting ACH transactions to financial institutions. These endpoints help you generate, validate, and manage ACH files.

#### Generate NACHA File
Generate NACHA file from transactions (legacy format).

**Endpoint**: `POST /api/nacha/generate`

Generate a NACHA-compliant file from pending transactions for a specific effective date.

**Required Permissions**: Operator or Admin role

**Request Body**:
```json
{
  "effectiveDate": "2023-12-15",
  "fileType": "DR"
}
```

**Field Descriptions**:
- `effectiveDate` (string): Date for which to generate the file (YYYY-MM-DD)
- `fileType` (string): Type of file - "DR" for debit transactions, "CR" for credit transactions

**Success Response** (HTTP 200):
```json
{
  "success": true,
  "data": {
    "id": "file-b2c3d4e5-f6g7-8901-bcde-f23456789012",
    "filename": "ACH_DR_20231215_143022.txt",
    "effectiveDate": "2023-12-15",
    "transactionCount": 25,
    "totalAmount": 37500.00,
    "transmitted": false,
    "createdAt": "2023-01-01T00:00:00.000Z"
  },
  "message": "NACHA file generated successfully"
  "message": "NACHA DR file generated successfully"
}
```

### POST /api/nacha/generate-from-entries

Generate NACHA file from transaction entries (NEW - supports separate effective dates).

**Request Body:**
```json
{
  "effectiveDate": "2023-12-15",
  "fileType": "DR"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "filename": "ACH_DR_20231215_143022.txt",
    "effectiveDate": "2023-12-15",
    "transactionCount": 15,
    "totalAmount": 22500.00,
    "createdAt": "2023-01-01T00:00:00.000Z"
  },
  "message": "NACHA DR file generated successfully from transaction entries"
  }
}
```

#### List NACHA Files

**Endpoint**: `GET /api/nacha/files`

Retrieve a paginated list of generated NACHA files.

**Query Parameters**:
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 50, max: 100)

**Success Response** (HTTP 200):
```json
{
  "success": true,
  "data": [
    {
      "id": "file-b2c3d4e5-f6g7-8901-bcde-f23456789012",
      "filename": "ACH_DR_20231215_143022.txt",
      "effectiveDate": "2023-12-15",
      "transactionCount": 25,
      "totalAmount": 37500.00,
      "transmitted": false,
      "createdAt": "2023-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 10,
    "totalPages": 1
  }
}
```

#### Get NACHA File Details

**Endpoint**: `GET /api/nacha/files/{fileId}`

Retrieve detailed information about a specific NACHA file, including its content.

**Success Response** (HTTP 200):
```json
{
  "success": true,
  "data": {
    "id": "file-b2c3d4e5-f6g7-8901-bcde-f23456789012",
    "filename": "ACH_DR_20231215_143022.txt",
    "content": "101 123456789 9876543231912150600A094101BANK NAME...",
    "effectiveDate": "2023-12-15",
    "transactionCount": 25,
    "totalAmount": 37500.00,
    "transmitted": false,
    "createdAt": "2023-01-01T00:00:00.000Z"
  }
}
```

#### Download NACHA File

**Endpoint**: `GET /api/nacha/files/{fileId}/download`

Download a NACHA file as a text file for transmission to your financial institution.

**Response**: Raw NACHA file content with appropriate headers for file download.

#### Validate NACHA File

**Endpoint**: `POST /api/nacha/files/{fileId}/validate`

Validate the format and integrity of a NACHA file to ensure compliance.

**Success Response** (HTTP 200):
```json
{
  "success": true,
  "data": {
    "isValid": true,
    "errors": [],
    "filename": "ACH_DR_20231215_143022.txt"
  }
}
```

**Failed Validation Response**:
```json
{
  "success": true,
  "data": {
    "isValid": false,
    "errors": [
      "Invalid routing number in batch header",
      "Batch control total mismatch"
    ],
    "filename": "ACH_DR_20231215_143022.txt"
  }
}
```

#### Mark File as Transmitted

**Endpoint**: `PATCH /api/nacha/files/{fileId}/transmitted`

Mark a NACHA file as transmitted to your financial institution.

**Required Permissions**: Operator or Admin role

**Success Response** (HTTP 200):
```json
{
  "success": true,
  "data": {
    "id": "file-b2c3d4e5-f6g7-8901-bcde-f23456789012",
    "transmitted": true,
    "transmittedAt": "2023-01-01T00:00:00.000Z"
  },
### Business Day Utilities

ACH transactions must be processed on business days. These endpoints help you determine valid processing dates and calculate business days.

#### Check Business Day

**Endpoint**: `GET /api/holidays/business-day/check/{date}`

Determine if a specific date is a business day (not a weekend or federal holiday).

**Path Parameters**:
- `date` (string): Date to check (YYYY-MM-DD format)

**Success Response** (HTTP 200):
```json
{
  "success": true,
  "data": {
    "date": "2023-12-15",
    "isBusinessDay": true,
    "isHoliday": false,
    "isWeekend": false,
    "dayOfWeek": "Friday"
  }
}
```

#### Calculate Business Days

**Endpoint**: `GET /api/holidays/business-day/calculate`

Calculate the number of business days between two dates.

**Query Parameters**:
- `startDate` (string): Start date (YYYY-MM-DD)
- `endDate` (string): End date (YYYY-MM-DD)

**Success Response** (HTTP 200):
```json
{
  "success": true,
  "data": {
    "startDate": "2023-12-01",
    "endDate": "2023-12-15",
    "businessDays": 10,
    "totalDays": 14,
    "weekends": 4,
    "holidays": 0
  }
}
```

#### Get Next Business Day

**Endpoint**: `GET /api/holidays/business-day/next/{date}`

Find the next business day from a given date.

**Path Parameters**:
- `date` (string): Starting date (YYYY-MM-DD format)

**Success Response** (HTTP 200):
```json
{
  "success": true,
  "data": {
    "inputDate": "2023-12-15",
    "nextBusinessDay": "2023-12-18",
    "daysUntilNext": 3,
    "reason": "Weekend followed by Monday"
  }
}
```
```

## Error Handling

The API uses standard HTTP status codes and provides detailed error messages to help you troubleshoot issues.

### HTTP Status Codes

| Code | Status | Description |
|------|--------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request data or validation error |
| 401 | Unauthorized | Authentication required or invalid token |
| 403 | Forbidden | Insufficient permissions for the requested action |
| 404 | Not Found | Requested resource not found |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error occurred |

### Error Response Format

All error responses follow this consistent format:

```json
{
  "success": false,
  "error": "Detailed error message explaining the issue"
}
```

### Common Error Examples

#### Validation Error (400)
```json
{
  "success": false,
  "error": "DR Routing Number must be exactly 9 digits"
}
```

#### Authentication Error (401)
```json
{
  "success": false,
  "error": "Access denied. No token provided."
}
```

#### Permission Error (403)
```json
{
  "success": false,
  "error": "Insufficient permissions. Operator role required."
}
```

#### Resource Not Found (404)
```json
{
  "success": false,
  "error": "Transaction not found"
}
```

#### Rate Limit Error (429)
```json
{
  "success": false,
  "error": "Rate limit exceeded. Please retry after 60 seconds."
}
```

## Rate Limiting

To ensure system stability and fair usage, the API implements rate limiting on various endpoints.

### Rate Limits by Endpoint Category

| Category | Limit | Time Window |
|----------|-------|-------------|
| Authentication | 5 requests | per minute |
| Transaction Creation | 100 requests | per hour |
| File Generation | 10 requests | per hour |
| General Queries | 1000 requests | per hour |

### Rate Limit Headers

When approaching rate limits, the API returns headers to help you manage your request timing:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

### Best Practices for Rate Limiting

1. **Monitor Headers**: Check rate limit headers in responses
2. **Implement Backoff**: Use exponential backoff when limits are reached
3. **Batch Operations**: Group multiple operations where possible
4. **Cache Responses**: Cache frequently accessed data to reduce API calls

## Best Practices

### Security Best Practices

#### Token Management
- **Secure Storage**: Store JWT tokens securely (not in localStorage for web apps)
- **Token Rotation**: Implement automatic token refresh before expiration
- **Environment Variables**: Never hardcode credentials in your application code

#### Data Handling
- **Encryption in Transit**: Always use HTTPS in production
- **Sensitive Data**: Account numbers are automatically encrypted by the API
- **Audit Logging**: Maintain logs of all API interactions for compliance

#### Access Control
- **Principle of Least Privilege**: Request only the minimum required permissions
- **Role Verification**: Verify user roles before performing sensitive operations
- **Session Management**: Implement proper session timeout and logout procedures

### Performance Optimization

#### Pagination
- **Use Appropriate Page Sizes**: Start with default pagination limits
- **Implement Pagination**: Always handle paginated responses properly
- **Index-based Navigation**: Use page numbers rather than offset-based pagination

#### Caching
- **Cache Static Data**: Cache reference data like holidays and configuration
- **Conditional Requests**: Use ETags where supported for efficient caching
- **TTL Management**: Implement appropriate cache expiration policies

#### Request Optimization
- **Batch Transactions**: Group multiple transactions when possible
- **Filter Queries**: Use query parameters to reduce response payload
- **Parallel Requests**: Make independent requests in parallel where appropriate

### Integration Patterns

#### Error Handling
```javascript
// Example error handling in JavaScript
async function createTransaction(transactionData) {
  try {
    const response = await fetch('/api/transactions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(transactionData)
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error);
    }
    
    return result.data;
  } catch (error) {
    console.error('Transaction creation failed:', error.message);
    throw error;
  }
}
```

#### Retry Logic
```javascript
// Example retry logic with exponential backoff
async function withRetry(apiCall, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      if (attempt === maxRetries || error.status !== 429) {
        throw error;
      }
      
      const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

### Workflow Examples

#### Standard Transaction Processing
1. **Authenticate** to obtain JWT token
2. **Validate Business Day** using holiday endpoints (optional)
3. **Submit Transaction** using POST /api/transactions
4. **Monitor Status** by polling GET /api/transactions/{id}
5. **Generate NACHA File** when ready for transmission
6. **Download and Transmit** file to your financial institution
7. **Mark as Transmitted** using PATCH endpoint

#### Bulk Transaction Processing
1. **Prepare Transaction Batch** (validate all data first)
2. **Submit Transactions** individually or in sequence
3. **Monitor Batch Status** using transaction listing with filters
4. **Generate Combined Files** for efficient transmission
5. **Handle Failures** by checking individual transaction statuses

## Support and Resources

### API Versioning
- **Current Version**: v1 (included in all endpoint paths)
- **Backward Compatibility**: We maintain backward compatibility within major versions
- **Deprecation Notice**: Deprecated features receive 90-day advance notice

### Environment URLs
- **Production**: `https://api.achprocessing.com`
- **Staging**: `https://staging-api.achprocessing.com`
- **Development**: Contact your administrator for development endpoints

### Technical Support
For technical assistance with API integration:
- **Documentation Issues**: Report any documentation gaps or errors
- **Integration Support**: Contact your system administrator for implementation guidance
- **Production Issues**: Use your organization's established support channels

### Compliance Notes
- **NACHA Compliance**: All generated files conform to NACHA standards
- **Data Retention**: Transaction data is retained according to your organization's policy
- **Audit Requirements**: All API interactions are logged for compliance purposes

## Additional Resources

### Documentation Suite
- **[Customer Integration Guide](./API_CUSTOMER_GUIDE.md)**: Step-by-step integration guide with code examples
- **[Quick Reference](./API_QUICK_REFERENCE.md)**: Condensed API reference for quick lookup
- **[Development Guide](./QUICKSTART.md)**: Setup guide for development environments

### Example Integrations
The Customer Integration Guide includes working code examples in:
- JavaScript/Node.js
- Python
- Shell/cURL commands

### Postman Collection
Contact your system administrator for a Postman collection with pre-configured API requests for testing and development.

This API documentation provides the foundation for secure, efficient integration with the ACH Processing System. For additional technical details or custom integration requirements, please consult with your system administrator.