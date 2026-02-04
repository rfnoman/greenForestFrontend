# GreenForest - Accounting Application

## Project Overview

GreenForest is a modern accounting application similar to QuickBooks, built with Next.js 14+ (App Router), TypeScript, and shadcn/ui components. It connects to a Django Ninja backend API for all business logic and data persistence.

## Tech Stack

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui
- **State Management**: TanStack Query (React Query) for server state
- **Forms**: React Hook Form + Zod validation
- **Auth**: JWT tokens stored in httpOnly cookies
- **Icons**: Lucide React

## Project Structure

```
greenforest/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx                # Owner/Manager login
│   │   └── layout.tsx
│   ├── accountant/
│   │   ├── layout.tsx
│   │   ├── login/page.tsx                # Accountant login
│   │   └── dashboard/page.tsx            # Accountant dashboard with client list
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx                    # Dashboard overview
│   │   ├── upload/
│   │   │   └── page.tsx                # Accounting Assistant with form (owner/manager only)
│   │   ├── book-keeper/
│   │   │   └── page.tsx                # Book keeper - direct chat interface
│   │   ├── accounts/
│   │   │   ├── page.tsx                # Chart of accounts list
│   │   │   └── [id]/page.tsx           # Account details
│   │   ├── contacts/
│   │   │   ├── page.tsx                # All contacts
│   │   │   ├── customers/page.tsx
│   │   │   └── vendors/page.tsx
│   │   ├── invoices/
│   │   │   ├── page.tsx                # Invoice list
│   │   │   ├── new/page.tsx            # Create invoice
│   │   │   └── [id]/page.tsx           # Invoice details
│   │   ├── bills/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── expenses/
│   │   │   ├── page.tsx
│   │   │   └── new/page.tsx
│   │   ├── journal-entries/
│   │   │   ├── page.tsx
│   │   │   ├── new/page.tsx
│   │   │   └── [id]/page.tsx
│   │   ├── banking/
│   │   │   ├── accounts/page.tsx       # Bank accounts list
│   │   │   ├── transactions/page.tsx   # Bank transactions
│   │   │   └── reconcile/page.tsx      # Reconciliation
│   │   ├── reports/
│   │   │   ├── page.tsx                # Reports index
│   │   │   ├── profit-loss/page.tsx
│   │   │   ├── balance-sheet/page.tsx
│   │   │   ├── cash-flow/page.tsx
│   │   │   └── aging/page.tsx
│   │   └── settings/
│   │       ├── page.tsx
│   │       ├── business/page.tsx
│   │       └── members/page.tsx
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/route.ts  # If using NextAuth adapter
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                             # shadcn components
│   ├── forms/
│   │   ├── invoice-form.tsx
│   │   ├── bill-form.tsx
│   │   ├── expense-form.tsx
│   │   ├── contact-form.tsx
│   │   ├── account-form.tsx
│   │   └── journal-entry-form.tsx
│   ├── tables/
│   │   ├── invoices-table.tsx
│   │   ├── bills-table.tsx
│   │   ├── contacts-table.tsx
│   │   ├── accounts-table.tsx
│   │   └── transactions-table.tsx
│   ├── charts/
│   │   ├── revenue-chart.tsx
│   │   ├── expense-chart.tsx
│   │   └── cash-flow-chart.tsx
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   ├── header.tsx
│   │   ├── business-switcher.tsx
│   │   └── user-nav.tsx
│   └── shared/
│       ├── data-table.tsx
│       ├── date-range-picker.tsx
│       ├── currency-input.tsx
│       ├── search-input.tsx
│       └── loading-skeleton.tsx
├── lib/
│   ├── api/
│   │   ├── client.ts                   # API client setup
│   │   ├── auth.ts                     # Auth endpoints
│   │   ├── users.ts
│   │   ├── businesses.ts
│   │   ├── accounts.ts
│   │   ├── contacts.ts
│   │   ├── invoices.ts
│   │   ├── bills.ts
│   │   ├── expenses.ts
│   │   ├── journal-entries.ts
│   │   ├── bank-accounts.ts
│   │   ├── bank-transactions.ts
│   │   ├── reconciliations.ts
│   │   └── reports.ts
│   ├── hooks/
│   │   ├── use-auth.ts
│   │   ├── use-business.ts
│   │   ├── use-accounts.ts
│   │   ├── use-contacts.ts
│   │   ├── use-invoices.ts
│   │   ├── use-bills.ts
│   │   └── use-reports.ts
│   ├── utils/
│   │   ├── format.ts                   # Currency, date formatting
│   │   ├── validation.ts               # Zod schemas
│   │   └── cn.ts                       # Class name utility
│   ├── types/
│   │   └── index.ts                    # TypeScript types
│   └── constants.ts
├── middleware.ts                        # Auth middleware
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

## API Configuration

### Base URL
```
API_BASE_URL=http://localhost:8000/api/v1
```

### Authentication
All authenticated requests require:
- `Authorization: Bearer <access_token>` header
- `X-Business-ID: <business_uuid>` header for business-scoped endpoints

### API Client Setup

```typescript
// lib/api/client.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

