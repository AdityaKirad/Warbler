import { useState } from "react";

export function useProfileImages(initial: {
  photo: string;
  coverImage: string | null;
}) {
  type ImageFields = keyof typeof initial;

  const [imgSrc, imgSrcSet] = useState(initial);
  const [files, filesSet] = useState<
    Partial<{
      photo: File;
      coverImage: File | null;
    }>
  >({});
  const [crop, cropSet] = useState<
    | {
        open: false;
      }
    | { open: true; aspect: number; field: ImageFields; src: string }
  >({
    open: false,
  });
  const [cropDimensions, cropDimensionsSet] = useState<{
    height: number;
    width: number;
    x: number;
    y: number;
  }>({
    x: 0,
    y: 0,
    height: 0,
    width: 0,
  });

  function selectFile(field: ImageFields, file: File) {
    const url = URL.createObjectURL(file);

    imgSrcSet((prev) => {
      if (prev[field]?.startsWith("blob:")) {
        URL.revokeObjectURL(prev[field]);
      }
      return { ...prev, [field]: url };
    });
    filesSet((prev) => ({ ...prev, [field]: file }));
    cropSet({
      field,
      aspect: field === "photo" ? 1 : 3,
      open: true,
      src: url,
    });
  }

  function removeCoverImage() {
    imgSrcSet((prev) => {
      const isBlob = prev.coverImage?.startsWith("blob:");
      if (isBlob) {
        URL.revokeObjectURL(prev.coverImage as string);
      }
      return { ...prev, coverImage: isBlob ? initial.coverImage : null };
    });
    filesSet((prev) => ({
      ...prev,
      coverImage: prev.coverImage instanceof File ? undefined : null,
    }));
  }

  function closeCrop() {
    cropDimensionsSet({ x: 0, y: 0, height: 0, width: 0 });
    cropSet({ open: false });
  }

  function reset() {
    imgSrcSet((prev) => {
      Object.values(prev).forEach((url) => {
        if (url?.startsWith("blob:")) {
          URL.revokeObjectURL(url);
        }
      });
      return initial;
    });
    filesSet({});
    closeCrop();
  }

  async function applyCrop() {
    if (!crop.open) {
      return;
    }

    const { field, src } = crop;

    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.src = src;
      image.onload = () => resolve(image);
      image.onerror = reject;
    });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Canvas not supported");
    }

    const TARGET_WIDTH = crop.field === "photo" ? 400 : 1500;
    const TARGET_HEIGHT = crop.field === "photo" ? 400 : 500;

    canvas.width = TARGET_WIDTH;
    canvas.height = TARGET_HEIGHT;

    ctx.drawImage(
      image,
      cropDimensions.x,
      cropDimensions.y,
      cropDimensions.width,
      cropDimensions.height,
      0,
      0,
      TARGET_WIDTH,
      TARGET_HEIGHT,
    );

    const sourceFile = files[field];
    const outputType = sourceFile?.type || "image/jpeg";

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error("Crop failed"));
        } else {
          resolve(blob);
        }
      }, outputType);
    });

    const file = new File([blob], sourceFile?.name ?? "cropped.jpeg", {
      type: outputType,
    });

    const url = URL.createObjectURL(file);

    URL.revokeObjectURL(crop.src);

    imgSrcSet((prev) => ({ ...prev, [crop.field]: url }));
    filesSet((prev) => ({ ...prev, [crop.field]: file }));
    closeCrop();
  }

  return {
    crop,
    imgSrc,
    files,
    applyCrop,
    cropDimensionsSet,
    removeCoverImage,
    reset,
    selectFile,
  };
}
