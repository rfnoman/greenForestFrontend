export default function SupervisorAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-100 via-emerald-50 to-teal-100 dark:from-gray-950 dark:via-emerald-950/30 dark:to-gray-900">
      <div className="w-full max-w-md p-4">{children}</div>
    </div>
  );
}
