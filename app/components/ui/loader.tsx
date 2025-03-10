import { cva, type VariantProps } from "class-variance-authority";

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
  return <span className={loaderVariants({ size, variant })} />;
}
