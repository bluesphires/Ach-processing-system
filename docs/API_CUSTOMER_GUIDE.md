# ACH Processing System - Customer Integration Guide

## Table of Contents

1. [Welcome](#welcome)
2. [What You'll Need](#what-youll-need)
3. [Quick Integration Steps](#quick-integration-steps)
4. [Common Use Cases](#common-use-cases)
5. [Security Considerations](#security-considerations)
6. [Testing and Validation](#testing-and-validation)
7. [Troubleshooting](#troubleshooting)
8. [Sample Code Libraries](#sample-code-libraries)
9. [Next Steps](#next-steps)

---

## Welcome

Thank you for choosing our ACH Processing System. This guide will help you quickly integrate with our API to start processing ACH transactions securely and efficiently.

## What You'll Need

Before you begin integration, ensure you have:

1. **API Credentials**: Username and password provided by your system administrator
2. **Development Environment**: Ability to make HTTPS requests from your application
3. **NACHA Knowledge**: Basic understanding of ACH transaction requirements
4. **Financial Institution Setup**: Relationship with a bank that accepts NACHA files

## Quick Integration Steps

### Step 1: Authentication Setup

```bash
# Example using curl
curl -X POST https://your-api-domain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@company.com",
    "password": "your-secure-password"
  }'
```

Save the returned JWT token for use in subsequent requests.

### Step 2: Submit Your First Transaction

```bash
# Create a transaction
curl -X POST https://your-api-domain.com/api/transactions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
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
  }'
```

### Step 3: Generate NACHA File

```bash
# Generate file for transmission
curl -X POST https://your-api-domain.com/api/nacha/generate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "effectiveDate": "2023-12-15",
    "fileType": "DR"
  }'
```

### Step 4: Download and Transmit

```bash
# Download the generated file
curl -X GET https://your-api-domain.com/api/nacha/files/FILE_ID/download \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -o ach_file.txt
```

Then transmit this file to your financial institution according to their requirements.

## Common Use Cases

### 1. Payroll Processing

For payroll applications, you'll typically:
- Submit multiple credit transactions (employee payments)
- Generate CR (credit) NACHA files
- Coordinate with payroll effective dates

### 2. Vendor Payments

For accounts payable systems:
- Submit credit transactions to vendors
- Include invoice numbers in `senderDetails`
- Generate files aligned with payment processing schedules

### 3. Customer Collections

For billing and collections:
- Submit debit transactions from customer accounts
- Generate DR (debit) NACHA files
- Handle return processing and failed transactions

## Security Considerations

### 1. Token Management
- Tokens expire after 7 days
- Store tokens securely (encrypted at rest)
- Implement automatic refresh before expiration

### 2. Data Protection
- Account numbers are automatically encrypted
- Use HTTPS for all production communications
- Implement audit logging for compliance

### 3. Error Handling
- Always check the `success` field in responses
- Implement retry logic for transient failures
- Log errors for troubleshooting and compliance

## Testing and Validation

### Development Environment
- Use the development API endpoint for testing
- Test with small amounts initially
- Validate NACHA file format before production

### Production Deployment
- Start with a limited transaction volume
- Monitor error rates and response times
- Coordinate with your financial institution for file transmission testing

## Troubleshooting

### Common Issues

**Authentication Failures**
- Verify credentials are correct
- Check token expiration
- Ensure proper Authorization header format

**Validation Errors**
- Verify routing numbers are valid 9-digit ABA numbers
- Check amount formatting (positive, 2 decimal places)
- Ensure effective date is not in the past

**Rate Limiting**
- Monitor X-RateLimit headers
- Implement exponential backoff
- Contact support if limits are insufficient

### Getting Help

1. **Documentation**: Refer to the complete API documentation
2. **System Administrator**: Contact your internal system administrator
3. **Support Channels**: Use your organization's established support process

## Sample Code Libraries

### JavaScript/Node.js Example

```javascript
class ACHProcessor {
  constructor(apiUrl, credentials) {
    this.apiUrl = apiUrl;
    this.credentials = credentials;
    this.token = null;
  }

  async authenticate() {
    const response = await fetch(`${this.apiUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(this.credentials)
    });
    
    const result = await response.json();
    if (result.success) {
      this.token = result.data.token;
    }
    return result;
  }

  async createTransaction(transactionData) {
    if (!this.token) await this.authenticate();
    
    const response = await fetch(`${this.apiUrl}/api/transactions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(transactionData)
    });
    
    return await response.json();
  }
}
```

### Python Example

```python
import requests
import json

class ACHProcessor:
    def __init__(self, api_url, credentials):
        self.api_url = api_url
        self.credentials = credentials
        self.token = None
    
    def authenticate(self):
        response = requests.post(
            f"{self.api_url}/api/auth/login",
            json=self.credentials
        )
        result = response.json()
        if result['success']:
            self.token = result['data']['token']
        return result
    
    def create_transaction(self, transaction_data):
        if not self.token:
            self.authenticate()
        
        headers = {
            'Authorization': f'Bearer {self.token}',
            'Content-Type': 'application/json'
        }
        
        response = requests.post(
            f"{self.api_url}/api/transactions",
            json=transaction_data,
            headers=headers
        )
        
        return response.json()
```

## Next Steps

1. **Review Full Documentation**: Read the complete API documentation for advanced features
2. **Plan Integration**: Design your integration architecture
3. **Develop and Test**: Build your integration in the development environment
4. **Production Deployment**: Deploy with monitoring and error handling
5. **Optimize**: Monitor performance and optimize based on usage patterns

For complete API reference, see [API Documentation](./API.md).