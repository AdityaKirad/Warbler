import type { FieldMetadata } from "@conform-to/react";
import { Field, FieldError } from "./ui/field";
import { Label } from "./ui/label";
import { PasswordInput } from "./ui/password-input";

type FieldProps = {
  field: FieldMetadata<string, Record<string, unknown>, string[]>;
  label?: string;
  placeholder: string;
};

export function PasswordField({ field, label, placeholder }: FieldProps) {
  return (
    <Field>
      {label && <Label>{label}</Label>}
      <PasswordInput
        key={field.key}
        id={field.id}
        name={field.name}
        form={field.formId}
        defaultValue={field.initialValue}
        placeholder={placeholder}
        aria-invalid={!field.valid || undefined}
        aria-describedby={!field.valid ? field.errorId : undefined}
        required={field.required}
        minLength={field.minLength}
        maxLength={field.maxLength}
        pattern={field.pattern}
      />
      <FieldError>{field.errors?.join(", ")}</FieldError>
    </Field>
  );
}
