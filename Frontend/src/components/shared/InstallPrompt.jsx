import { useState, useEffect } from "react";
import { X, Share, PlusSquare } from "lucide-react";

function isIos() {
  return /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
}

function isInStandaloneMode() {
  return (
    "standalone" in window.navigator && window.navigator.standalone
  ) || window.matchMedia("(display-mode: standalone)").matches;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem("tt_install_dismissed") === "true"
  );

  useEffect(() => {
    if (isInStandaloneMode() || dismissed) return;

    // Android/Chrome — capture the native install event
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // iOS Safari — no native prompt, show a manual hint after a short delay
    if (isIos()) {
      const timer = setTimeout(() => setShowIosHint(true), 3000);
      return () => clearTimeout(timer);
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, [dismissed]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted" || outcome === "dismissed") {
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem("tt_install_dismissed", "true");
    setDismissed(true);
    setDeferredPrompt(null);
    setShowIosHint(false);
  };

  if (dismissed || (!deferredPrompt && !showIosHint)) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 inset-x-4 z-50 max-w-sm mx-auto">
      <div className="bg-gray-900 text-white rounded-2xl px-4 py-3.5 shadow-xl flex items-center gap-3">
        <div className="flex-1 min-w-0">
          {deferredPrompt ? (
            <>
              <p className="text-sm font-semibold">Install TrainTrackr</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Add to your home screen for quick access
              </p>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold flex items-center gap-1.5">
                Install TrainTrackr
              </p>
              <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1 flex-wrap">
                Tap <Share size={12} className="inline" /> then{" "}
                <PlusSquare size={12} className="inline" /> "Add to Home Screen"
              </p>
            </>
          )}
        </div>
        {deferredPrompt && (
          <button
            onClick={handleInstall}
            className="bg-white text-gray-900 text-xs font-semibold px-3 py-2 rounded-xl shrink-0"
          >
            Install
          </button>
        )}
        <button
          onClick={handleDismiss}
          className="p-1.5 rounded-lg text-gray-400 hover:bg-white/10 transition-colors shrink-0"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}