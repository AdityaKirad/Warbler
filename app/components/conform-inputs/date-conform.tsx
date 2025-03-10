import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import { FieldError } from "../ui/field";
import { Input } from "../ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { type FieldMetadata, getInputProps, unstable_useControl as useControl } from "@conform-to/react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useRef } from "react";
import { ClientOnly } from "remix-utils/client-only";
import { cn } from "~/lib/utils";

export default function DateConform({ field }: { field: FieldMetadata<Date> }) {
  const triggerRef = useRef<React.ElementRef<"button">>(null);
  const control = useControl(field);
  const controlValue = control.value;
  const DATE_FORMAT = "yyyy-MM-dd";
  return (
    <ClientOnly fallback={<Input {...getInputProps(field, { type: "date" })} />}>
      {() => (
        <>
          <input
            type="hidden"
            id={field.id}
            ref={control.register}
            name={field.name}
            defaultValue={
              controlValue
                ? format(new Date(controlValue), DATE_FORMAT)
                : field.initialValue
                  ? format(new Date(field.initialValue), DATE_FORMAT)
                  : ""
            }
            onFocus={() => triggerRef.current?.focus()}
            tabIndex={-1}
            aria-hidden
          />

          <Popover>
            <PopoverTrigger asChild>
              <Button
                ref={triggerRef}
                className={cn("w-full justify-between", {
                  "text-muted-foreground": !controlValue,
                })}
                variant="outline">
                <span>{controlValue ? format(new Date(controlValue), "MMM d, yyyy") : "Pick a date"}</span>
                <CalendarIcon />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                captionLayout="dropdown"
                fromYear={1900}
                toYear={new Date().getFullYear()}
                selected={new Date(controlValue ?? "")}
                onSelect={(e) => control.change(e?.toISOString() ?? "")}
              />
            </PopoverContent>
          </Popover>
          <FieldError>{field.errors}</FieldError>
        </>
      )}
    </ClientOnly>
  );
}
