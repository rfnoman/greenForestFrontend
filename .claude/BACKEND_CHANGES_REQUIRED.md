# Backend Changes Required for Accountant Supervisor Feature

## Overview
The frontend now supports `accountant_supervisor` user type with enhanced permissions. This document outlines all required backend API changes to support the new supervisor dashboard functionality.

## Required Permission Updates

### 1. User Endpoints

#### Endpoint: `GET /api/v1/users/owners`
**Current Behavior:**
```python
# Only allows accountant
if request.user.user_type != 'accountant':
    return Response(
        {"detail": "Only accountants can access this endpoint."},
        status=status.HTTP_403_FORBIDDEN
    )
```

**Required Change:**
```python
# Allow both accountant and accountant_supervisor
if request.user.user_type not in ['accountant', 'accountant_supervisor']:
    return Response(
        {"detail": "Only accountants and supervisors can access this endpoint."},
        status=status.HTTP_403_FORBIDDEN
    )
```

**Reason:** Supervisors need to fetch the list of all owner users to display in their dashboard and to impersonate them.

---

#### Endpoint: `POST /api/v1/users/impersonate`
**Current Behavior:**
```python
# Only allows accountant
if request.user.user_type != 'accountant':
    return Response(
        {"detail": "Only accountants can access this endpoint."},
        status=status.HTTP_403_FORBIDDEN
    )
```

**Required Change:**
```python
# Allow both accountant and accountant_supervisor
if request.user.user_type not in ['accountant', 'accountant_supervisor']:
    return Response(
        {"detail": "Only accountants and supervisors can access this endpoint."},
        status=status.HTTP_403_FORBIDDEN
    )
```

**Reason:** Supervisors need to impersonate owner users to access their businesses and journal entries.

---

### 2. Journal Entry Endpoints

#### Endpoint: `POST /api/v1/journal-entries/{id}/post`
**Current Behavior:**
```python
# Might have permission check for who can post journal entries
```

**Required Behavior:**
```python
# Only accountant_supervisor should be able to post journal entries
if request.user.user_type != 'accountant_supervisor':
    return Response(
        {"detail": "Only supervisors can post journal entries."},
        status=status.HTTP_403_FORBIDDEN
    )
```

**Reason:** The business logic is that only supervisors have the authority to post (finalize) draft journal entries. Regular accountants can only create drafts.

---

## Implementation Checklist

### Phase 1: Permission Decorators (Recommended Approach)
Create reusable permission decorators for cleaner code:

```python
# permissions.py
from functools import wraps
from rest_framework.response import Response
from rest_framework import status

def require_accountant_or_supervisor(view_func):
    """Decorator to require accountant or accountant_supervisor user type"""
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if request.user.user_type not in ['accountant', 'accountant_supervisor']:
            return Response(
                {"detail": "Only accountants and supervisors can access this endpoint."},
                status=status.HTTP_403_FORBIDDEN
            )
        return view_func(request, *args, **kwargs)
    return wrapper

def require_supervisor(view_func):
    """Decorator to require accountant_supervisor user type"""
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if request.user.user_type != 'accountant_supervisor':
            return Response(
                {"detail": "Only supervisors can access this endpoint."},
                status=status.HTTP_403_FORBIDDEN
            )
        return view_func(request, *args, **kwargs)
    return wrapper
```

### Phase 2: Update View Functions

#### File: `users/views.py` (or equivalent)

```python
from .permissions import require_accountant_or_supervisor

@require_accountant_or_supervisor
def list_owners(request):
    """List all owner users"""
    owners = User.objects.filter(user_type='owner', is_active=True)
    serializer = UserSerializer(owners, many=True)
    return Response(serializer.data)

@require_accountant_or_supervisor
def impersonate_user(request):
    """Impersonate an owner user"""
    email = request.data.get('email')

    try:
        owner = User.objects.get(email=email, user_type='owner')
    except User.DoesNotExist:
        return Response(
            {"detail": "Owner not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    # Generate tokens for the owner
    # ... existing impersonation logic

    return Response({
        "access": access_token,
        "refresh": refresh_token,
        "user": UserSerializer(owner).data
    })
```

