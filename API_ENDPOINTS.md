# CCR API - Endpoints

Base URL: http://localhost:8080

## Authentication and Security
- Auth type: JWT Bearer token
- Header: Authorization: Bearer <token>
- Public endpoints: POST /auth/login
- All other endpoints require a valid JWT
- Admin-only: all /users/**, PUT /children/{id}, DELETE /children/{id}

## Common Formats
- Date: dd/MM/yyyy
- Month: MM/yyyy
- Instant timestamps: ISO-8601 (example: 2026-02-12T13:45:30.123)
- SundayShift: MORNING | NIGHT
- UserRole: ADMIN | USER

## Error Response Formats
ErrorResponse (used for 401, 403, 404, 409, 500 and ResponseStatusException):
{
  "message": "string",
  "status": 400,
  "timestamp": "yyyy-MM-dd'T'HH:mm:ss.SSS"
}

ValidationErrorResponse (used for 400 on validation failures):
{
  "message": "Validation failed",
  "errors": [
    { "field": "fieldName", "message": "error message" }
  ]
}

Enum parsing errors (invalid values) return 400 with:
{
  "message": "Invalid value. Allowed values: MORNING, NIGHT",
  "status": 400,
  "timestamp": "yyyy-MM-dd'T'HH:mm:ss.SSS"
}

## Authentication

### POST /auth/login (public)
Request body (AuthenticationDTO):
{
  "login": "string",   // required, max 120
  "password": "string" // required, 6-120
}
Success (200):
{
  "token": "string"
}
Errors:
- 400 ValidationErrorResponse (missing/invalid fields)
- 401 ErrorResponse (invalid credentials)

### GET /auth/me (authenticated)
Returns the currently authenticated user.
Success (200):
{
  "id": "string",
  "name": "string",
  "login": "string",
  "role": "ADMIN" | "USER"
}
Errors:
- 401 ErrorResponse (missing/invalid token)

## Users (ADMIN only)

### POST /users
Request body (UserCreateDTO):
{
  "name": "string",     // required, max 120
  "login": "string",    // required, max 120, must be unique
  "password": "string", // required, 6-120
  "role": "ADMIN" | "USER" // required
}
Success (201):
{
  "id": "string",
  "name": "string",
  "login": "string",
  "role": "ADMIN" | "USER"
}
Errors:
- 400 ValidationErrorResponse
- 401 ErrorResponse
- 403 ErrorResponse
- 409 ErrorResponse (login already exists)

### GET /users
Success (200):
[
  {
    "id": "string",
    "name": "string",
    "login": "string",
    "role": "ADMIN" | "USER"
  }
]
Errors: 401, 403

### GET /users/{id}
Path variables:
- id: string (UUID)
Success (200): UserResponseDTO
Errors:
- 401, 403
- 404 ErrorResponse (user not found)

### PUT /users/{id}
Request body (UserUpdateDTO):
{
  "name": "string",     // required, max 120
  "login": "string",    // required, max 120, must be unique
  "password": "string", // optional; if provided must be 6-120
  "role": "ADMIN" | "USER" // required
}
Success (200): UserResponseDTO
Errors:
- 400 ValidationErrorResponse
- 401, 403
- 404 ErrorResponse (user not found)
- 409 ErrorResponse (login already exists)
Notes:
- To keep the same password, omit the field or send null. Empty string fails validation.

### DELETE /users/{id}
Success (204)
Errors:
- 401, 403
- 404 ErrorResponse (user not found)

## Children (authenticated; update/delete admin only)

### POST /children
Request body (ChildCreateDTO):
{
  "name": "string",               // required, max 120
  "responsibleName": "string",    // required, max 120
  "responsibleContact": "string", // required, max 60
  "allergies": "string"           // optional, max 255
}
Success (201):
{
  "id": "string",
  "name": "string",
  "responsibleName": "string",
  "responsibleContact": "string",
  "allergies": "string",
  "createdBy": { "id": "string", "name": "string" },
  "updatedBy": { "id": "string", "name": "string" },
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601"
}
Errors:
- 400 ValidationErrorResponse
- 401 ErrorResponse

### GET /children
Success (200): List<ChildResponseDTO>
Errors: 401

### GET /children/search
Query params:
- name: string (required)
Success (200): List<ChildResponseDTO>
Errors:
- 401

### GET /children/{id}
Path variables:
- id: string (UUID)
Success (200): ChildResponseDTO
Errors:
- 401
- 404 ErrorResponse (child not found)

### PUT /children/{id} (ADMIN only)
Request body (ChildUpdateDTO):
{
  "name": "string",               // required, max 120
  "responsibleName": "string",    // required, max 120
  "responsibleContact": "string", // required, max 60
  "allergies": "string"           // optional, max 255
}
Success (200): ChildResponseDTO
Errors:
- 400 ValidationErrorResponse
- 401, 403
- 404 ErrorResponse (child not found)

### DELETE /children/{id} (ADMIN only)
Success (204)
Errors:
- 401, 403
- 404 ErrorResponse (child not found)

## Child Attendance (authenticated)

### POST /children/{id}/attendance
Path variables:
- id: string (child id)
Request body (ChildAttendanceCreateDTO):
{
  "date": "dd/MM/yyyy",            // required, must be a Sunday
  "shift": "MORNING" | "NIGHT",  // required
  "present": true | false           // required
}
Success (201):
{
  "date": "dd/MM/yyyy",
  "shift": "MORNING" | "NIGHT",
  "present": true | false,
  "child": { "id": "string", "name": "string" },
  "markedBy": { "id": "string", "name": "string" },
  "updatedBy": { "id": "string", "name": "string" } | null,
  "createdAt": "ISO-8601",
  "updatedAt": "ISO-8601"
}
Errors:
- 400 ValidationErrorResponse or ErrorResponse (invalid date format or not Sunday)
- 401
- 404 ErrorResponse (child not found)
- 409 ErrorResponse (attendance already registered for this child/date/shift)

### PUT /children/{id}/attendance
Request body (ChildAttendanceUpdateDTO): same fields as create
Success (200): ChildAttendanceResponseDTO
Errors:
- 400 ValidationErrorResponse or ErrorResponse (invalid date format or not Sunday)
- 401
- 404 ErrorResponse (attendance not found)

### GET /children/attendance
Query params:
- start: dd/MM/yyyy (required)
- end: dd/MM/yyyy (optional, defaults to start)
- shift: MORNING | NIGHT (required)
Success (200): List<ChildAttendanceResponseDTO>
Errors:
- 400 ErrorResponse (invalid date format, end before start)
- 401

### GET /children/{id}/attendance
Query params:
- start: dd/MM/yyyy (required)
- end: dd/MM/yyyy (optional, defaults to start)
- shift: MORNING | NIGHT (optional)
Success (200): List<ChildAttendanceResponseDTO>
Errors:
- 400 ErrorResponse (invalid date format, end before start)
- 401

## Sunday Availability (authenticated)

### POST /sundays
Request body (SundayCreateDTO):
{
  "date": "dd/MM/yyyy",           // required, must be a Sunday
  "shift": "MORNING" | "NIGHT" // required
}
Success (201):
{
  "date": "dd/MM/yyyy",
  "shift": "MORNING" | "NIGHT",
  "user": { "id": "string", "name": "string" }
}
Errors:
- 400 ValidationErrorResponse or ErrorResponse (invalid date format or not Sunday)
- 401
- 409 ErrorResponse (user already registered for this shift OR no slots available)
Notes:
- Max 2 users per shift (per date).

### GET /sundays
Query params:
- start: dd/MM/yyyy (required)
- end: dd/MM/yyyy (required)
Success (200):
[
  {
    "date": "dd/MM/yyyy",
    "shift": "MORNING" | "NIGHT",
    "users": [ { "id": "string", "name": "string" } ],
    "remainingSlots": 0
  }
]
Errors:
- 400 ErrorResponse (invalid date format, end before start)
- 401

### GET /sundays/report
Query params:
- start: dd/MM/yyyy (required)
- end: dd/MM/yyyy (optional, defaults to start)
- shift: MORNING | NIGHT (required)
Success (200):
[
  {
    "date": "dd/MM/yyyy",
    "shift": "MORNING" | "NIGHT",
    "availableUsers": [ { "id": "string", "name": "string" } ],
    "remainingSlots": 0,
    "attendances": [ ChildAttendanceResponseDTO ]
  }
]
Errors:
- 400 ErrorResponse (invalid date format, end before start)
- 401

### DELETE /sundays
Query params:
- date: dd/MM/yyyy (required, must be a Sunday)
- shift: MORNING | NIGHT (required)
- userId: string (optional)
Success (204)
Errors:
- 400 ErrorResponse (invalid date format or not Sunday)
- 401
- 403 ErrorResponse (non-admin trying to delete another user availability)
- 404 ErrorResponse (availability not found)
Notes:
- If userId is omitted, deletes the authenticated user availability.
- Admins can delete another user by providing userId.

### GET /sundays/calendar
Query params:
- month: MM/yyyy (required)
Success (200):
{
  "monthYear": "MM/yyyy",
  "sundays": [
    {
      "date": "dd/MM/yyyy",
      "reports": [
        {
          "date": "dd/MM/yyyy",
          "shift": "MORNING" | "NIGHT",
          "availableUsers": [ { "id": "string", "name": "string" } ],
          "remainingSlots": 0,
          "attendances": [ ChildAttendanceResponseDTO ]
        }
      ]
    }
  ]
}
Errors:
- 401
- 500 ErrorResponse (invalid month format currently causes an unhandled parsing error)

## Common HTTP Status Codes
- 200 OK
- 201 Created
- 204 No Content
- 400 Bad Request (validation, invalid enum, invalid date format, end before start)
- 401 Unauthorized (missing/invalid token)
- 403 Forbidden (role required)
- 404 Not Found
- 409 Conflict (duplicate availability/attendance or no slots)
- 500 Internal Server Error
