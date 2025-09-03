import { cn } from "~/lib/utils";
import { Eye, EyeOff } from "lucide-react";
import { forwardRef, useState } from "react";

const PasswordInput = forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input">
>(({ className, type: _type, ...props }, ref) => {
  const [visible, visibleSet] = useState(false);
  return (
    <div
      className="border-input ring-offset-background focus-within:ring-ring flex h-10 items-center gap-2 rounded-md border px-3 py-2 focus-within:ring-2 focus-within:ring-offset-2"
      data-slot="password-input">
      <input
        className={cn(
          "placeholder:text-muted-foreground w-full bg-transparent text-sm outline-none",
          className,
        )}
        onContextMenu={(e) => e.preventDefault()}
        onCopy={(e) => e.preventDefault()}
        onCut={(e) => e.preventDefault()}
        onPaste={(e) => e.preventDefault()}
        ref={ref}
        type={visible ? "text" : "password"}
        {...props}
      />
      <button
        className="ring-offset-background focus-visible:ring-ring rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        onClick={() => visibleSet((prevState) => !prevState)}
        title={visible ? "Hide" : "Reveal"}
        type="button">
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
});

PasswordInput.displayName = "PasswordInput";

export { PasswordInput };
