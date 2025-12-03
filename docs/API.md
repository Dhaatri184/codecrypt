# CodeCrypt API Documentation

## Base URL
```
http://localhost:4000/api
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Endpoints

### Authentication

#### Initiate GitHub OAuth
```http
GET /auth/github/initiate
```

**Response:**
```json
{
  "success": true,
  "data": {
    "authUrl": "https://github.com/login/oauth/authorize?...",
    "state": "random_state"
  }
}
```

#### OAuth Callback
```http
GET /auth/github/callback?code=<code>&state=<state>
```

Redirects to frontend with JWT token.

#### Get Current User
```http
GET /auth/me
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "githubId": "123",
    "githubUsername": "user",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### Repositories

#### List Connected Repositories
```http
GET /repositories
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "repo-name",
      "fullName": "user/repo-name",
      "lastScanAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

#### Connect Repository
```http
POST /repositories/connect
Authorization: Bearer <token>
Content-Type: application/json

{
  "githubRepoId": "123",
  "name": "repo-name",
  "fullName": "user/repo-name",
  "cloneUrl": "https://github.com/user/repo.git",
  "defaultBranch": "main"
}
```

### Scans

#### Trigger Scan
```http
POST /scans
Authorization: Bearer <token>
Content-Type: application/json

{
  "repositoryId": "uuid",
  "branch": "main"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "scan-uuid",
    "status": "pending",
    "startedAt": "2024-01-01T00:00:00Z"
  }
}
```

#### Get Scan Status
```http
GET /scans/:id
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "completed",
    "totalFiles": 45,
    "totalIssues": 23,
    "hauntingLevel": "Moderately Haunted",
    "completedAt": "2024-01-01T00:05:00Z"
  }
}
```

#### Get Scan Results
```http
GET /scans/:id/results
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "data": {
    "scan": { ... },
    "issues": [
      {
        "id": "uuid",
        "hauntingType": "ghost",
        "severity": "medium",
        "filePath": "src/utils.js",
        "startLine": 10,
        "endLine": 15,
        "message": "Unused variable 'x'",
        "explanation": {
          "explanation": "This code is dead...",
          "fixSuggestion": "Remove the unused code",
          "codeExample": "// Delete the line"
        }
      }
    ]
  }
}
```

#### Get Scan History
```http
GET /scans/repository/:repositoryId?limit=10
Authorization: Bearer <token>
```

## Error Responses

All errors follow this format:
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message"
  }
}
```

### Common Error Codes
- `UNAUTHORIZED` - Missing or invalid token
- `FORBIDDEN` - Insufficient permissions
- `NOT_FOUND` - Resource not found
- `INVALID_INPUT` - Invalid request data
- `INTERNAL_SERVER_ERROR` - Server error

## Rate Limits

- API requests: 100/minute per user
- Scan triggers: 10/hour per repository
