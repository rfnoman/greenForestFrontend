"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import {
  Download,
  Printer,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
} from "lucide-react";
import { reportsApi } from "@/lib/api/reports";
import { useBusiness } from "@/lib/hooks/use-business";
import { formatCurrency } from "@/lib/utils/format";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export default function CashFlowPage() {
  const { currentBusiness } = useBusiness();
  const currency = currentBusiness?.currency || "USD";

  const [startDate, setStartDate] = useState(
    format(startOfMonth(subMonths(new Date(), 11)), "yyyy-MM-dd")
  );
  const [endDate, setEndDate] = useState(
    format(endOfMonth(new Date()), "yyyy-MM-dd")
  );

  const { data: report, isLoading } = useQuery({
    queryKey: ["reports", "cash-flow", startDate, endDate],
    queryFn: () => reportsApi.getCashFlow(startDate, endDate),
  });

  const operatingCash = parseFloat(report?.operating?.net || "0");
  const investingCash = parseFloat(report?.investing?.net || "0");
  const financingCash = parseFloat(report?.financing?.net || "0");
  const netChange = parseFloat(report?.net_change || "0");
  const beginningBalance = parseFloat(report?.beginning_balance || "0");
  const endingBalance = parseFloat(report?.ending_balance || "0");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cash Flow</h1>
          <p className="text-muted-foreground">
            Cash inflows and outflows for the selected period
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Printer className="mr-2 h-4 w-4" />
            Print
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Date Range</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-8 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Operating Activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {operatingCash >= 0 ? (
                    <ArrowUpRight className="h-5 w-5 text-green-600" />
                  ) : (
                    <ArrowDownRight className="h-5 w-5 text-red-600" />
                  )}
                  <span
                    className={`text-2xl font-bold ${
                      operatingCash >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {formatCurrency(operatingCash.toString(), currency)}
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Investing Activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {investingCash >= 0 ? (
                    <ArrowUpRight className="h-5 w-5 text-green-600" />
                  ) : (
                    <ArrowDownRight className="h-5 w-5 text-red-600" />
                  )}
                  <span
                    className={`text-2xl font-bold ${
                      investingCash >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {formatCurrency(investingCash.toString(), currency)}
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Financing Activities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {financingCash >= 0 ? (
                    <ArrowUpRight className="h-5 w-5 text-green-600" />
                  ) : (
                    <ArrowDownRight className="h-5 w-5 text-red-600" />
                  )}
                  <span
                    className={`text-2xl font-bold ${
                      financingCash >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {formatCurrency(financingCash.toString(), currency)}
                  </span>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Net Cash Change</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-blue-600" />
                  <span
                    className={`text-2xl font-bold ${
                      netChange >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {formatCurrency(netChange.toString(), currency)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Cash Flow Statement</CardTitle>
              <CardDescription>
                {format(new Date(startDate), "MMMM d, yyyy")} -{" "}
                {format(new Date(endDate), "MMMM d, yyyy")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between py-2 px-4 bg-muted rounded-lg">
                <span className="font-medium">Beginning Cash Balance</span>
                <span className="font-bold">
                  {formatCurrency(beginningBalance.toString(), currency)}
                </span>
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-4">Operating Activities</h3>
                {report?.operating?.items?.length ? (
                  <div className="space-y-2">
                    {report.operating.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-2 px-4 rounded-md hover:bg-muted/50"
                      >
                        <span>{item.description}</span>
                        <span
                          className={`font-medium ${
                            parseFloat(item.amount) >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {formatCurrency(item.amount, currency)}
                        </span>
                      </div>
                    ))}
                    <Separator />
                    <div className="flex items-center justify-between py-2 px-4 font-semibold">
                      <span>Net Cash from Operating</span>
                      <span
                        className={
                          operatingCash >= 0 ? "text-green-600" : "text-red-600"
                        }
                      >
                        {formatCurrency(report.operating.net, currency)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm py-4 px-4">
                    No operating activities for this period
                  </p>
                )}
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-4">Investing Activities</h3>
                {report?.investing?.items?.length ? (
                  <div className="space-y-2">
                    {report.investing.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-2 px-4 rounded-md hover:bg-muted/50"
                      >
                        <span>{item.description}</span>
                        <span
                          className={`font-medium ${
                            parseFloat(item.amount) >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {formatCurrency(item.amount, currency)}
                        </span>
                      </div>
                    ))}
                    <Separator />
                    <div className="flex items-center justify-between py-2 px-4 font-semibold">
                      <span>Net Cash from Investing</span>
                      <span
                        className={
                          investingCash >= 0 ? "text-green-600" : "text-red-600"
                        }
                      >
                        {formatCurrency(report.investing.net, currency)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm py-4 px-4">
                    No investing activities for this period
                  </p>
                )}
              </div>

              <div>
                <h3 className="font-semibold text-lg mb-4">Financing Activities</h3>
                {report?.financing?.items?.length ? (
                  <div className="space-y-2">
                    {report.financing.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-2 px-4 rounded-md hover:bg-muted/50"
                      >
                        <span>{item.description}</span>
                        <span
                          className={`font-medium ${
                            parseFloat(item.amount) >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {formatCurrency(item.amount, currency)}
                        </span>
                      </div>
                    ))}
                    <Separator />
                    <div className="flex items-center justify-between py-2 px-4 font-semibold">
                      <span>Net Cash from Financing</span>
                      <span
                        className={
                          financingCash >= 0 ? "text-green-600" : "text-red-600"
                        }
                      >
                        {formatCurrency(report.financing.net, currency)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm py-4 px-4">
                    No financing activities for this period
                  </p>
                )}
              </div>

              <Separator className="my-6" />

              <div className="space-y-2">
                <div className="flex items-center justify-between py-2 px-4">
                  <span className="font-medium">Net Change in Cash</span>
                  <span
                    className={`font-bold ${
                      netChange >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {formatCurrency(netChange.toString(), currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-4 px-4 bg-muted rounded-lg">
                  <span className="text-lg font-bold">Ending Cash Balance</span>
                  <span className="text-xl font-bold">
                    {formatCurrency(endingBalance.toString(), currency)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
