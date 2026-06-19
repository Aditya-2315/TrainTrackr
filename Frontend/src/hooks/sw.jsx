import { useEffect } from "react";
import { registerSW } from "virtual:pwa-register";
import toast from "react-hot-toast";

export function usePwaUpdate() {
  useEffect(() => {
    const updateSW = registerSW({
      immediate: true ,
      onNeedRefresh() {
        toast(
          (t) => (
            <div className="flex items-center gap-3">
              <span className="text-sm">New version available</span>
              <button
                onClick={() => {
                  updateSW(true);
                  toast.dismiss(t.id);
                }}
                className="text-sm font-semibold underline underline-offset-2"
              >
                Refresh
              </button>
            </div>
          ),
          { duration: Infinity }
        );
      },
      onOfflineReady() {
        toast.success("App ready to work offline");
      },
    });
  }, []);
}