import { ALLOWED_FORMATS } from "~/lib/cloudinary";
import { useState } from "react";

export function useFileInput({
  maxSize,
  multiple = false,
  type,
  onFiles,
  onInvalidFiles,
}: {
  maxSize: number;
  multiple?: boolean;
  type: "profile" | "post";
  onInvalidFiles: (files: File[]) => void;
  onFiles: (files: File[]) => void;
}) {
  const [dragOver, dragOverSet] = useState(false);

  const accept =
    type === "profile"
      ? Object.values(ALLOWED_FORMATS).filter((format) =>
          format.startsWith("image/"),
        )
      : Object.values(ALLOWED_FORMATS);

  function splitFiles(list: File[] | null) {
    if (!list?.length) {
      return { validFiles: [], invalidFiles: [] };
    }

    const validFiles: File[] = [];
    const invalidFiles: File[] = [];

    Array.from(list).forEach((file) => {
      const isValid = accept.includes(file.type) && file.size <= maxSize;

      if (isValid) {
        validFiles.push(file);
        return;
      }

      invalidFiles.push(file);
    });

    return {
      validFiles: multiple ? validFiles : validFiles.slice(0, 1),
      invalidFiles,
    };
  }

  const handleDragEnter = () => dragOverSet(true);

  const handleDragLeave = () => dragOverSet(false);

  const handleDragOver = (evt: React.DragEvent<HTMLElement>) =>
    evt.preventDefault();

  function handleDrop(evt: React.DragEvent<HTMLElement>) {
    evt.preventDefault();
    evt.stopPropagation();

    dragOverSet(false);

    const { invalidFiles, validFiles } = splitFiles(
      Array.from(evt.dataTransfer.files),
    );

    if (invalidFiles.length) {
      onInvalidFiles(invalidFiles);
    }

    if (!validFiles.length) {
      return;
    }

    onFiles(validFiles);
  }

  function handleFileInputChange(evt: React.ChangeEvent<HTMLInputElement>) {
    const { invalidFiles, validFiles } = splitFiles(
      Array.from(evt.target.files ?? []),
    );

    if (invalidFiles.length) {
      onInvalidFiles(invalidFiles);
    }

    if (!validFiles.length) {
      evt.target.value = "";
      return;
    }

    onFiles(validFiles);
    evt.target.value = "";
  }

  return {
    accept: accept.join(","),
    dragOver,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    handleFileInputChange,
  };
}
