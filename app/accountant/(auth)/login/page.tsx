"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Leaf, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api/client";
import { authApi } from "@/lib/api/auth";
import { loginSchema, LoginFormData } from "@/lib/utils/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const ACCESS_TOKEN_KEY = "greenforest_accountant_access_token";
const REFRESH_TOKEN_KEY = "greenforest_accountant_refresh_token";
const ROLE_ID_KEY = "greenforest_role_id";

export default function AccountantLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const { access, refresh, role_id } = await authApi.login({ email: data.email, password: data.password });

      // Temporarily set token to fetch user data
      apiClient.setAccessToken(access);
      const userData = await authApi.getMe();

      // Allow both accountant and accountant_supervisor to login
      if (userData.user_type !== 'accountant' && userData.user_type !== 'accountant_supervisor') {
        apiClient.setAccessToken(null);
        throw new Error('Access denied. Only accountants and supervisors can login to this portal.');
      }

      // Store tokens with appropriate keys based on user type
      if (userData.user_type === 'accountant_supervisor') {
        localStorage.setItem("greenforest_supervisor_access_token", access);
        localStorage.setItem("greenforest_supervisor_refresh_token", refresh);
        localStorage.setItem("greenforest_supervisor_role_id", role_id);
        toast.success("Welcome back, Supervisor!");
        router.push("/accountant-supervisor/dashboard");
      } else {
        localStorage.setItem(ACCESS_TOKEN_KEY, access);
        localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
        localStorage.setItem(ROLE_ID_KEY, role_id);
        toast.success("Welcome back, Accountant!");
        router.push("/accountant/dashboard");
      }
    } catch (error) {
      apiClient.setAccessToken(null);
      if (error instanceof Error && error.message.includes('Access denied')) {
        toast.error(error.message);
      } else {
        toast.error("Invalid email or password");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="space-y-1 text-center">
        <div className="flex justify-center mb-4">
          <div className="flex items-center gap-2">
            <Leaf className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">GreenForest</span>
          </div>
        </div>
        <CardTitle className="text-2xl">Staff Portal</CardTitle>
        <CardDescription>
          Sign in to access your dashboard
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="accountant@example.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="********" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </form>
        </Form>
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">or</span>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => {
            // Clear existing auth state so stale tokens don't interfere
            Object.keys(localStorage)
              .filter((key) => key.startsWith("greenforest_"))
              .forEach((key) => localStorage.removeItem(key));
            const oneAuthUrl = process.env.NEXT_PUBLIC_ONE_AUTH_URL;
            const appUrl = process.env.NEXT_PUBLIC_APP_URL;
            const callbackUrl = encodeURIComponent(`${appUrl}/accountant/callback`);
            window.location.href = `${oneAuthUrl}/login/?next=${callbackUrl}&force_login=true`;
          }}
        >
          Continue with Priyo One Auth
        </Button>
      </CardContent>
    </Card>
  );
}
