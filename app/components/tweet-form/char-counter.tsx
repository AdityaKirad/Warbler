import { cn } from "~/lib/utils";

export function CharCounter({
  charCount,
  maxCharCount,
}: {
  charCount: number;
  maxCharCount: number;
}) {
  if (!charCount) return null;

  const remaining = maxCharCount - charCount;
  const progress = Math.min(charCount / maxCharCount, 1);
  const warn = remaining <= 20;
  const limitExceeded = remaining <= 0;

  const size = 24;
  const stroke = 2;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="ml-auto grid place-items-center">
      {remaining >= -9 && (
        <svg
          className={cn(
            "col-span-full row-span-full size-6 -rotate-90 transition-transform duration-300 ease-out",
            { "scale-[1.3332]": warn },
          )}
          viewBox={`0 0 ${size} ${size}`}
          fill="none">
          <circle
            className="stroke-muted"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={stroke}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={stroke}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress)}
            className={
              limitExceeded
                ? "stroke-red-500"
                : warn
                  ? "stroke-yellow-400"
                  : "stroke-blue-500"
            }
          />
        </svg>
      )}

      {warn && (
        <span
          className={cn(
            "col-span-full row-span-full text-sm",
            limitExceeded ? "text-red-500" : "text-muted-foreground",
          )}>
          {remaining}
        </span>
      )}
    </div>
  );
}
