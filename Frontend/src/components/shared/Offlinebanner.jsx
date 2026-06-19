import { useOnlineStatus } from "../../hooks/useOnlineStatus.js";
import { WifiOff } from "lucide-react";

export default function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-[60] bg-amber-500 text-white px-4 py-2.5 flex items-center justify-center gap-2 shadow-md">
      <WifiOff size={14} className="shrink-0" />
      <p className="text-xs font-semibold">
        You're offline — showing cached data
      </p>
    </div>
  );
}