#### File: `journal_entries/views.py` (or equivalent)

```python
from .permissions import require_supervisor

@require_supervisor
def post_journal_entry(request, entry_id):
    """Post a draft journal entry (change status to posted)"""
    try:
        entry = JournalEntry.objects.get(
            id=entry_id,
            business_id=request.headers.get('X-Business-ID')
        )
    except JournalEntry.DoesNotExist:
        return Response(
            {"detail": "Journal entry not found."},
            status=status.HTTP_404_NOT_FOUND
        )

    if entry.status != 'draft':
        return Response(
            {"detail": "Only draft entries can be posted."},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Post the entry
    entry.status = 'posted'
    entry.posted_at = timezone.now()
    entry.posted_by = request.user
    entry.save()

    serializer = JournalEntrySerializer(entry)
    return Response(serializer.data)
```

---

## Testing Requirements

### Unit Tests
Create tests for the new permission checks:

```python
# tests/test_permissions.py
from django.test import TestCase
from rest_framework.test import APIClient

class SupervisorPermissionsTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.accountant = User.objects.create(
            email='accountant@test.com',
            user_type='accountant'
        )
        self.supervisor = User.objects.create(
            email='supervisor@test.com',
            user_type='accountant_supervisor'
        )
        self.owner = User.objects.create(
            email='owner@test.com',
            user_type='owner'
        )

    def test_supervisor_can_list_owners(self):
        """Supervisor should be able to list all owners"""
        self.client.force_authenticate(user=self.supervisor)
        response = self.client.get('/api/v1/users/owners')
        self.assertEqual(response.status_code, 200)

    def test_accountant_can_list_owners(self):
        """Accountant should be able to list all owners"""
        self.client.force_authenticate(user=self.accountant)
        response = self.client.get('/api/v1/users/owners')
        self.assertEqual(response.status_code, 200)

    def test_owner_cannot_list_owners(self):
        """Owner should NOT be able to list all owners"""
        self.client.force_authenticate(user=self.owner)
        response = self.client.get('/api/v1/users/owners')
        self.assertEqual(response.status_code, 403)

    def test_supervisor_can_impersonate(self):
        """Supervisor should be able to impersonate owners"""
        self.client.force_authenticate(user=self.supervisor)
        response = self.client.post('/api/v1/users/impersonate', {
            'email': self.owner.email
        })
        self.assertEqual(response.status_code, 200)
        self.assertIn('access', response.data)

    def test_supervisor_can_post_journal_entry(self):
        """Supervisor should be able to post journal entries"""
        # Create a draft journal entry
        entry = JournalEntry.objects.create(
            business=self.owner.businesses.first(),
            status='draft',
            entry_date='2024-01-01'
        )

        self.client.force_authenticate(user=self.supervisor)
        response = self.client.post(
            f'/api/v1/journal-entries/{entry.id}/post',
            HTTP_X_BUSINESS_ID=str(entry.business.id)
        )
        self.assertEqual(response.status_code, 200)

        entry.refresh_from_db()
        self.assertEqual(entry.status, 'posted')

    def test_accountant_cannot_post_journal_entry(self):
        """Accountant should NOT be able to post journal entries"""
        entry = JournalEntry.objects.create(
            business=self.owner.businesses.first(),
            status='draft',
            entry_date='2024-01-01'
        )

        self.client.force_authenticate(user=self.accountant)
        response = self.client.post(
            f'/api/v1/journal-entries/{entry.id}/post',
            HTTP_X_BUSINESS_ID=str(entry.business.id)
        )
        self.assertEqual(response.status_code, 403)
```

---

## Database Migration (If Needed)

If `accountant_supervisor` is a new user type, ensure the database supports it:

