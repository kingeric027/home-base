import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getHome, listHomes } from "@/lib/db/homes";
import { HomeSwitcher } from "@/components/home-switcher";
import { HomeTabsPanel } from "@/components/home-tabs-panel";
import { updateHomeAction, deleteHomeAction } from "../../homes/actions";

export default async function HomePage({
  params,
}: {
  params: Promise<{ homeId: string }>;
}) {
  const { homeId } = await params;
  const session = await auth();

  const [home, homes] = await Promise.all([
    getHome(session!.user.id, homeId),
    listHomes(session!.user.id),
  ]);

  if (!home) notFound();

  return (
    <div>
      <HomeSwitcher homes={homes} currentHomeId={homeId} />
      <div className="mt-4">
        <HomeTabsPanel
          home={home}
          updateAction={updateHomeAction.bind(null, home.homeId)}
          deleteAction={deleteHomeAction}
        />
      </div>
    </div>
  );
}
