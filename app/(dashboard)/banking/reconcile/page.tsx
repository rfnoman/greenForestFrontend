"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { bankAccountsApi } from "@/lib/api/bank-accounts";
import { reconciliationsApi } from "@/lib/api/reconciliations";
import { bankTransactionsApi } from "@/lib/api/bank-transactions";
import { useBusiness } from "@/lib/hooks/use-business";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { BankTransaction } from "@/lib/types";

export default function ReconcilePage() {
  const { currentBusiness } = useBusiness();
  const queryClient = useQueryClient();
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [statementDate, setStatementDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [statementBalance, setStatementBalance] = useState("");
  const [selectedTransactions, setSelectedTransactions] = useState<Set<string>>(new Set());
  const [isReconciling, setIsReconciling] = useState(false);

  const currency = currentBusiness?.currency || "USD";

  const { data: bankAccounts, isLoading: isLoadingAccounts } = useQuery({
    queryKey: ["bank-accounts"],
    queryFn: () => bankAccountsApi.list(),
  });

  const selectedAccount = bankAccounts?.find((a) => a.id === selectedAccountId);

  const { data: transactions, isLoading: isLoadingTransactions } = useQuery({
    queryKey: ["bank-transactions", { bank_account_id: selectedAccountId, is_reconciled: false }],
    queryFn: () => bankTransactionsApi.list({ bank_account_id: selectedAccountId }),
    enabled: !!selectedAccountId,
  });

  const unreconciledTransactions = transactions?.filter((t) => !t.is_reconciled) || [];

  const startReconciliation = useMutation({
    mutationFn: reconciliationsApi.start,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reconciliations"] });
      queryClient.invalidateQueries({ queryKey: ["bank-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["bank-accounts"] });
      toast.success("Reconciliation completed successfully");
      setIsReconciling(false);
      setSelectedTransactions(new Set());
      setStatementBalance("");
    },
    onError: () => {
      toast.error("Failed to complete reconciliation");
    },
  });

  const handleToggleTransaction = (transactionId: string) => {
    const newSelected = new Set(selectedTransactions);
    if (newSelected.has(transactionId)) {
      newSelected.delete(transactionId);
    } else {
      newSelected.add(transactionId);
    }
    setSelectedTransactions(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedTransactions.size === unreconciledTransactions.length) {
      setSelectedTransactions(new Set());
    } else {
      setSelectedTransactions(new Set(unreconciledTransactions.map((t) => t.id)));
    }
  };

  const calculateReconciledBalance = () => {
    if (!selectedAccount) return 0;
    const openingBalance = parseFloat(selectedAccount.current_balance);
    const selectedTotal = unreconciledTransactions
      .filter((t) => selectedTransactions.has(t.id))
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    return openingBalance + selectedTotal;
  };

  const reconciledBalance = calculateReconciledBalance();
  const statementBalanceNum = parseFloat(statementBalance) || 0;
  const difference = statementBalanceNum - reconciledBalance;

  const handleStartReconciliation = () => {
    if (!selectedAccountId || !statementBalance || !statementDate) {
      toast.error("Please fill in all required fields");
      return;
    }
    setIsReconciling(true);
  };

  const handleCompleteReconciliation = () => {
    if (Math.abs(difference) > 0.01) {
      toast.error("Statement balance must match reconciled balance");
      return;
    }

    startReconciliation.mutate({
      bank_account_id: selectedAccountId,
      statement_date: statementDate,
      statement_balance: statementBalance,
      transaction_ids: Array.from(selectedTransactions),
    });
  };

  if (isLoadingAccounts) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reconcile</h1>
          <p className="text-muted-foreground">Reconcile your bank accounts</p>
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reconcile</h1>
        <p className="text-muted-foreground">Reconcile your bank accounts</p>
      </div>

      {!isReconciling ? (
        <Card>
          <CardHeader>
            <CardTitle>Start Reconciliation</CardTitle>
            <CardDescription>
              Select a bank account and enter your statement details to begin
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Bank Account</Label>
                <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {bankAccounts?.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Statement Date</Label>
                <Input
                  type="date"
                  value={statementDate}
                  onChange={(e) => setStatementDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Statement Ending Balance</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={statementBalance}
                  onChange={(e) => setStatementBalance(e.target.value)}
                />
              </div>
            </div>

            {selectedAccount && (
              <div className="rounded-lg border p-4 bg-muted/50">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Balance</p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(selectedAccount.current_balance, currency)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Unreconciled Transactions</p>
                    <p className="text-lg font-semibold">{unreconciledTransactions.length}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button
                onClick={handleStartReconciliation}
                disabled={!selectedAccountId || !statementBalance}
              >
                Start Reconciliation
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Statement Balance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(statementBalance, currency)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Reconciled Balance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(reconciledBalance.toString(), currency)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Difference</CardDescription>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${Math.abs(difference) < 0.01 ? "text-green-600" : "text-red-600"}`}>
                  {formatCurrency(difference.toString(), currency)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Selected</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {selectedTransactions.size} / {unreconciledTransactions.length}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Unreconciled Transactions</CardTitle>
                  <CardDescription>
                    Select the transactions that appear on your statement
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={handleSelectAll}>
                    {selectedTransactions.size === unreconciledTransactions.length
                      ? "Deselect All"
                      : "Select All"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoadingTransactions ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : unreconciledTransactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p>All transactions are reconciled!</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {unreconciledTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className={`flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedTransactions.has(transaction.id)
                          ? "bg-primary/5 border-primary"
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => handleToggleTransaction(transaction.id)}
                    >
                      <Checkbox
                        checked={selectedTransactions.has(transaction.id)}
                        onCheckedChange={() => handleToggleTransaction(transaction.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {transaction.description || "No description"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(transaction.transaction_date)}
                          {transaction.reference && ` • ${transaction.reference}`}
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-semibold ${
                            parseFloat(transaction.amount) >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {formatCurrency(transaction.amount, currency)}
                        </p>
                        {transaction.account_id ? (
                          <Badge variant="secondary" className="text-xs">
                            Categorized
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            Uncategorized
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setIsReconciling(false);
                setSelectedTransactions(new Set());
              }}
            >
              Cancel
            </Button>
            <div className="flex items-center gap-4">
              {Math.abs(difference) < 0.01 ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">Balanced</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-amber-600">
                  <AlertCircle className="h-5 w-5" />
                  <span className="text-sm font-medium">
                    Difference of {formatCurrency(Math.abs(difference).toString(), currency)}
                  </span>
                </div>
              )}
              <Button
                onClick={handleCompleteReconciliation}
                disabled={Math.abs(difference) > 0.01 || startReconciliation.isPending}
              >
                {startReconciliation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Complete Reconciliation
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
