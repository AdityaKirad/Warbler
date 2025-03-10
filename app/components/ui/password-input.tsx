import { cn } from "~/lib/utils";
import { Eye, EyeOff } from "lucide-react";
import { forwardRef, useState } from "react";

export const PasswordInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    const [visible, visibleSet] = useState(false);
    return (
      <div className="flex h-10 items-center gap-2 rounded-md border border-input px-3 py-2 ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
        <input
          type={visible ? "text" : "password"}
          ref={ref}
          onCopy={(e) => e.preventDefault()}
          onCut={(e) => e.preventDefault()}
          onPaste={(e) => e.preventDefault()}
          onContextMenu={(e) => e.preventDefault()}
          className={cn("w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground", className)}
          {...props}
        />
        <button
          className="rounded-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          type="button"
          title={visible ? "Hide" : "Reveal"}
          onClick={() => visibleSet((prevState) => !prevState)}>
          {visible ? (
            <>
              <EyeOff aria-hidden={true} />
              <span className="sr-only">Hide</span>
            </>
          ) : (
            <>
              <Eye aria-hidden={true} />
              <span className="sr-only">Reveal</span>
            </>
          )}
        </button>
      </div>
    );
  },
);

PasswordInput.displayName = "PasswordInput";
