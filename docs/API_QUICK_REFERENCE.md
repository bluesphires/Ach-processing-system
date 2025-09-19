# ACH Processing API - Quick Reference

## Base Information
- **Base URL**: `https://your-api-domain.com`
- **Authentication**: Bearer JWT Token
- **Content-Type**: `application/json`

## Authentication
```bash
POST /api/auth/login
{
  "email": "user@company.com",
  "password": "password"
}
```

## Core Endpoints

### Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/transactions` | Create new transaction |
| GET | `/api/transactions` | List transactions (paginated) |
| GET | `/api/transactions/{id}` | Get transaction details |
| PATCH | `/api/transactions/{id}/status` | Update transaction status |
| GET | `/api/transactions/stats/summary` | Get transaction statistics |

### NACHA Files
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/nacha/generate` | Generate NACHA file |
| GET | `/api/nacha/files` | List NACHA files |
| GET | `/api/nacha/files/{id}` | Get file details |
| GET | `/api/nacha/files/{id}/download` | Download file |
| POST | `/api/nacha/files/{id}/validate` | Validate file format |
| PATCH | `/api/nacha/files/{id}/transmitted` | Mark as transmitted |

### Business Days
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/holidays/business-day/check/{date}` | Check if date is business day |
| GET | `/api/holidays/business-day/calculate` | Calculate business days between dates |
| GET | `/api/holidays/business-day/next/{date}` | Get next business day |

## Request Examples

### Create Transaction
```json
POST /api/transactions
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

### Generate NACHA File
```json
POST /api/nacha/generate
{
  "effectiveDate": "2023-12-15",
  "fileType": "DR"
}
```

## Response Format
```json
{
  "success": boolean,
  "data": any,
  "message": string,
  "error": string,
  "pagination": {
    "page": number,
    "limit": number,
    "total": number,
    "totalPages": number
  }
}
```

## HTTP Status Codes
- **200** - OK
- **201** - Created
- **400** - Bad Request (validation error)
- **401** - Unauthorized (invalid/missing token)
- **403** - Forbidden (insufficient permissions)
- **404** - Not Found
- **429** - Too Many Requests (rate limited)
- **500** - Internal Server Error

## Rate Limits
- **Authentication**: 5 requests/minute
- **Transaction Creation**: 100 requests/hour
- **File Generation**: 10 requests/hour
- **General Queries**: 1000 requests/hour

## Required Headers
```bash
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

## Common Query Parameters
- `page` - Page number (default: 1)
- `limit` - Items per page (max: 100)
- `status` - Filter by status
- `effectiveDate` - Filter by date (YYYY-MM-DD)

For complete documentation, see [API Documentation](./API.md)