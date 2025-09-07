# Scout API Documentation

This document provides comprehensive API reference for Scout's REST endpoints and integration capabilities.

## 🌐 Base URL

```
Local Development: http://localhost:3000
Production: https://scout.yourcompany.com
```

## 🔧 API Endpoints

### Health Check

#### GET /health

Check if the Scout server is running and responsive.

**Request:**
```bash
GET /health
```

**Response:**
```json
{
  "status": "ok"
}
```

**Status Codes:**
- `200 OK` - Server is healthy
- `500 Internal Server Error` - Server issues

**Example:**
```bash
curl -X GET http://localhost:3000/health
```

---

### Query Processing

#### POST /query

Process a natural language query and return formatted responses for various contexts.

**Request:**
```bash
POST /query
Content-Type: application/json
```

**Request Body:**
```json
{
  "query": "What is our vacation policy?",
  "user": "user123",           // Optional
  "channel": "general"         // Optional
}
```

**Parameters:**
- `query` (string, required) - The natural language question to process
- `user` (string, optional) - User ID for tracking, defaults to "test_user"
- `channel` (string, optional) - Channel ID for context, defaults to "test_channel"

**Response:**
```json
{
  "query": "What is our vacation policy?",
  "raw": {
    "success": true,
    "response": "Based on company documentation...",
    "mock": true,
    "availableFiles": 6,
    "sources": ["Employee Handbook", "HR Policies"]
  },
  "slack": {
    "text": "🤖 Scout Knowledge Assistant (Demo Mode)\n\nBased on...",
    "blocks": [...]
  },
  "slackEnhanced": {
    "text": "🤖 Scout Knowledge Assistant (Demo Mode)\n\n*Your question:* \"What is our vacation policy?\"\n\nBased on...",
    "blocks": [...],
    "response_type": "in_channel"
  },
  "timestamp": "2024-12-06T20:30:00.000Z"
}
```

**Response Fields:**
- `query` - Echo of the original query
- `raw` - Unformatted response from the query processor
- `slack` - Basic Slack-formatted response
- `slackEnhanced` - Enhanced Slack response with rich formatting
- `timestamp` - ISO timestamp of processing

**Status Codes:**
- `200 OK` - Query processed successfully
- `400 Bad Request` - Missing or invalid query parameter
- `500 Internal Server Error` - Processing error

**Error Response:**
```json
{
  "error": "Query is required",
  "example": "{\"query\": \"What is our vacation policy?\"}"
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/query \
  -H "Content-Type: application/json" \
  -d '{"query": "What are our office hours?"}'
```

---

### File Upload

#### POST /upload

Upload a document file with description for knowledge base integration.

**Request:**
```bash
POST /upload
Content-Type: multipart/form-data
```

**Form Data:**
- `file` (file, required) - Document file to upload
- `description` (string, required) - Description of document contents

**File Constraints:**
- **Allowed types**: `.pdf`, `.csv`, `.txt`, `.docx`
- **Maximum size**: 10MB
- **Required**: Non-empty description

**Response:**
```json
{
  "message": "File \"employee-handbook.pdf\" uploaded successfully",
  "filename": "1703624400000-employee-handbook.pdf",
  "originalName": "employee-handbook.pdf",
  "description": "Complete employee handbook covering policies and procedures",
  "size": 2048576,
  "openai": {
    "fileId": "file-abc123...",
    "assistantUpdated": true
  }
}
```

**Response Fields:**
- `message` - Success confirmation message
- `filename` - Stored filename with timestamp prefix
- `originalName` - Original uploaded filename
- `description` - Provided file description
- `size` - File size in bytes
- `openai` - OpenAI integration status (if configured)

**Status Codes:**
- `200 OK` - File uploaded successfully
- `400 Bad Request` - Missing file, invalid type, or missing description
- `413 Payload Too Large` - File exceeds 10MB limit
- `500 Internal Server Error` - Upload processing error

**Error Responses:**
```json
// Missing file
{
  "error": "No file uploaded"
}

// Invalid file type
{
  "error": "Invalid file type. Only .pdf, .csv, .txt, .docx are allowed."
}

// Missing description
{
  "error": "Description is required"
}

// File too large
{
  "error": "File too large. Maximum size is 10MB."
}
```

**Example:**
```bash
curl -X POST http://localhost:3000/upload \
  -F "file=@employee-handbook.pdf" \
  -F "description=Employee handbook with policies and procedures"
```

---

## 🔌 Integration Examples

### JavaScript/Node.js

#### Basic Query
```javascript
const axios = require('axios');

async function queryScout(question) {
  try {
    const response = await axios.post('http://localhost:3000/query', {
      query: question,
      user: 'api-user',
      channel: 'api-integration'
    });
    
    return response.data.raw.response;
  } catch (error) {
    console.error('Scout query failed:', error.response?.data || error.message);
    throw error;
  }
}

// Usage
queryScout("What's our vacation policy?")
  .then(answer => console.log(answer))
  .catch(error => console.error(error));
```

