export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-8">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow">
        <h1 className="mb-1 text-center text-2xl font-bold text-indigo-600">
          Brightloop Software
        </h1>
        <p className="mb-6 text-center text-sm text-gray-500">
          Subscription Management
        </p>
        {children}
      </div>
    </main>
  );
}