class ApiClient {
  private accessToken: string | null = null;
  private businessId: string | null = null;

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  setBusinessId(id: string | null) {
    this.businessId = id;
  }

  async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, ...fetchOptions } = options;
    
    let url = `${API_BASE}${endpoint}`;
    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    };

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    if (this.businessId) {
      headers['X-Business-ID'] = this.businessId;
    }

    const response = await fetch(url, { ...fetchOptions, headers });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new ApiError(response.status, error.detail || 'Request failed');
    }

    if (response.status === 204) return {} as T;
    return response.json();
  }

  get<T>(endpoint: string, params?: Record<string, string>) {
    return this.request<T>(endpoint, { method: 'GET', params });
  }

  post<T>(endpoint: string, data?: unknown) {
    return this.request<T>(endpoint, { method: 'POST', body: JSON.stringify(data) });
  }

  patch<T>(endpoint: string, data?: unknown) {
    return this.request<T>(endpoint, { method: 'PATCH', body: JSON.stringify(data) });
  }

  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
```

## API Endpoints Reference

---

### Authentication

#### POST `/auth/token` - Login
**Request:**
```json
{
  "email": "user@example.com",
  "password": "string"
}
```
**Response:**
```json
{
  "access": "jwt_access_token",
  "refresh": "jwt_refresh_token",
  "role_id": "uuid"
}
```
**Note:** The `role_id` should be stored and sent as `X-Role` header with subsequent API requests.

#### POST `/auth/token/refresh/` - Refresh Token
**Request:**
```json
{
  "refresh": "jwt_refresh_token"
}
```
**Response:**
```json
{
  "access": "new_jwt_access_token"
}
```

#### POST `/auth/token/blacklist/` - Logout
**Request:**
```json
{
  "refresh": "jwt_refresh_token"
}
```
**Response:** `204 No Content`

---

### Users

#### GET `/users/me` - Get Current User
**Headers:**
- `Authorization: Bearer <token>` (required)
- `X-Role: <user_uuid>` (optional) - When provided, returns the current user's data but with the `user_type` from the user specified by the UUID

**Behavior:**
- Without `X-Role` header: Returns the current authenticated user with their own `user_type`
- With `X-Role` header: Returns the current authenticated user's data but with the `user_type` from the user specified by the UUID

**Example Request with X-Role:**
```bash
curl -X GET /api/v1/users/me \
  -H "Authorization: Bearer <token>" \
  -H "X-Role: d78bd691-cd69-422c-9ab5-4c13ebb94bd6"
```

**Response:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "username": "string",
  "first_name": "string",
  "last_name": "string",
  "avatar_url": "string | null",
  "user_type": "owner | manager | accountant",
  "is_email_verified": true,
  "is_active": true,
  "date_joined": "2024-01-01T00:00:00Z"
}
```

#### PATCH `/users/me` - Update Current User
**Request:**
```json
{
  "first_name": "string",
  "last_name": "string",
  "avatar_url": "string"
}
```
**Response:** Same as GET `/users/me`

