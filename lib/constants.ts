export const ACCOUNT_TYPES = [
  { value: "asset", label: "Asset" },
  { value: "liability", label: "Liability" },
  { value: "equity", label: "Equity" },
  { value: "revenue", label: "Revenue" },
  { value: "expense", label: "Expense" },
] as const;

export const CONTACT_TYPES = [
  { value: "customer", label: "Customer" },
  { value: "vendor", label: "Vendor" },
  { value: "both", label: "Both" },
] as const;

export const INVOICE_STATUSES = [
  { value: "draft", label: "Draft", color: "bg-gray-100 text-gray-800" },
  { value: "sent", label: "Sent", color: "bg-blue-100 text-blue-800" },
  { value: "paid", label: "Paid", color: "bg-green-100 text-green-800" },
  { value: "overdue", label: "Overdue", color: "bg-red-100 text-red-800" },
  { value: "voided", label: "Voided", color: "bg-gray-100 text-gray-500" },
] as const;

export const BILL_STATUSES = [
  { value: "draft", label: "Draft", color: "bg-gray-100 text-gray-800" },
  { value: "pending", label: "Pending", color: "bg-yellow-100 text-yellow-800" },
  { value: "paid", label: "Paid", color: "bg-green-100 text-green-800" },
  { value: "overdue", label: "Overdue", color: "bg-red-100 text-red-800" },
  { value: "voided", label: "Voided", color: "bg-gray-100 text-gray-500" },
] as const;

export const JOURNAL_ENTRY_STATUSES = [
  { value: "draft", label: "Draft", color: "bg-gray-100 text-gray-800" },
  { value: "posted", label: "Posted", color: "bg-green-100 text-green-800" },
  { value: "voided", label: "Voided", color: "bg-gray-100 text-gray-500" },
] as const;

export const PAYMENT_METHODS = [
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "check", label: "Check" },
  { value: "cash", label: "Cash" },
  { value: "credit_card", label: "Credit Card" },
  { value: "other", label: "Other" },
] as const;

export const BANK_ACCOUNT_TYPES = [
  { value: "checking", label: "Checking" },
  { value: "savings", label: "Savings" },
  { value: "credit_card", label: "Credit Card" },
  { value: "cash", label: "Cash" },
  { value: "other", label: "Other" },
] as const;

export const FISCAL_MONTHS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
] as const;

export const CURRENCIES = [
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "CAD", label: "CAD - Canadian Dollar" },
  { value: "AUD", label: "AUD - Australian Dollar" },
  { value: "JPY", label: "JPY - Japanese Yen" },
  { value: "INR", label: "INR - Indian Rupee" },
  { value: "BDT", label: "BDT - Bangladeshi Taka" },
] as const;

// Alias for FISCAL_MONTHS for convenience
export const MONTHS = FISCAL_MONTHS;
