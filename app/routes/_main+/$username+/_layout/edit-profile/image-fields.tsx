import { Button } from "~/components/ui/button";
import { useFileInput } from "~/hooks/use-file-input";
import { cn } from "~/lib/utils";
import { CameraIcon, XIcon } from "lucide-react";
import { toast } from "sonner";

export function ProfileImage({
  photo,
  username,
  selectFile,
}: {
  photo: string;
  username: string;
  selectFile: (file: File) => void;
}) {
  const {
    accept,
    dragOver,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    handleFileInputChange,
  } = useFileInput({
    maxSize: 2 * 1024 * 1024,
    type: "profile",
    onFiles(files) {
      const file = files[0];
      if (!file) {
        return;
      }
      selectFile(file);
    },
    onInvalidFiles() {
      toast(`Invalid file type or file exceeds size limit`);
    },
  });
  return (
    <div
      className={cn(
        "bg-background absolute -bottom-16 left-4 size-32 rounded-full p-1",
        {
          "cursor-copy outline-2 outline-blue-500 outline-dashed": dragOver,
        },
      )}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}>
      <img
        className="size-full rounded-full object-cover object-center"
        src={photo}
        alt={`@${username}`}
        decoding="async"
        loading="lazy"
      />
      <label className="bg-background/60 hover:bg-background/70 focus-within:bg-background/70 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full p-2 transition-colors">
        <CameraIcon />
        <input
          className="sr-only"
          type="file"
          accept={accept}
          onChange={handleFileInputChange}
        />
      </label>
    </div>
  );
}

export function CoverImage({
  coverImage,
  username,
  removeCoverImage,
  selectFile,
}: {
  coverImage: string | null;
  username: string;
  removeCoverImage: () => void;
  selectFile: (file: File) => void;
}) {
  const {
    accept,
    dragOver,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
    handleFileInputChange,
  } = useFileInput({
    maxSize: 5 * 1024 * 1024,
    type: "profile",
    onFiles(files) {
      const file = files[0];
      if (!file) {
        return;
      }
      selectFile(file);
    },
    onInvalidFiles() {
      toast(`Invalid file type or file exceeds size limit`);
    },
  });
  return (
    <div
      className={cn("relative h-full gap-4", {
        "cursor-copy outline-2 outline-blue-500 outline-dashed": dragOver,
      })}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}>
      {coverImage && (
        <img
          className="size-full object-cover object-center"
          src={coverImage}
          alt={`@${username}`}
          loading="lazy"
          decoding="async"
        />
      )}
      <div className="absolute top-1/2 left-1/2 flex -translate-x-1/2 -translate-y-1/2 gap-4">
        <label className="bg-accent/60 hover:bg-accent/70 focus-within:bg-background/70 rounded-full p-2 transition-colors">
          <CameraIcon />
          <input
            className="sr-only"
            type="file"
            accept={accept}
            onChange={handleFileInputChange}
          />
        </label>
        {coverImage && (
          <Button
            className="hover:bg-accent/70 bg-accent/60 text-accent-foreground rounded-full"
            type="button"
            size="icon"
            onClick={removeCoverImage}>
            <XIcon />
          </Button>
        )}
      </div>
    </div>
  );
}