#### GET `/users/owners` - List All Owner Users
**Response:**
```json
[
  {
    "id": "uuid",
    "email": "owner@example.com",
    "username": "string",
    "first_name": "string",
    "last_name": "string",
    "avatar_url": "string | null",
    "user_type": "owner",
    "is_email_verified": true,
    "is_active": true,
    "date_joined": "2024-01-01T00:00:00Z"
  }
]
```

#### POST `/users/impersonate` - Impersonate Owner User
**Access:** Only users with `user_type = "accountant"` can use this endpoint
**Request:**
```json
{
  "email": "owner@example.com"
}
```
**Response (200 OK):**
```json
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "owner@example.com",
    "username": "string",
    "first_name": "string",
    "last_name": "string",
    "avatar_url": "string",
    "user_type": "owner",
    "is_email_verified": true,
    "is_active": true,
    "date_joined": "2024-01-01T00:00:00Z"
  }
}
```
**Errors:**
- `403`: If non-accountant tries to access
- `404`: If owner with email not found

---

### Businesses

#### GET `/businesses` - List User's Businesses
**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Business Name",
    "slug": "business-name",
    "industry": "string | null",
    "currency": "USD",
    "fiscal_year_end_month": 12,
    "email": "string | null",
    "phone": "string | null",
    "address": {
      "line1": "string",
      "line2": "string",
      "city": "string",
      "state": "string",
      "postal_code": "string",
      "country": "string"
    },
    "tax_id": "string | null",
    "logo_url": "string | null",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

#### POST `/businesses` - Create Business
**Request:**
```json
{
  "name": "Business Name",
  "industry": "string",
  "currency": "USD",
  "fiscal_year_end_month": 12,
  "email": "string",
  "phone": "string",
  "address": {
    "line1": "string",
    "line2": "string",
    "city": "string",
    "state": "string",
    "postal_code": "string",
    "country": "string"
  },
  "tax_id": "string"
}
```
**Response:** Same as single business object

#### GET `/businesses/{id}` - Get Business Details
**Response:** Same as single business object

#### PATCH `/businesses/{id}` - Update Business
**Request:** Partial business object
**Response:** Updated business object

#### GET `/businesses/{id}/members` - List Business Members
**Response:**
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "user_email": "member@example.com",
    "business_id": "uuid",
    "role": "owner | admin | member | viewer",
    "is_active": true,
    "accepted_at": "2024-01-01T00:00:00Z | null",
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

#### POST `/businesses/{id}/members/invite` - Invite Member
**Request:**
```json
{
  "email": "newmember@example.com",
  "role": "admin | member | viewer"
}
```
**Response:** Business member object

#### DELETE `/businesses/{id}/members/{user_id}` - Remove Member
**Response:** `204 No Content`

---

### Chart of Accounts (requires X-Business-ID)

#### GET `/accounts` - List Accounts
**Query Params:** `account_type`, `is_active`
**Response:**
```json
[
  {
    "id": "uuid",
    "code": "1000",
    "name": "Cash",
    "description": "string | null",
    "account_type": "asset | liability | equity | revenue | expense",
    "normal_balance": "debit | credit",
    "parent_id": "uuid | null",
    "is_control_account": false,
    "is_system": false,
    "is_active": true,
    "is_bank_account": false
  }
]
```

#### POST `/accounts` - Create Account
**Request:**
```json
{
  "code": "1000",
  "name": "Cash",
  "description": "string",
  "account_type": "asset | liability | equity | revenue | expense",
  "parent_id": "uuid"
}
```
**Response:** Account object

#### GET `/accounts/{id}` - Get Account
**Response:** Account object

#### PATCH `/accounts/{id}` - Update Account
**Request:** Partial account object
**Response:** Updated account object

#### GET `/accounts/{id}/balance` - Get Account Balance
**Response:**
```json
{
  "account_id": "uuid",
  "balance": "1000.00",
  "as_of_date": "2024-01-01"
}
```

---

### Contacts (requires X-Business-ID)

#### GET `/contacts` - List Contacts
**Query Params:** `contact_type`, `is_active`
**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Contact Name",
    "email": "string | null",
    "phone": "string | null",
    "contact_type": "customer | vendor | both",
    "billing_address": { "line1": "", "city": "", "state": "", "postal_code": "", "country": "" },
    "shipping_address": { "line1": "", "city": "", "state": "", "postal_code": "", "country": "" },
    "tax_id": "string | null",
    "notes": "string | null",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

