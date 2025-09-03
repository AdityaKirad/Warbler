import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";

const loaderVariants = cva("loading", {
  variants: {
    variant: {
      default: "bg-background",
    },
    size: {
      default: "w-6",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
});

export function Loader({ variant, size }: VariantProps<typeof loaderVariants>) {
  return (
    <span
      data-slot="loading-spinner"
      className={loaderVariants({ size, variant })}
    />
  );
}
