"use server";

import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";
import { createUser, EmailAlreadyRegisteredError } from "@/lib/db/users";
import { registerSchema } from "@/lib/validation/auth";

export type RegisterState = { error?: string } | undefined;

export async function registerAction(
  _prevState: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    name: formData.get("name") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const { email, password, name } = parsed.data;

  try {
    await createUser(email, password, name);
  } catch (err) {
    if (err instanceof EmailAlreadyRegisteredError) {
      return { error: "An account with that email already exists" };
    }
    return { error: "Something went wrong. Please try again." };
  }

  await signIn("credentials", { email, password, redirect: false });
  redirect("/homes");
}
