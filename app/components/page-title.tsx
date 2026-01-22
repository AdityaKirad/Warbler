import { ArrowLeftIcon } from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "./ui/button";

export function PageTitle({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  const navigate = useNavigate();
  return (
    <div className="bg-background/70 sticky top-0 z-10 flex items-center gap-4 p-2 backdrop-blur-lg">
      <Button
        className="rounded-full"
        variant="ghost"
        size="icon"
        onClick={() => navigate(-1)}
        aria-label="Back">
        <ArrowLeftIcon />
      </Button>
      {description ? (
        <div className="leading-none">
          <h2 className="text-xl font-bold">{title}</h2>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
      ) : (
        <h2 className="text-xl font-bold">{title}</h2>
      )}
    </div>
  );
}
