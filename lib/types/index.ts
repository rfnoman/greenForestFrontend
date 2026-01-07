// Auth
export interface TokenResponse {
  access: string;
  refresh: string;
}

// User
export interface User {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
  is_email_verified: boolean;
  is_active: boolean;
  date_joined: string;
}

// Business
export interface Business {
  id: string;
  name: string;
  slug: string;
  industry: string | null;
  currency: string;
  fiscal_year_end_month: number;
  email: string | null;
  phone: string | null;
  address: Address | null;
  tax_id: string | null;
  logo_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface BusinessMember {
  id: string;
  user_id: string;
  user_email: string;
  business_id: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  is_active: boolean;
  accepted_at: string | null;
  created_at: string;
}

// Address
export interface Address {
  line1?: string;
  line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

// Account
export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
export type NormalBalance = 'debit' | 'credit';

export interface Account {
  id: string;
  code: string;
  name: string;
  description: string | null;
  account_type: AccountType;
  normal_balance: NormalBalance;
  parent_id: string | null;
  is_control_account: boolean;
  is_system: boolean;
  is_active: boolean;
  is_bank_account: boolean;
}

// Contact
export type ContactType = 'customer' | 'vendor' | 'both';

export interface Contact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  contact_type: ContactType;
  billing_address: Address | null;
  shipping_address: Address | null;
  tax_id: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
}

// Invoice
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'voided';

export interface InvoiceLineItem {
  id: string;
  account_id: string;
  description: string;
  quantity: string;
  unit_price: string;
  amount: string;
  sort_order: number;
}

export interface InvoicePayment {
  id: string;
  amount: string;
  payment_date: string;
  payment_method: PaymentMethod;
  reference: string | null;
  notes: string | null;
  bank_account_id: string;
  created_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: string;
  customer_name: string;
  issue_date: string;
  due_date: string;
  currency: string;
  subtotal: string;
  tax_rate: string;
  tax_amount: string;
  discount_amount: string;
  total: string;
  amount_paid: string;
  balance_due: string;
  status: InvoiceStatus;
  notes: string | null;
  terms: string | null;
  sent_at: string | null;
  paid_at: string | null;
  line_items: InvoiceLineItem[];
  payments: InvoicePayment[];
  created_at: string;
}

// Bill
export type BillStatus = 'draft' | 'pending' | 'paid' | 'overdue' | 'voided';

export interface BillLineItem {
  id: string;
  account_id: string;
  description: string;
  amount: string;
  sort_order: number;
}

export interface Bill {
  id: string;
  bill_number: string;
  vendor_id: string;
  vendor_name: string;
  bill_date: string;
  due_date: string;
  subtotal: string;
  tax_amount: string;
  total: string;
  amount_paid: string;
  balance_due: string;
  status: BillStatus;
  category_id: string | null;
  notes: string | null;
  attachment_url: string | null;
  paid_at: string | null;
  line_items: BillLineItem[];
  payments: InvoicePayment[];
  created_at: string;
}

// Expense
export interface Expense {
  id: string;
  date: string;
  amount: string;
  category_id: string;
  category_name: string;
  vendor_id: string | null;
  vendor_name: string | null;
  bank_account_id: string;
  description: string | null;
  reference: string | null;
  receipt_url: string | null;
  created_at: string;
}

// Journal Entry
export type JournalEntryStatus = 'draft' | 'posted' | 'voided';
export type SourceType = 'manual' | 'invoice' | 'bill' | 'expense';

export interface JournalEntryLine {
  id: string;
  account_id: string;
  account_code: string;
  account_name: string;
  description: string | null;
  debit: string;
  credit: string;
  line_order: number;
}

export interface JournalEntry {
  id: string;
  entry_number: string;
  entry_date: string;
  description: string | null;
  source_type: SourceType;
  source_id: string | null;
  status: JournalEntryStatus;
  posted_at: string | null;
  voided_at: string | null;
  void_reason: string | null;
  lines: JournalEntryLine[];
  created_at: string;
}

// Bank Account
export type BankAccountType = 'checking' | 'savings' | 'credit_card' | 'cash' | 'other';

export interface BankAccount {
  id: string;
  name: string;
  account_type: BankAccountType;
  bank_name: string | null;
  account_number_last4: string | null;
  gl_account_id: string;
  opening_balance: string;
  opening_balance_date: string;
  current_balance: string;
  is_active: boolean;
  created_at: string;
}

// Bank Transaction
export interface BankTransaction {
  id: string;
  bank_account_id: string;
  transaction_date: string;
  amount: string;
  description: string | null;
  reference: string | null;
  account_id: string | null;
  contact_id: string | null;
  source: 'manual' | 'import';
  is_reconciled: boolean;
  matched_type: string | null;
  matched_id: string | null;
  created_at: string;
}

// Reconciliation
export interface Reconciliation {
  id: string;
  bank_account_id: string;
  statement_date: string;
  statement_balance: string;
  reconciled_balance: string;
  difference: string;
  status: 'in_progress' | 'completed';
  completed_at: string | null;
  created_at: string;
}

// Payment
export type PaymentMethod = 'bank_transfer' | 'check' | 'cash' | 'credit_card' | 'other';

// Reports
export interface DashboardData {
  total_revenue: string;
  total_expenses: string;
  net_income: string;
  accounts_receivable: string;
  accounts_payable: string;
  cash_balance: string;
  overdue_invoices_count: number;
  overdue_bills_count: number;
  recent_transactions: BankTransaction[];
}

export interface ProfitLossReport {
  start_date: string;
  end_date: string;
  revenue: { accounts: AccountBalance[]; total: string };
  expenses: { accounts: AccountBalance[]; total: string };
  net_income: string;
}

export interface BalanceSheetReport {
  as_of_date: string;
  assets: { accounts: AccountBalance[]; total: string };
  liabilities: { accounts: AccountBalance[]; total: string };
  equity: { accounts: AccountBalance[]; total: string };
}

export interface CashFlowSection {
  items: CashFlowItem[];
  net: string;
  total?: string;
}

export interface CashFlowReport {
  start_date: string;
  end_date: string;
  operating: CashFlowSection;
  investing: CashFlowSection;
  financing: CashFlowSection;
  net_change: string;
  beginning_balance: string;
  ending_balance: string;
}

export interface CashFlowItem {
  description: string;
  amount: string;
}

export interface AccountBalance {
  account_id: string;
  account_code: string;
  account_name: string;
  balance: string;
}

export interface TrialBalance {
  accounts: TrialBalanceAccount[];
  total_debits: string;
  total_credits: string;
  difference: string;
  is_balanced: boolean;
}

export interface TrialBalanceAccount {
  account_id: string;
  account_code: string;
  account_name: string;
  account_type: AccountType;
  debit: string;
  credit: string;
}

export interface AgingReport {
  contacts: AgingContact[];
  totals: AgingBuckets;
}

export interface AgingContact {
  contact_id: string;
  contact_name: string;
  current: string;
  days_1_30: string;
  days_31_60: string;
  days_61_90: string;
  over_90: string;
  total: string;
}

export interface AgingBuckets {
  current: string;
  days_1_30: string;
  days_31_60: string;
  days_61_90: string;
  over_90: string;
  total: string;
}

// Invoice Aging Report
export interface InvoiceAgingItem {
  id: string;
  invoice_number: string;
  customer_name: string;
  due_date: string;
  balance_due: string;
  aging_bucket: string;
}

export interface InvoiceAgingReport {
  invoices: InvoiceAgingItem[];
  summary: Record<string, string>;
  total: string;
}

// Bill Aging Report
export interface BillAgingItem {
  id: string;
  bill_number: string;
  vendor_name: string;
  due_date: string;
  balance_due: string;
  aging_bucket: string;
}

export interface BillAgingReport {
  bills: BillAgingItem[];
  summary: Record<string, string>;
  total: string;
}

// API Response Types
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// Form Input Types
export interface LoginInput {
  email: string;
  password: string;
}

export interface CreateInvoiceInput {
  customer_id: string;
  issue_date: string;
  due_date: string;
  line_items: CreateInvoiceLineItem[];
  tax_rate?: string;
  discount_amount?: string;
  notes?: string;
  terms?: string;
}

export interface CreateInvoiceLineItem {
  account_id: string;
  description: string;
  quantity: string;
  unit_price: string;
}

export interface CreateBillInput {
  vendor_id: string;
  bill_number?: string;
  bill_date: string;
  due_date: string;
  line_items: CreateBillLineItem[];
  tax_amount?: string;
  notes?: string;
}

export interface CreateBillLineItem {
  account_id: string;
  description: string;
  amount: string;
}

export interface CreateExpenseInput {
  date: string;
  amount: string;
  category_id: string;
  vendor_id?: string;
  bank_account_id: string;
  description?: string;
  reference?: string;
  receipt_url?: string;
}

export interface CreateJournalEntryInput {
  entry_date: string;
  description?: string;
  lines: CreateJournalEntryLine[];
  auto_post?: boolean;
}

export interface CreateJournalEntryLine {
  account_id: string;
  description?: string;
  debit: string;
  credit: string;
}

export interface CreateContactInput {
  name: string;
  email?: string;
  phone?: string;
  contact_type: ContactType;
  billing_address?: Address;
  shipping_address?: Address;
  tax_id?: string;
  notes?: string;
}

export interface CreateAccountInput {
  code: string;
  name: string;
  description?: string;
  account_type: AccountType;
  parent_id?: string;
}

export interface RecordPaymentInput {
  amount: string;
  payment_date: string;
  payment_method: PaymentMethod;
  bank_account_id: string;
  reference?: string;
  notes?: string;
}

export interface CreateBankAccountInput {
  name: string;
  account_type: BankAccountType;
  bank_name?: string;
  account_number_last4?: string;
  gl_account_id: string;
  opening_balance: string;
  opening_balance_date: string;
}

export interface CreateBankTransactionInput {
  bank_account_id: string;
  transaction_date: string;
  amount: string;
  description?: string;
  reference?: string;
}

export interface CategorizeTransactionInput {
  account_id: string;
  contact_id?: string;
}

export interface StartReconciliationInput {
  bank_account_id: string;
  statement_date: string;
  statement_balance: string;
}
