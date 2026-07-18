"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction } from "./actions";

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(registerAction, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <h1 className="text-xl font-semibold">Create your account</h1>

      {state?.error && (
        <p className="rounded bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium">
          Name (optional)
        </label>
        <input
          id="name"
          name="name"
          type="text"
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </div>

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
          minLength={8}
          className="mt-1 w-full rounded border px-3 py-2"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded bg-black px-3 py-2 text-white disabled:opacity-50"
      >
        {pending ? "Creating account..." : "Create account"}
      </button>

      <p className="text-sm text-gray-600">
        Already have an account?{" "}
        <Link href="/login" className="underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
