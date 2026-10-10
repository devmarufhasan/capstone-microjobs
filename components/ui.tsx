"use client";
import {
  Button,
  Input,
  Label,
  TextArea,
  TextField,
  FieldError,
  Description,
} from "@heroui/react";
import type { ComponentProps, ReactNode } from "react";
export function SubmitButton({
  pending,
  children,
  ...props
}: ComponentProps<typeof Button> & { pending?: boolean }) {
  return (
    <Button
      type="submit"
      variant="primary"
      isDisabled={pending || props.isDisabled}
      {...props}
    >
      {pending ? "Please wait…" : children}
    </Button>
  );
}
export function Field({
  label,
  hint,
  multiline,
  ...props
}: ComponentProps<typeof TextField> & {
  label: string;
  hint?: string;
  multiline?: boolean;
}) {
  return (
    <TextField {...props} className="field">
      <Label>{label}</Label>
      {multiline ? <TextArea rows={4} /> : <Input />}
      {hint && <Description>{hint}</Description>}
      <FieldError />
    </TextField>
  );
}
export function Feedback({
  error,
  success,
}: {
  error?: string;
  success?: string;
}) {
  return (
    <>
      {error && (
        <p className="feedback error" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="feedback success" role="status">
          {success}
        </p>
      )}
    </>
  );
}
export function Panel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={`panel ${className}`}>{children}</section>;
}
export { Button };
