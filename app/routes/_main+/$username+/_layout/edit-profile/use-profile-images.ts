import { useState } from "react";

export function useProfileImages(initial: {
  photo: string;
  coverImage: string | null;
}) {
  type ImageFields = keyof typeof initial;

  const [imgSrc, imgSrcSet] = useState(initial);
  const [files, filesSet] = useState<Partial<Record<ImageFields, File>>>({});
  const [crop, cropSet] = useState<{
    aspect: number;
    field: ImageFields | null;
    open: boolean;
    src: string;
  }>({
    aspect: 0,
    field: null,
    open: false,
    src: "",
  });
  const [cropDimensions, cropDimensionsSet] = useState<{
    height: number;
    width: number;
    x: number;
    y: number;
  }>({
    height: 0,
    width: 0,
    x: 0,
    y: 0,
  });

  function selectFile(field: ImageFields, file: File) {
    if (imgSrc[field]) {
      URL.revokeObjectURL(imgSrc[field]);
    }

    const url = URL.createObjectURL(file);

    filesSet((prev) => ({ ...prev, [field]: file }));
    imgSrcSet((prev) => ({ ...prev, [field]: url }));
    cropSet({
      field,
      aspect: field === "photo" ? 1 / 1 : 3 / 1,
      open: true,
      src: url,
    });
  }

  function removeCoverImage() {
    if (imgSrc.coverImage && imgSrc.coverImage.startsWith("blob:")) {
      URL.revokeObjectURL(imgSrc.coverImage);
      filesSet((prev) => ({ ...prev, coverImage: undefined }));
    }
    imgSrcSet((prev) => ({ ...prev, coverImage: null }));
  }

  const closeCrop = () =>
    cropSet({ aspect: 0, field: null, open: false, src: "" });

  function reset() {
    Object.values(imgSrc).forEach((url) => {
      if (url?.startsWith("blob:")) {
        URL.revokeObjectURL(url);
      }
    });
    imgSrcSet(initial);
    filesSet({});
    closeCrop();
  }

  async function cropFile() {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.src = crop.src;
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

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          return reject(new Error("Crop failed"));
        }
        resolve(blob);
      }, "image/jpeg");
    });

    const file = new File([blob], "cropped.jpeg", { type: "image/jpeg" });

    const url = URL.createObjectURL(file);

    URL.revokeObjectURL(crop.src);

    imgSrcSet((prev) => ({ ...prev, [crop.field!]: url }));
    filesSet((prev) => ({ ...prev, [crop.field!]: file }));

    closeCrop();
  }

  return {
    crop,
    imgSrc,
    files,
    closeCrop,
    cropDimensionsSet,
    cropFile,
    removeCoverImage,
    reset,
    selectFile,
  };
}
