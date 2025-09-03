import type { FieldMetadata } from "@conform-to/react";
import {
  getInputProps,
  unstable_useControl as useControl,
} from "@conform-to/react";
import { cn } from "~/lib/utils";
import { format } from "date-fns";
import type { OTPInputProps } from "input-otp";
import { REGEXP_ONLY_DIGITS_AND_CHARS } from "input-otp";
import { CalendarIcon } from "lucide-react";
import { useId, useRef } from "react";
import { ClientOnly } from "remix-utils/client-only";
import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";
import { Input } from "./ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "./ui/input-otp";
import { Label } from "./ui/label";
import { PasswordInput } from "./ui/password-input";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

type ErrorListType = Array<string | null | undefined> | null | undefined;

export function ErrorList({
  errors,
  id,
}: {
  errors?: ErrorListType;
  id?: string;
}) {
  const errorsToRender = errors?.filter(Boolean);
  if (!errorsToRender?.length) {
    return null;
  }
  return (
    <ul className="text-destructive flex flex-col gap-1 text-sm" id={id}>
      {errorsToRender.map((err) => (
        <li key={err}>{err}</li>
      ))}
    </ul>
  );
}

export function Field({
  inputProps,
  labelProps,
  errors,
}: {
  errors?: ErrorListType;
  inputProps: React.InputHTMLAttributes<HTMLInputElement>;
  labelProps?: React.LabelHTMLAttributes<HTMLLabelElement>;
}) {
  const fallbackId = useId();
  const id = inputProps.id ?? fallbackId;
  const errorId = errors?.length ? `${id}-error` : undefined;
  return (
    <div className="space-y-1">
      {labelProps && <Label htmlFor={inputProps.id} {...labelProps} />}
      {inputProps.type === "password" ? (
        <PasswordInput
          aria-describedby={errorId}
          aria-invalid={errorId ? true : undefined}
          id={inputProps.id}
          {...inputProps}
        />
      ) : (
        <Input
          aria-describedby={errorId}
          aria-invalid={errorId ? true : undefined}
          id={inputProps.id}
          {...inputProps}
        />
      )}
      <ErrorList errors={errors} id={errorId} />
    </div>
  );
}

export function OTPField({
  inputProps,
  labelProps,
  errors,
}: {
  inputProps: Partial<OTPInputProps & { render: never }>;
  errors?: ErrorListType;
  labelProps: React.LabelHTMLAttributes<HTMLLabelElement>;
}) {
  const fallbackId = useId();
  const id = inputProps.id ?? fallbackId;
  const errorId = id ? `${id}-error` : undefined;
  return (
    <div className="space-y-1">
      <Label htmlFor={inputProps.id} {...labelProps} />
      <InputOTP
        aria-describedby={errorId}
        aria-invalid={errorId ? true : undefined}
        id={id}
        maxLength={6}
        pattern={REGEXP_ONLY_DIGITS_AND_CHARS}
        {...inputProps}>
        <InputOTPGroup className="flex-1 [&>*]:flex-1">
          <InputOTPSlot index={0} />
          <InputOTPSlot index={1} />
          <InputOTPSlot index={2} />
        </InputOTPGroup>
        <InputOTPSeparator />
        <InputOTPGroup className="flex-1 [&>*]:flex-1">
          <InputOTPSlot index={3} />
          <InputOTPSlot index={4} />
          <InputOTPSlot index={5} />
        </InputOTPGroup>
      </InputOTP>
      <ErrorList errors={errors} id={errorId} />
    </div>
  );
}

export function DateField({
  field,
  label,
  description,
}: {
  field: FieldMetadata<Date>;
  label?: string;
  description?: string;
}) {
  const triggerRef = useRef<React.ElementRef<"button">>(null);
  const control = useControl(field);
  const controlValue = control.value;
  const DATE_FORMAT = "yyyy-MM-dd";
  return (
    <div className="space-y-1">
      {label && <Label htmlFor={field.id}>{label}</Label>}
      {description && (
        <p className="text-muted-foreground text-sm">{description}</p>
      )}
      <ClientOnly
        fallback={<Input {...getInputProps(field, { type: "date" })} />}>
        {() => (
          <>
            <input
              aria-hidden
              defaultValue={
                controlValue
                  ? format(new Date(controlValue), DATE_FORMAT)
                  : field.initialValue
                    ? format(new Date(field.initialValue), DATE_FORMAT)
                    : ""
              }
              id={field.id}
              name={field.name}
              onFocus={() => triggerRef.current?.focus()}
              ref={control.register}
              tabIndex={-1}
              type="hidden"
            />

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  className={cn("w-full justify-between", {
                    "text-muted-foreground": !controlValue,
                  })}
                  ref={triggerRef}
                  variant="outline">
                  <span>
                    {controlValue
                      ? format(new Date(controlValue), "MMM d, yyyy")
                      : "Pick a date"}
                  </span>
                  <CalendarIcon />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="bg-background w-auto p-0">
                <Calendar
                  captionLayout="dropdown"
                  fromYear={1900}
                  mode="single"
                  onSelect={(e) => control.change(e?.toISOString() ?? "")}
                  selected={new Date(controlValue ?? "")}
                  toYear={new Date().getFullYear()}
                />
              </PopoverContent>
            </Popover>
          </>
        )}
      </ClientOnly>
      <ErrorList errors={field.errors} />
    </div>
  );
}
