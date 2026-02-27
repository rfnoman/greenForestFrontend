"use client";

import { useState } from "react";
import { Plus, Mail, Phone, MoreHorizontal, Trash2, Edit } from "lucide-react";
import { ColumnDef } from "@tanstack/react-table";
import { useContacts, useDeleteContact } from "@/lib/hooks/use-contacts";
import { CONTACT_TYPES } from "@/lib/constants";
import { formatDate } from "@/lib/utils/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DataTable } from "@/components/shared/data-table";
import { TableSkeleton } from "@/components/shared/loading-skeleton";
import { ContactFormDialog } from "@/components/forms/contact-form";
import type { Contact, ContactType } from "@/lib/types";
import { toast } from "sonner";

export default function ContactsPage() {
  const [selectedType, setSelectedType] = useState<ContactType | "all">("all");
  const { data: contacts, isLoading } = useContacts(
    selectedType === "all" ? undefined : { contact_type: selectedType }
  );
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [deleteContact, setDeleteContact] = useState<Contact | null>(null);
  const deleteContactMutation = useDeleteContact();

  const handleDelete = async () => {
    if (!deleteContact) return;
    try {
      await deleteContactMutation.mutateAsync(deleteContact.id);
      toast.success("Contact deleted successfully");
      setDeleteContact(null);
    } catch {
      toast.error("Failed to delete contact");
    }
  };

  const columns: ColumnDef<Contact>[] = [
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <div className="font-medium">{row.original.name}</div>
      ),
    },
    {
      accessorKey: "contact_type",
      header: "Type",
      cell: ({ row }) => {
        const type = CONTACT_TYPES.find((t) => t.value === row.original.contact_type);
        return (
          <Badge variant="outline" className="capitalize">
            {type?.label || row.original.contact_type}
          </Badge>
        );
      },
    },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ row }) =>
        row.original.email ? (
          <a
            href={`mailto:${row.original.email}`}
            className="flex items-center text-sm text-muted-foreground hover:text-foreground"
            onClick={(e) => e.stopPropagation()}
          >
            <Mail className="h-3 w-3 mr-1" />
            {row.original.email}
          </a>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      accessorKey: "phone",
      header: "Phone",
      cell: ({ row }) =>
        row.original.phone ? (
          <a
            href={`tel:${row.original.phone}`}
            className="flex items-center text-sm text-muted-foreground hover:text-foreground"
            onClick={(e) => e.stopPropagation()}
          >
            <Phone className="h-3 w-3 mr-1" />
            {row.original.phone}
          </a>
        ) : (
          <span className="text-muted-foreground">-</span>
        ),
    },
    {
      accessorKey: "created_at",
      header: "Created",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.original.created_at)}
        </span>
      ),
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <div onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setEditContact(row.original)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => setDeleteContact(row.original)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
            <p className="text-muted-foreground">
              Manage your customers and vendors
            </p>
          </div>
        </div>
        <TableSkeleton rows={8} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contacts</h1>
          <p className="text-muted-foreground">
            Manage your customers and vendors
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Contact
        </Button>
      </div>

      <Tabs
        value={selectedType}
        onValueChange={(v) => setSelectedType(v as ContactType | "all")}
      >
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="customer">Customers</TabsTrigger>
          <TabsTrigger value="vendor">Vendors</TabsTrigger>
          <TabsTrigger value="both">Both</TabsTrigger>
        </TabsList>
        <TabsContent value={selectedType} className="mt-4">
          <DataTable
            columns={columns}
            data={contacts || []}
            searchKey="name"
            searchPlaceholder="Search contacts..."
            onRowClick={(contact) => setEditContact(contact)}
          />
        </TabsContent>
      </Tabs>

      <ContactFormDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />

      {editContact && (
        <ContactFormDialog
          open={!!editContact}
          onOpenChange={(open) => !open && setEditContact(null)}
          contact={editContact}
        />
      )}

      <AlertDialog open={!!deleteContact} onOpenChange={() => setDeleteContact(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Contact</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteContact?.name}&quot;? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
