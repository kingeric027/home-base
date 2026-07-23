"use server";

import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth";
import { verifyCredentials } from "@/lib/db/users";
import { listHomes } from "@/lib/db/homes";
import { loginSchema } from "@/lib/validation/auth";

export type LoginState = { error?: string } | undefined;

export async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const user = await verifyCredentials(parsed.data.email, parsed.data.password);
  if (!user) {
    return { error: "Invalid email or password" };
  }

  await signIn("credentials", {
    email: parsed.data.email,
    password: parsed.data.password,
    redirect: false,
  });

  const homes = await listHomes(user.userId);
  if (homes.length === 0) {
    redirect("/homes");
  }
  redirect(`/home/${homes[0].homeId}`);
}