#### File Upload
```javascript
const FormData = require('form-data');
const fs = require('fs');
const axios = require('axios');

async function uploadDocument(filePath, description) {
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));
  form.append('description', description);

  try {
    const response = await axios.post('http://localhost:3000/upload', form, {
      headers: {
        ...form.getHeaders(),
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Upload failed:', error.response?.data || error.message);
    throw error;
  }
}

// Usage
uploadDocument('./policy.pdf', 'Company policy document')
  .then(result => console.log('Upload successful:', result.message))
  .catch(error => console.error(error));
```

### Python

#### Query Integration
```python
import requests
import json

def query_scout(question, user_id=None, channel_id=None):
    url = 'http://localhost:3000/query'
    payload = {
        'query': question,
        'user': user_id or 'api-user',
        'channel': channel_id or 'api-integration'
    }
    
    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        return response.json()['raw']['response']
    except requests.exceptions.RequestException as e:
        print(f"Scout query failed: {e}")
        raise

# Usage
answer = query_scout("What are our office hours?")
print(answer)
```

#### File Upload
```python
import requests

def upload_document(file_path, description):
    url = 'http://localhost:3000/upload'
    
    with open(file_path, 'rb') as file:
        files = {'file': file}
        data = {'description': description}
        
        try:
            response = requests.post(url, files=files, data=data)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            print(f"Upload failed: {e}")
            raise

# Usage
result = upload_document('handbook.pdf', 'Employee handbook')
print(f"Upload successful: {result['message']}")
```

### cURL Examples

#### Health Check
```bash
curl -X GET http://localhost:3000/health
```

#### Query with Parameters
```bash
curl -X POST http://localhost:3000/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What benefits do we offer?",
    "user": "john.doe",
    "channel": "hr-questions"
  }'
```

#### File Upload
```bash
curl -X POST http://localhost:3000/upload \
  -F "file=@document.pdf" \
  -F "description=Important company document"
```

## 📊 Response Formats

### Slack Block Format

Scout returns rich Slack block formats for enhanced user experience:

```json
{
  "blocks": [
    {
      "type": "header",
      "text": {
        "type": "plain_text",
        "text": "🤖 Scout Knowledge Assistant",
        "emoji": true
      }
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Your question:* \"What is our vacation policy?\"\n\nBased on company documentation..."
      }
    },
    {
      "type": "divider"
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "📚 *Sources referenced:*\n:small_blue_diamond: Employee Handbook\n:small_blue_diamond: HR Policy Guide"
      }
    },
    {
      "type": "actions",
      "elements": [
        {
          "type": "button",
          "text": {
            "type": "plain_text",
            "text": "👍 Helpful",
            "emoji": true
          },
          "style": "primary",
          "action_id": "feedback_helpful"
        }
      ]
    }
  ]
}
```

## 🔒 Authentication & Security

### Current Implementation
Scout currently operates without authentication for internal use. All endpoints are publicly accessible within the network.

### Security Considerations
- Deploy behind corporate firewall
- Use HTTPS in production
- Implement rate limiting if needed
- Monitor file uploads for appropriate content

### Future Authentication
Consider implementing these for production:
- API key authentication
- JWT token validation  
- Role-based access control
- Integration with corporate SSO

## ⚠️ Error Handling

### Common Error Patterns

#### 400 Bad Request
```json
{
  "error": "Query is required",
  "example": "{\"query\": \"What is our vacation policy?\"}"
}
```

#### 413 Payload Too Large
```json
{
  "error": "File too large. Maximum size is 10MB."
}
```

#### 500 Internal Server Error
```json
{
  "error": "Query processing failed",
  "details": "OpenAI API connection timeout"
}
```

### Best Practices
1. Always check HTTP status codes
2. Handle network timeouts gracefully  
3. Implement retry logic for transient failures
4. Validate file types/sizes before upload
5. Sanitize user input in queries

## 📈 Rate Limits & Performance

### Current Limits
- No rate limiting currently implemented
- File upload limit: 10MB per file
- Query processing: ~2-5 seconds typical response time

### Performance Tips
1. **Batch queries** when possible
2. **Cache responses** for repeated questions
3. **Optimize file descriptions** for better search results
4. **Monitor response times** and adjust expectations

## 🔧 Development & Testing

### Local Development
```bash
# Start development server
npm run dev

# Test endpoints
npm run test  # If tests are implemented

# Debug mode
DEBUG=* npm start
```

### Environment Variables
```bash
# Required for full functionality
OPENAI_API_KEY=sk-...
OPENAI_ASSISTANT_ID=asst_...

# Optional for development
PORT=3000
NODE_ENV=development
```

---

## 📞 Support

For API support or integration questions:
- Check server logs for detailed error messages
- Review this documentation for proper usage patterns
- Contact the development team with specific API errors
- Test endpoints individually to isolate issues