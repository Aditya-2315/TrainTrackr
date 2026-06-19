import { useOnlineStatus } from "../../hooks/useOnlineStatus";

export default function OfflineAwareLayout({ children }) {
  const isOnline = useOnlineStatus();

  return (
    <div className={isOnline ? "" : "pt-9"}>
      {children}
    </div>
  );
}