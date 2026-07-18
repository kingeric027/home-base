import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <h1 className="text-3xl font-semibold">HomeBase</h1>
      <p className="max-w-md text-gray-600">
        Track your homes, projects, appliances, and maintenance in one place.
      </p>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="rounded border border-black px-4 py-2 font-medium"
        >
          Log in
        </Link>
        <Link
          href="/register"
          className="rounded bg-black px-4 py-2 font-medium text-white"
        >
          Get started
        </Link>
      </div>
    </div>
  );
}
