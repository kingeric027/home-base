import { auth } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await auth();

  return (
    <div>
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <p className="mt-2 text-gray-600">
        Logged in as {session?.user?.email}
      </p>
    </div>
  );
}
