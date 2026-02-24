import { cn } from "~/lib/utils";
import { XIcon } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { forwardRef, useCallback, useEffect, useState } from "react";
import { useDropdownMenuContext } from "./dropdown-menu";

const dialogContentClassName =
  "bg-background fixed inset-0 z-50 m-auto flex size-full flex-col gap-4 px-16 py-2 shadow-lg duration-200 sm:max-h-(--container-xl) sm:max-w-lg sm:rounded-lg sm:border";

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const Dialog = (props: React.ComponentProps<typeof DialogPrimitive.Root>) => {
  const [open, openSet] = useState(props.open ?? false);
  const dropdownMenuContext = useDropdownMenuContext();

  const applyOpenState = useCallback(
    (openState: boolean) => {
      openSet(openState);

      if (!openState) {
        dropdownMenuContext.openSet(false);
        dropdownMenuContext.menuHiddenSet(false);
      } else {
        dropdownMenuContext.menuHiddenSet(true);
      }
    },
    [dropdownMenuContext],
  );

  useEffect(() => {
    if (typeof props.open !== "boolean" || props.open === open) {
      return;
    }

    applyOpenState(props.open);
  }, [applyOpenState, open, props.open]);

  const handleOpenChange = useCallback(
    (openState: boolean) => {
      applyOpenState(openState);
      props.onOpenChange?.(openState);
    },
    [applyOpenState, props],
  );

  return <DialogPrimitive.Root onOpenChange={handleOpenChange} {...props} />;
};

const DialogOverlay = forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay> & {
    animate?: boolean;
  }
>(({ animate = true, className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    className={cn(
      {
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0":
          animate,
      },
      "fixed inset-0 z-50 bg-black/50",
      className,
    )}
    ref={ref}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    animate?: boolean;
    showCloseButton?: boolean;
    closeButtonClassName?: string;
  }
>(
  (
    {
      animate = true,
      showCloseButton = true,
      closeButtonClassName,
      className,
      children,
      ...props
    },
    ref,
  ) => (
    <DialogPortal>
      <DialogOverlay animate={animate} />
      <DialogPrimitive.Content
        className={cn(
          {
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95":
              animate,
          },
          dialogContentClassName,
          className,
        )}
        ref={ref}
        {...props}>
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="dialog-close"
            className={cn(
              "ring-offset-background focus:ring-ring hover:bg-accent absolute top-2 left-2 inline-flex size-10 items-center justify-center rounded-full transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
              closeButtonClassName,
            )}>
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  ),
);
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-1.5 text-center sm:text-left",
      className,
    )}
    {...props}
  />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className,
    )}
    {...props}
  />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    className={cn(
      "text-heading leading-none font-semibold tracking-tight",
      className,
    )}
    ref={ref}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    className={cn("text-muted-foreground text-sm", className)}
    ref={ref}
    {...props}
  />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
  dialogContentClassName,
};
