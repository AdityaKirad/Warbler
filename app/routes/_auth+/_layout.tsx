import { Link, Outlet, useNavigate } from "@remix-run/react";
import LogoSmall from "~/assets/logo-small.webp";
import AuthPage from "~/components/auth-page";
import { Button } from "~/components/ui/button";
import { Dialog, DialogClose, DialogContent } from "~/components/ui/dialog";
import { X } from "lucide-react";

export default function Layout() {
  const navigate = useNavigate();
  return (
    <>
      <AuthPage />
      <Dialog open={true} onOpenChange={() => navigate("/")}>
        <DialogContent className="px-10 pb-12" animate={false}>
          <img
            className="mx-auto"
            src={LogoSmall}
            alt="brand logo"
            loading="lazy"
            decoding="async"
            height="64"
            width="64"
          />
          <DialogClose asChild>
            <Button className="absolute left-2 top-2 rounded-full" variant="ghost" size="icon">
              <X aria-hidden={true} />
              <span className="sr-only">Close</span>
            </Button>
          </DialogClose>
          <div className="flex flex-col gap-2">
            <Outlet />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
