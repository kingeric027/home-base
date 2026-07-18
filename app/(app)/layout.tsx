import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen">
      <nav className="flex items-center justify-between border-b px-6 py-4">
        <span className="font-semibold">HomeBase</span>
        <form
          action={async () => {
            "use server";
            await signOut({ redirect: false });
            redirect("/login");
          }}
        >
          <button type="submit" className="text-sm underline">
            Log out
          </button>
        </form>
      </nav>
      <main className="p-6">{children}</main>
    </div>
  );
}
