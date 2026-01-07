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
│   │   ├── login/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx                    # Dashboard overview
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

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/token/pair` | Login - returns access & refresh tokens |
| POST | `/token/refresh/` | Refresh access token |
| POST | `/token/blacklist/` | Logout - invalidate refresh token |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/users/me` | Get current user profile |
| PATCH | `/users/me` | Update current user profile |

### Businesses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/businesses` | List user's businesses |
| POST | `/businesses` | Create new business |
| GET | `/businesses/{id}` | Get business details |
| PATCH | `/businesses/{id}` | Update business |
| GET | `/businesses/{id}/members` | List business members |
| POST | `/businesses/{id}/members/invite` | Invite member |
| DELETE | `/businesses/{id}/members/{user_id}` | Remove member |

### Chart of Accounts (requires X-Business-ID)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/accounts` | List accounts (filter: account_type, is_active) |
| POST | `/accounts` | Create account |
| GET | `/accounts/{id}` | Get account |
| PATCH | `/accounts/{id}` | Update account |
| GET | `/accounts/{id}/balance` | Get account balance |

### Contacts (requires X-Business-ID)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/contacts` | List contacts (filter: contact_type, is_active) |
| POST | `/contacts` | Create contact |
| GET | `/contacts/{id}` | Get contact |
| PATCH | `/contacts/{id}` | Update contact |
| DELETE | `/contacts/{id}` | Delete contact |
| GET | `/contacts/customers` | List customers only |
| GET | `/contacts/vendors` | List vendors only |

### Invoices (requires X-Business-ID)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/invoices` | List invoices (filter: status, limit) |
| POST | `/invoices` | Create invoice |
| GET | `/invoices/{id}` | Get invoice |
| POST | `/invoices/{id}/send` | Mark invoice as sent |
| POST | `/invoices/{id}/payments` | Record payment |
| POST | `/invoices/{id}/void` | Void invoice |

### Bills (requires X-Business-ID)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/bills` | List bills (filter: status, limit) |
| POST | `/bills` | Create bill |
| GET | `/bills/{id}` | Get bill |
| POST | `/bills/{id}/payments` | Record payment |
| POST | `/bills/{id}/void` | Void bill |

### Expenses (requires X-Business-ID)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/expenses` | List expenses (filter: limit) |
| POST | `/expenses` | Create expense |
| GET | `/expenses/{id}` | Get expense |
| DELETE | `/expenses/{id}` | Delete expense |

### Journal Entries (requires X-Business-ID)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/journal-entries` | List entries (filter: status, limit) |
| POST | `/journal-entries` | Create entry |
| GET | `/journal-entries/{id}` | Get entry |
| POST | `/journal-entries/{id}/post` | Post entry |
| POST | `/journal-entries/{id}/void` | Void entry |
| GET | `/journal-entries/ledger` | Get general ledger |
| GET | `/journal-entries/trial-balance` | Get trial balance |

### Bank Accounts (requires X-Business-ID)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/bank-accounts` | List bank accounts |
| POST | `/bank-accounts` | Create bank account |
| GET | `/bank-accounts/{id}` | Get bank account |
| PATCH | `/bank-accounts/{id}` | Update bank account |

### Bank Transactions (requires X-Business-ID)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/bank-transactions` | List transactions |
| POST | `/bank-transactions` | Create transaction |
| GET | `/bank-transactions/{id}` | Get transaction |
| POST | `/bank-transactions/{id}/categorize` | Categorize transaction |

### Reconciliations (requires X-Business-ID)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/reconciliations` | List reconciliations |
| POST | `/reconciliations/start` | Start reconciliation |
| GET | `/reconciliations/{id}` | Get reconciliation |

### Reports (requires X-Business-ID)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/reports/profit-loss` | P&L report (params: start_date, end_date) |
| GET | `/reports/balance-sheet` | Balance sheet (params: as_of_date) |
| GET | `/reports/trial-balance` | Trial balance |
| GET | `/reports/cash-flow` | Cash flow (params: start_date, end_date) |
| GET | `/reports/invoice-aging` | AR aging report |
| GET | `/reports/bill-aging` | AP aging report |
| GET | `/reports/dashboard` | Dashboard metrics |





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