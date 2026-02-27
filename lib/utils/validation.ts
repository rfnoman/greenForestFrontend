import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirm_password: z.string().min(1, "Please confirm your password"),
  user_type: z.enum(["owner", "manager"], {
    required_error: "Please select an account type",
  }),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"],
});

export const invoiceSchema = z.object({
  customer_id: z.string().uuid("Please select a customer"),
  issue_date: z.string().min(1, "Issue date is required"),
  due_date: z.string().min(1, "Due date is required"),
  line_items: z
    .array(
      z.object({
        account_id: z.string().uuid("Please select an account"),
        description: z.string().min(1, "Description is required"),
        quantity: z.string().refine((v) => parseFloat(v) > 0, "Quantity must be positive"),
        unit_price: z.string().refine((v) => parseFloat(v) >= 0, "Price must be non-negative"),
      })
    )
    .min(1, "At least one line item is required"),
  tax_rate: z.string().optional(),
  discount_amount: z.string().optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
});

export const billSchema = z.object({
  vendor_id: z.string().uuid("Please select a vendor"),
  bill_number: z.string().optional(),
  bill_date: z.string().min(1, "Bill date is required"),
  due_date: z.string().min(1, "Due date is required"),
  line_items: z
    .array(
      z.object({
        account_id: z.string().uuid("Please select an account"),
        description: z.string().min(1, "Description is required"),
        amount: z.string().refine((v) => parseFloat(v) > 0, "Amount must be positive"),
      })
    )
    .min(1, "At least one line item is required"),
  tax_amount: z.string().optional(),
  notes: z.string().optional(),
});

export const expenseSchema = z.object({
  date: z.string().min(1, "Date is required"),
  amount: z.string().refine((v) => parseFloat(v) > 0, "Amount must be positive"),
  category_id: z.string().uuid("Please select a category"),
  vendor_id: z.string().uuid().optional().or(z.literal("")),
  bank_account_id: z.string().uuid("Please select a bank account"),
  description: z.string().optional(),
  reference: z.string().optional(),
  receipt_url: z.string().url().optional().or(z.literal("")),
});

export const incomeSchema = z.object({
  date: z.string().min(1, "Date is required"),
  amount: z.string().refine((v) => parseFloat(v) > 0, "Amount must be positive"),
  income_type: z.string().min(1, "Please select an income type"),
  category_id: z.string().uuid("Please select a category"),
  payment_method: z.enum(["bank", "cash"]),
  bank_account_id: z.string().uuid("Please select a bank account").optional().or(z.literal("")),
  description: z.string().min(1, "Description is required"),
  contact_id: z.string().uuid().optional().or(z.literal("")),
  reference: z.string().optional(),
  receipt_url: z.string().url().optional().or(z.literal("")),
}).refine(
  (data) => data.payment_method !== "bank" || (data.bank_account_id && data.bank_account_id !== ""),
  { message: "Please select a bank account", path: ["bank_account_id"] }
);

export const contactSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  contact_type: z.enum(["customer", "vendor", "both"]),
  billing_address: z
    .object({
      line1: z.string().optional(),
      line2: z.string().optional(),
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      postal_code: z.string().optional(),
      zip: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
  shipping_address: z
    .object({
      line1: z.string().optional(),
      line2: z.string().optional(),
      street: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      postal_code: z.string().optional(),
      zip: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
  tax_id: z.string().optional(),
  website: z.string().optional(),
  notes: z.string().optional(),
});

export const accountSchema = z.object({
  code: z.string().min(1, "Account code is required"),
  name: z.string().min(1, "Account name is required"),
  description: z.string().optional(),
  account_type: z.enum(["asset", "liability", "equity", "revenue", "expense"]),
  parent_id: z.string().uuid().optional().or(z.literal("")),
});

export const journalEntrySchema = z.object({
  entry_date: z.string().min(1, "Date is required"),
  description: z.string().optional(),
  lines: z
    .array(
      z.object({
        account_id: z.string().uuid("Please select an account"),
        description: z.string().optional(),
        debit: z.string(),
        credit: z.string(),
      })
    )
    .min(2, "At least two lines required")
    .refine(
      (lines) => {
        const totalDebit = lines.reduce((sum, l) => sum + parseFloat(l.debit || "0"), 0);
        const totalCredit = lines.reduce((sum, l) => sum + parseFloat(l.credit || "0"), 0);
        return Math.abs(totalDebit - totalCredit) < 0.01;
      },
      { message: "Debits must equal credits" }
    ),
  auto_post: z.boolean().optional(),
});

export const paymentSchema = z.object({
  amount: z.string().refine((v) => parseFloat(v) > 0, "Amount must be positive"),
  payment_date: z.string().min(1, "Payment date is required"),
  payment_method: z.enum(["bank_transfer", "check", "cash", "credit_card", "other"]),
  bank_account_id: z.string().uuid("Please select a bank account"),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

export const bankAccountSchema = z.object({
  name: z.string().min(1, "Account name is required"),
  account_type: z.enum(["checking", "savings", "credit_card", "cash", "other"]),
  bank_name: z.string().optional(),
  account_number_last4: z
    .string()
    .max(4, "Only last 4 digits")
    .optional()
    .or(z.literal("")),
  gl_account_id: z.string().uuid("Please select a GL account"),
  opening_balance: z.string(),
  opening_balance_date: z.string().min(1, "Opening balance date is required"),
});

export const bankTransactionSchema = z.object({
  bank_account_id: z.string().uuid("Please select a bank account"),
  transaction_date: z.string().min(1, "Transaction date is required"),
  amount: z.string().refine((v) => parseFloat(v) !== 0, "Amount cannot be zero"),
  description: z.string().optional(),
  reference: z.string().optional(),
});

export const reconciliationSchema = z.object({
  bank_account_id: z.string().uuid("Please select a bank account"),
  statement_date: z.string().min(1, "Statement date is required"),
  statement_balance: z.string().min(1, "Statement balance is required"),
});

export const businessSchema = z.object({
  name: z.string().min(1, "Business name is required"),
  industry: z.string().optional(),
  currency: z.string().min(1, "Currency is required"),
  fiscal_year_end_month: z.number().min(1).max(12),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z
    .object({
      line1: z.string().optional(),
      line2: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      postal_code: z.string().optional(),
      country: z.string().optional(),
    })
    .optional(),
  tax_id: z.string().optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type InvoiceFormData = z.infer<typeof invoiceSchema>;
export type BillFormData = z.infer<typeof billSchema>;
export type ExpenseFormData = z.infer<typeof expenseSchema>;
export type IncomeFormData = z.infer<typeof incomeSchema>;
export type ContactFormData = z.infer<typeof contactSchema>;
export type AccountFormData = z.infer<typeof accountSchema>;
export type JournalEntryFormData = z.infer<typeof journalEntrySchema>;
export type PaymentFormData = z.infer<typeof paymentSchema>;
export type BankAccountFormData = z.infer<typeof bankAccountSchema>;
export type BankTransactionFormData = z.infer<typeof bankTransactionSchema>;
export type ReconciliationFormData = z.infer<typeof reconciliationSchema>;
export type BusinessFormData = z.infer<typeof businessSchema>;
