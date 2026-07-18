"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction } from "./actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <h1 className="text-xl font-semibold">Log in</h1>

      {state?.error && (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded bg-black px-3 py-2 text-white disabled:opacity-50"
      >
        {pending ? "Logging in..." : "Log in"}
      </button>

      <p className="text-sm text-gray-600">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="underline">
          Register
        </Link>
      </p>
    </form>
  );
}
