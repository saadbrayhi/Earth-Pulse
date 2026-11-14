import { CircleAlert, LoaderCircle } from "lucide-react";

export function MapStatus({
  title = "Preparing your map",
  detail = "Loading the interactive radar viewer…",
  error = false,
  onRetry,
}: {
  title?: string;
  detail?: string;
  error?: boolean;
  onRetry?: () => void;
}) {
  return (
    <div className="map-status" role={error ? "alert" : "status"}>
      {error ? (
        <CircleAlert size={24} className="text-orange-300" />
      ) : (
        <LoaderCircle size={24} className="animate-spin text-teal-300 motion-reduce:animate-none" />
      )}
      <p className="font-medium text-slate-100">{title}</p>
      <p className="max-w-sm text-sm leading-relaxed text-slate-400">{detail}</p>
      {onRetry && (
        <button className="secondary-button mt-2" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
