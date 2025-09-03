import LogoSmall from "~/assets/logo-small.webp";
import Logo from "~/assets/logo.webp";
import { Link } from "react-router";
import { DiscordLogin } from "./social-login/discord";
import { GoogleLogin } from "./social-login/google";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";

export default function HomePage() {
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
        <h1 className="text-auth-heading">Happening now</h1>
        <h2 className="text-auth-sub-heading my-12">Join today</h2>
        <div className="flex max-w-64 flex-col gap-2">
          <GoogleLogin />
          <DiscordLogin />
          <Separator />
          <Button
            asChild
            className="rounded-full bg-blue-500 text-white hover:bg-blue-600 focus-visible:bg-blue-600 focus-visible:ring-blue-600">
            <Link to="/flow/signup">Create Account</Link>
          </Button>
          <h3 className="mt-12 mb-4">Already have an account?</h3>
          <Button
            asChild
            className="rounded-full !text-blue-500 hover:bg-blue-500/10 focus-visible:bg-blue-500/10 focus-visible:ring-blue-500"
            variant="outline">
            <Link to="/flow/login">Sign in</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
