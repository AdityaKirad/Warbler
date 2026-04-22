import { Slider } from "~/components/ui/slider";
import { useState } from "react";
import Cropper from "react-easy-crop";

export function CropImage({
  image,
  aspect,
  onCropComplete,
}: {
  image: string;
  aspect: number;
  onCropComplete: (crop: {
    height: number;
    width: number;
    x: number;
    y: number;
  }) => void;
}) {
  const [crop, cropSet] = useState({
    x: 0,
    y: 0,
  });
  const [zoom, zoomSet] = useState(1);

  return (
    <>
      <div className="relative h-full">
        <Cropper
          image={image}
          aspect={aspect}
          crop={crop}
          zoom={zoom}
          maxZoom={3}
          showGrid={false}
          onCropChange={cropSet}
          onZoomChange={zoomSet}
          onCropComplete={(_, croppedAreaPixels) =>
            onCropComplete(croppedAreaPixels)
          }
          style={{
            containerStyle: {
              paddingInline: "1rem",
              insetInline: "1rem",
            },
            cropAreaStyle: {
              border: "4px solid var(--color-blue-500)",
            },
            mediaStyle: {
              height: "auto",
            },
          }}
        />
      </div>
      <div className="bg-background px-16 py-2">
        <Slider
          min={1}
          max={3}
          step={0.01}
          value={[zoom]}
          onValueChange={(val) => zoomSet(val[0] as number)}
        />
      </div>
    </>
  );
}