#### POST `/contacts` - Create Contact
**Request:**
```json
{
  "name": "Contact Name",
  "email": "string",
  "phone": "string",
  "contact_type": "customer | vendor | both",
  "billing_address": { "line1": "", "city": "", "state": "", "postal_code": "", "country": "" },
  "shipping_address": { "line1": "", "city": "", "state": "", "postal_code": "", "country": "" },
  "tax_id": "string",
  "notes": "string"
}
```
**Response:** Contact object

#### GET `/contacts/{id}` - Get Contact
**Response:** Contact object

#### PATCH `/contacts/{id}` - Update Contact
**Request:** Partial contact object
**Response:** Updated contact object

#### DELETE `/contacts/{id}` - Delete Contact
**Response:** `204 No Content`

#### GET `/contacts/customers` - List Customers Only
**Response:** Array of contacts with `contact_type: "customer" | "both"`

#### GET `/contacts/vendors` - List Vendors Only
**Response:** Array of contacts with `contact_type: "vendor" | "both"`

---

### Invoices (requires X-Business-ID)

#### GET `/invoices` - List Invoices
**Query Params:** `status`, `limit`
**Response:**
```json
[
  {
    "id": "uuid",
    "invoice_number": "INV-001",
    "customer_id": "uuid",
    "customer_name": "Customer Name",
    "issue_date": "2024-01-01",
    "due_date": "2024-01-31",
    "currency": "USD",
    "subtotal": "1000.00",
    "tax_rate": "10.00",
    "tax_amount": "100.00",
    "discount_amount": "0.00",
    "total": "1100.00",
    "amount_paid": "0.00",
    "balance_due": "1100.00",
    "status": "draft | sent | paid | overdue | voided",
    "notes": "string | null",
    "terms": "string | null",
    "sent_at": "2024-01-01T00:00:00Z | null",
    "paid_at": "2024-01-01T00:00:00Z | null",
    "line_items": [
      {
        "id": "uuid",
        "account_id": "uuid",
        "description": "Service",
        "quantity": "1.00",
        "unit_price": "1000.00",
        "amount": "1000.00",
        "sort_order": 0
      }
    ],
    "payments": [],
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

#### POST `/invoices` - Create Invoice
**Request:**
```json
{
  "customer_id": "uuid",
  "issue_date": "2024-01-01",
  "due_date": "2024-01-31",
  "line_items": [
    {
      "account_id": "uuid",
      "description": "Service",
      "quantity": "1.00",
      "unit_price": "1000.00"
    }
  ],
  "tax_rate": "10.00",
  "discount_amount": "0.00",
  "notes": "string",
  "terms": "string"
}
```
**Response:** Invoice object

#### GET `/invoices/{id}` - Get Invoice
**Response:** Invoice object

#### POST `/invoices/{id}/send` - Mark Invoice as Sent
**Response:** Updated invoice object with `status: "sent"`

#### POST `/invoices/{id}/payments` - Record Payment
**Request:**
```json
{
  "amount": "500.00",
  "payment_date": "2024-01-15",
  "payment_method": "bank_transfer | check | cash | credit_card | other",
  "bank_account_id": "uuid",
  "reference": "string",
  "notes": "string"
}
```
**Response:** Updated invoice object

#### POST `/invoices/{id}/void` - Void Invoice
**Response:** Updated invoice object with `status: "voided"`

---

### Bills (requires X-Business-ID)

#### GET `/bills` - List Bills
**Query Params:** `status`, `limit`
**Response:**
```json
[
  {
    "id": "uuid",
    "bill_number": "BILL-001",
    "vendor_id": "uuid",
    "vendor_name": "Vendor Name",
    "bill_date": "2024-01-01",
    "due_date": "2024-01-31",
    "subtotal": "500.00",
    "tax_amount": "50.00",
    "total": "550.00",
    "amount_paid": "0.00",
    "balance_due": "550.00",
    "status": "draft | pending | paid | overdue | voided",
    "category_id": "uuid | null",
    "notes": "string | null",
    "attachment_url": "string | null",
    "paid_at": "2024-01-01T00:00:00Z | null",
    "line_items": [
      {
        "id": "uuid",
        "account_id": "uuid",
        "description": "Supplies",
        "amount": "500.00",
        "sort_order": 0
      }
    ],
    "payments": [],
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

#### POST `/bills` - Create Bill
**Request:**
```json
{
  "vendor_id": "uuid",
  "bill_number": "BILL-001",
  "bill_date": "2024-01-01",
  "due_date": "2024-01-31",
  "line_items": [
    {
      "account_id": "uuid",
      "description": "Supplies",
      "amount": "500.00"
    }
  ],
  "tax_amount": "50.00",
  "notes": "string"
}
```
**Response:** Bill object

#### GET `/bills/{id}` - Get Bill
**Response:** Bill object

#### POST `/bills/{id}/payments` - Record Payment
**Request:** Same as invoice payment
**Response:** Updated bill object

#### POST `/bills/{id}/void` - Void Bill
**Response:** Updated bill object with `status: "voided"`

---

### Expenses (requires X-Business-ID)

#### GET `/expenses` - List Expenses
**Query Params:** `limit`
**Response:**
```json
[
  {
    "id": "uuid",
    "date": "2024-01-01",
    "amount": "100.00",
    "category_id": "uuid",
    "category_name": "Office Supplies",
    "vendor_id": "uuid | null",
    "vendor_name": "string | null",
    "bank_account_id": "uuid",
    "description": "string | null",
    "reference": "string | null",
    "receipt_url": "string | null",
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

#### POST `/expenses` - Create Expense
**Request:**
```json
{
  "date": "2024-01-01",
  "amount": "100.00",
  "category_id": "uuid",
  "vendor_id": "uuid",
  "bank_account_id": "uuid",
  "description": "string",
  "reference": "string",
  "receipt_url": "string"
}
```
**Response:** Expense object

#### GET `/expenses/{id}` - Get Expense
**Response:** Expense object

#### DELETE `/expenses/{id}` - Delete Expense
**Response:** `204 No Content`

---

### Journal Entries (requires X-Business-ID)

#### GET `/journal-entries` - List Entries
**Query Params:** `status`, `limit`
**Response:**
```json
[
  {
    "id": "uuid",
    "entry_number": "JE-001",
    "entry_date": "2024-01-01",
    "description": "string | null",
    "source_type": "manual | invoice | bill | expense",
    "source_id": "uuid | null",
    "status": "draft | posted | voided",
    "posted_at": "2024-01-01T00:00:00Z | null",
    "voided_at": "2024-01-01T00:00:00Z | null",
    "void_reason": "string | null",
    "contact": {
      "id": "uuid",
      "name": "Contact Name",
      "type": "customer | vendor | both"
    } | null,
    "lines": [
      {
        "id": "uuid",
        "account_id": "uuid",
        "account_code": "1000",
        "account_name": "Cash",
        "description": "string | null",
        "debit": "1000.00",
        "credit": "0.00",
        "line_order": 0
      }
    ],
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

#### POST `/journal-entries` - Create Entry
**Request:**
```json
{
  "entry_date": "2024-01-01",
  "description": "string",
  "lines": [
    {
      "account_id": "uuid",
      "description": "string",
      "debit": "1000.00",
      "credit": "0.00"
    },
    {
      "account_id": "uuid",
      "description": "string",
      "debit": "0.00",
      "credit": "1000.00"
    }
  ],
  "auto_post": false
}
```
**Response:** Journal entry object

#### GET `/journal-entries/{id}` - Get Entry
**Response:** Journal entry object

#### POST `/journal-entries/{id}/post` - Post Entry
**Response:** Updated entry with `status: "posted"`

#### POST `/journal-entries/{id}/void` - Void Entry
**Request:**
```json
{
  "reason": "string"
}
```
**Response:** Updated entry with `status: "voided"`

#### GET `/journal-entries/ledger` - Get General Ledger
**Query Params:** `account_id`, `start_date`, `end_date`
**Response:** Array of ledger entries

#### GET `/journal-entries/trial-balance` - Get Trial Balance
**Response:**
```json
{
  "accounts": [
    {
      "account_id": "uuid",
      "account_code": "1000",
      "account_name": "Cash",
      "account_type": "asset",
      "debit": "5000.00",
      "credit": "0.00"
    }
  ],
  "total_debits": "10000.00",
  "total_credits": "10000.00",
  "difference": "0.00",
  "is_balanced": true
}
```

---

### Bank Accounts (requires X-Business-ID)

#### GET `/bank-accounts` - List Bank Accounts
**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Main Checking",
    "account_type": "checking | savings | credit_card | cash | other",
    "bank_name": "string | null",
    "account_number_last4": "1234 | null",
    "gl_account_id": "uuid",
    "opening_balance": "1000.00",
    "opening_balance_date": "2024-01-01",
    "current_balance": "5000.00",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

#### POST `/bank-accounts` - Create Bank Account
**Request:**
```json
{
  "name": "Main Checking",
  "account_type": "checking | savings | credit_card | cash | other",
  "bank_name": "string",
  "account_number_last4": "1234",
  "gl_account_id": "uuid",
  "opening_balance": "1000.00",
  "opening_balance_date": "2024-01-01"
}
```
**Response:** Bank account object

#### GET `/bank-accounts/{id}` - Get Bank Account
**Response:** Bank account object

#### PATCH `/bank-accounts/{id}` - Update Bank Account
**Request:** Partial bank account object
**Response:** Updated bank account object

---

### Bank Transactions (requires X-Business-ID)

#### GET `/bank-transactions` - List Transactions
**Query Params:** `bank_account_id`, `start_date`, `end_date`
**Response:**
```json
[
  {
    "id": "uuid",
    "bank_account_id": "uuid",
    "transaction_date": "2024-01-01",
    "amount": "100.00",
    "description": "string | null",
    "reference": "string | null",
    "account_id": "uuid | null",
    "contact_id": "uuid | null",
    "source": "manual | import",
    "is_reconciled": false,
    "matched_type": "string | null",
    "matched_id": "uuid | null",
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

#### POST `/bank-transactions` - Create Transaction
**Request:**
```json
{
  "bank_account_id": "uuid",
  "transaction_date": "2024-01-01",
  "amount": "100.00",
  "description": "string",
  "reference": "string"
}
```
**Response:** Bank transaction object

#### GET `/bank-transactions/{id}` - Get Transaction
**Response:** Bank transaction object

#### POST `/bank-transactions/{id}/categorize` - Categorize Transaction
**Request:**
```json
{
  "account_id": "uuid",
  "contact_id": "uuid"
}
```
**Response:** Updated bank transaction object

---

### Reconciliations (requires X-Business-ID)

#### GET `/reconciliations` - List Reconciliations
**Response:**
```json
[
  {
    "id": "uuid",
    "bank_account_id": "uuid",
    "statement_date": "2024-01-31",
    "statement_balance": "5000.00",
    "reconciled_balance": "5000.00",
    "difference": "0.00",
    "status": "in_progress | completed",
    "completed_at": "2024-01-31T00:00:00Z | null",
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

#### POST `/reconciliations/start` - Start Reconciliation
**Request:**
```json
{
  "bank_account_id": "uuid",
  "statement_date": "2024-01-31",
  "statement_balance": "5000.00"
}
```
**Response:** Reconciliation object

#### GET `/reconciliations/{id}` - Get Reconciliation
**Response:** Reconciliation object with transaction details

---

### Reports (requires X-Business-ID)

#### GET `/reports/profit-loss` - Profit & Loss Report
**Query Params:** `start_date`, `end_date`
**Response:**
```json
{
  "start_date": "2024-01-01",
  "end_date": "2024-12-31",
  "revenue": {
    "accounts": [
      { "account_id": "uuid", "account_code": "4000", "account_name": "Sales", "balance": "50000.00" }
    ],
    "total": "50000.00"
  },
  "expenses": {
    "accounts": [
      { "account_id": "uuid", "account_code": "5000", "account_name": "Cost of Goods", "balance": "20000.00" }
    ],
    "total": "20000.00"
  },
  "net_income": "30000.00"
}
```

#### GET `/reports/balance-sheet` - Balance Sheet
**Query Params:** `as_of_date`
**Response:**
```json
{
  "as_of_date": "2024-12-31",
  "assets": {
    "accounts": [
      { "account_id": "uuid", "account_code": "1000", "account_name": "Cash", "balance": "10000.00" }
    ],
    "total": "50000.00"
  },
  "liabilities": {
    "accounts": [
      { "account_id": "uuid", "account_code": "2000", "account_name": "Accounts Payable", "balance": "5000.00" }
    ],
    "total": "10000.00"
  },
  "equity": {
    "accounts": [
      { "account_id": "uuid", "account_code": "3000", "account_name": "Retained Earnings", "balance": "40000.00" }
    ],
    "total": "40000.00"
  }
}
```

#### GET `/reports/trial-balance` - Trial Balance
**Response:** Same as `/journal-entries/trial-balance`

#### GET `/reports/cash-flow` - Cash Flow Statement
**Query Params:** `start_date`, `end_date`
**Response:**
```json
{
  "start_date": "2024-01-01",
  "end_date": "2024-12-31",
  "operating": {
    "items": [
      { "description": "Net Income", "amount": "30000.00" },
      { "description": "Depreciation", "amount": "5000.00" }
    ],
    "net": "35000.00"
  },
  "investing": {
    "items": [
      { "description": "Equipment Purchase", "amount": "-10000.00" }
    ],
    "net": "-10000.00"
  },
  "financing": {
    "items": [
      { "description": "Loan Repayment", "amount": "-5000.00" }
    ],
    "net": "-5000.00"
  },
  "net_change": "20000.00",
  "beginning_balance": "5000.00",
  "ending_balance": "25000.00"
}
```

#### GET `/reports/invoice-aging` - AR Aging Report
**Response:**
```json
{
  "invoices": [
    {
      "id": "uuid",
      "invoice_number": "INV-001",
      "customer_name": "Customer",
      "due_date": "2024-01-01",
      "balance_due": "1000.00",
      "aging_bucket": "current | 1-30 | 31-60 | 61-90 | over_90"
    }
  ],
  "summary": {
    "current": "5000.00",
    "1-30": "2000.00",
    "31-60": "1000.00",
    "61-90": "500.00",
    "over_90": "200.00"
  },
  "total": "8700.00"
}
```

#### GET `/reports/bill-aging` - AP Aging Report
**Response:**
```json
{
  "bills": [
    {
      "id": "uuid",
      "bill_number": "BILL-001",
      "vendor_name": "Vendor",
      "due_date": "2024-01-01",
      "balance_due": "500.00",
      "aging_bucket": "current | 1-30 | 31-60 | 61-90 | over_90"
    }
  ],
  "summary": {
    "current": "3000.00",
    "1-30": "1000.00",
    "31-60": "500.00",
    "61-90": "200.00",
    "over_90": "100.00"
  },
  "total": "4800.00"
}
```

#### GET `/reports/dashboard` - Dashboard Metrics
**Response:**
```json
{
  "total_revenue": "50000.00",
  "total_expenses": "20000.00",
  "net_income": "30000.00",
  "accounts_receivable": "8700.00",
  "accounts_payable": "4800.00",
  "cash_balance": "25000.00",
  "overdue_invoices_count": 3,
  "overdue_bills_count": 2,
  "recent_transactions": []
}
```





## Notes

- All monetary values from API are strings (decimal format) - parse for calculations
- Dates from API are ISO 8601 format strings
- UUIDs are used for all entity IDs
- Status enums should be displayed with appropriate color-coded badges
- Implement optimistic updates where appropriate for better UX
- Use loading skeletons during data fetching
- Handle API errors gracefully with toast notifications
- Implement proper form validation before submission
- Add confirmation dialogs for destructive actions (void, delete)
- Handle empty page: if new data to be added then show button to add the data
- Always update file tree of claude.md file if there is any changes/ new file/ folder structure