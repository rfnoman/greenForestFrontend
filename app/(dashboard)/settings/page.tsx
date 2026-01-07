"use client";

import Link from "next/link";
import { Building2, Users, User, Bell, Shield, CreditCard } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const settingsLinks = [
  {
    title: "Business Profile",
    description: "Manage your business name, address, and contact information",
    href: "/settings/business",
    icon: Building2,
  },
  {
    title: "Team Members",
    description: "Invite team members and manage access permissions",
    href: "/settings/members",
    icon: Users,
  },
  {
    title: "My Profile",
    description: "Update your personal information and password",
    href: "/settings/profile",
    icon: User,
  },
];

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your business and account settings
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {settingsLinks.map((setting) => (
          <Link key={setting.href} href={setting.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <setting.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{setting.title}</CardTitle>
                    <CardDescription className="mt-1">
                      {setting.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>About GreenForest</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-muted-foreground">Version</span>
            <span className="font-medium">1.0.0</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-muted-foreground">Build</span>
            <span className="font-medium">2024.01</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-muted-foreground">Support</span>
            <a
              href="mailto:support@greenforest.app"
              className="font-medium text-primary hover:underline"
            >
              support@greenforest.app
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
