import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getHome } from "@/lib/db/homes";
import { HomeForm } from "@/components/home-form";
import { updateHomeAction } from "../../actions";

export default async function EditHomePage({
  params,
}: {
  params: Promise<{ homeId: string }>;
}) {
  const { homeId } = await params;
  const session = await auth();
  const home = await getHome(session!.user.id, homeId);

  if (!home) notFound();

  return (
    <div>
      <h1 className="text-xl font-semibold">Edit home</h1>
      <div className="mt-6">
        <HomeForm
          action={updateHomeAction.bind(null, home.homeId)}
          initialValues={home}
          submitLabel="Save changes"
        />
      </div>
    </div>
  );
}
