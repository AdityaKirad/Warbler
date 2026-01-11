import { requireUser } from "~/.server/utils";
import { Button } from "~/components/ui/button";
import { useLocation } from "react-router";
import type { Route } from "./+types/home";

export const meta = () => [{ title: "Home / Warbler" }];

export async function loader({ request }: Route.LoaderArgs) {
  await requireUser(request);
  return null;
}

export default function Page() {
  const location = useLocation();
  return (
    <>
      {/* {loaderData.onboarding && <OnboardingForm />} */}
      <div>
        New Page
        <Button asChild>
          <a
            href={`/flow/logout?redirectTo=${encodeURIComponent(location.pathname + location.search)}`}>
            Logout
          </a>
        </Button>
      </div>
    </>
  );
}
