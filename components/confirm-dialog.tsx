"use client";
import { useEffect, useRef } from "react";
import { Button, SubmitButton, Field } from "./ui";
export function ConfirmDialog({
  title,
  description,
  pending,
  reason = false,
  onConfirm,
  onClose,
}: {
  title: string;
  description: string;
  pending: boolean;
  reason?: boolean;
  onConfirm: (reason: string) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      className="dialog panel"
      aria-labelledby="dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!pending) onClose();
      }}
    >
      <form
        className="stack"
        onSubmit={(event) => {
          event.preventDefault();
          onConfirm(
            String(new FormData(event.currentTarget).get("reason") ?? ""),
          );
        }}
      >
        <h2 id="dialog-title">{title}</h2>
        <p className="muted small">{description}</p>
        {reason && (
          <Field
            label="Reason"
            name="reason"
            multiline
            isRequired
            minLength={5}
            maxLength={500}
          />
        )}
        <div className="row">
          <Button
            type="button"
            variant="secondary"
            isDisabled={pending}
            onPress={onClose}
          >
            Cancel
          </Button>
          <SubmitButton pending={pending}>Confirm</SubmitButton>
        </div>
      </form>
    </dialog>
  );
}
