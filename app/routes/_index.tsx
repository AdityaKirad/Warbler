import { requireAnonymous } from "~/.server/utils";
import LogoSmall from "~/assets/logo-small.webp";
import Logo from "~/assets/logo.webp";
import { DiscordLogin, GoogleLogin } from "~/components/social-login";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { Link } from "react-router";
import type { Route } from "./+types/_index";

export const meta = () => [
  {
    title: "Happening Now",
  },
];

export async function loader({ request }: Route.LoaderArgs) {
  await requireAnonymous(request);
  return null;
}

export default function Page() {
  return (
    <div className="absolute inset-0 m-auto flex max-w-fit gap-8 px-4 max-lg:flex-col lg:max-h-fit">
      <div>
        <img
          alt="brand logo"
          className="object-cover object-center max-lg:size-20"
          decoding="async"
          height={400}
          loading="lazy"
          sizes="(max-width: 1024px) 80px, 400px"
          src={Logo}
          srcSet={`${LogoSmall} 80w, ${Logo}`}
          width={400}
        />
      </div>
      <div className="font-bold">
        <h1 className="text-[2.5rem] sm:text-6xl">Happening now</h1>
        <h2 className="mt-8 mb-4 text-4xl sm:text-5xl">Join today</h2>
        <div className="flex max-w-64 flex-col gap-2">
          <GoogleLogin />
          <DiscordLogin />
          <Separator />
          <Button
            asChild
            className="rounded-full bg-blue-500 text-white hover:bg-blue-600 focus-visible:bg-blue-600 focus-visible:ring-blue-600">
            <Link to="/flow/signup" aria-label="Create Account">
              Create Account
            </Link>
          </Button>
          <h3 className="mt-8 mb-4">Already have an account?</h3>
          <Button
            asChild
            className="rounded-full text-blue-500! hover:bg-blue-500/10 focus-visible:bg-blue-500/10 focus-visible:ring-blue-500"
            variant="outline">
            <Link to="/flow/login" aria-label="Sign in">
              Sign in
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