```python
# migrations/000X_add_accountant_supervisor_user_type.py
from django.db import migrations

def add_supervisor_user_type(apps, schema_editor):
    # If using choices, ensure 'accountant_supervisor' is in the allowed values
    pass

class Migration(migrations.Migration):
    dependencies = [
        ('users', '000X_previous_migration'),
    ]

    operations = [
        # If user_type is a CharField with choices, no migration needed
        # If it's an enum or has database-level constraints, update accordingly
        migrations.RunPython(add_supervisor_user_type),
    ]
```

---

## API Documentation Updates

Update your API documentation (Swagger/OpenAPI) to reflect the new permissions:

```yaml
/api/v1/users/owners:
  get:
    summary: List all owner users
    security:
      - bearerAuth: []
    responses:
      200:
        description: List of owners
      403:
        description: Only accountants and supervisors can access
    tags:
      - Users
    x-permissions:
      - accountant
      - accountant_supervisor

/api/v1/users/impersonate:
  post:
    summary: Impersonate an owner user
    security:
      - bearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              email:
                type: string
    responses:
      200:
        description: Impersonation successful
      403:
        description: Only accountants and supervisors can access
      404:
        description: Owner not found
    tags:
      - Users
    x-permissions:
      - accountant
      - accountant_supervisor

/api/v1/journal-entries/{id}/post:
  post:
    summary: Post a draft journal entry
    security:
      - bearerAuth: []
    parameters:
      - name: id
        in: path
        required: true
        schema:
          type: string
          format: uuid
      - name: X-Business-ID
        in: header
        required: true
        schema:
          type: string
          format: uuid
    responses:
      200:
        description: Entry posted successfully
      403:
        description: Only supervisors can post entries
      404:
        description: Entry not found
    tags:
      - Journal Entries
    x-permissions:
      - accountant_supervisor
```

---

## Deployment Checklist

- [ ] Update permission checks in `users/views.py`
- [ ] Update permission checks in `journal_entries/views.py`
- [ ] Create/update permission decorators
- [ ] Run database migrations (if needed)
- [ ] Add unit tests for new permissions
- [ ] Update API documentation
- [ ] Test all endpoints with Postman/Insomnia:
  - [ ] GET `/users/owners` as accountant
  - [ ] GET `/users/owners` as accountant_supervisor
  - [ ] GET `/users/owners` as owner (should fail)
  - [ ] POST `/users/impersonate` as accountant_supervisor
  - [ ] POST `/journal-entries/{id}/post` as accountant_supervisor
  - [ ] POST `/journal-entries/{id}/post` as accountant (should fail)
- [ ] Deploy to staging environment
- [ ] Perform E2E testing with frontend
- [ ] Deploy to production

---

## Frontend-Backend Contract

### Expected Responses

#### Success Response for `/users/owners`:
```json
[
  {
    "id": "uuid",
    "email": "owner@example.com",
    "username": "string",
    "first_name": "string",
    "last_name": "string",
    "user_type": "owner"
  }
]
```

#### Success Response for `/users/impersonate`:
```json
{
  "access": "jwt_token_string",
  "refresh": "jwt_refresh_token_string",
  "user": {
    "id": "uuid",
    "email": "owner@example.com",
    "user_type": "owner"
  }
}
```

#### Error Response Format:
```json
{
  "detail": "Only accountants and supervisors can access this endpoint."
}
```

---

## Security Considerations

1. **Audit Logging**: Log all impersonation actions
   ```python
   def impersonate_user(request):
       # ... existing logic

       # Log the impersonation
       AuditLog.objects.create(
           user=request.user,
           action='impersonate',
           target_user=owner,
           ip_address=request.META.get('REMOTE_ADDR'),
           timestamp=timezone.now()
       )
   ```

2. **Rate Limiting**: Consider rate limiting impersonation attempts
3. **Token Expiry**: Ensure impersonated tokens have appropriate expiry times
4. **Role Validation**: Always validate user roles on every protected endpoint

---

## Contact

For questions or clarification, contact the frontend team or refer to:
- Frontend implementation: `/app/accountant-supervisor/`
- API client: `/lib/api/supervisor.ts`
- Type definitions: `/lib/types/index.ts`
