import { useQuery } from "@tanstack/react-query";
import { getMyWorkoutPlan } from "../../api/clients.api";
import { format, parseISO } from "date-fns";
import { FileText, ExternalLink, Dumbbell } from "lucide-react";

function getViewableUrl(url) {
  if (!url || !url.includes("cloudinary.com")) return url;
  return url.replace("/upload/", "/upload/fl_inline/");
}

export default function WorkoutPlanPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["myWorkoutPlan"],
    queryFn: getMyWorkoutPlan,
  });

  const plan = data?.workoutPlan;

  if (isLoading) {
    return (
      <div className="px-4 pt-6 max-w-lg mx-auto space-y-4">
        <div className="h-6 w-40 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-6 max-w-lg mx-auto space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Workout plan</h1>
        <p className="text-sm text-gray-400 mt-0.5">Your assigned training programme</p>
      </div>

      {plan ? (
        <div className="space-y-4">
          {/* Plan card */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                <Dumbbell size={22} className="text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold text-gray-900">{plan.title}</h2>
                {plan.createdBy && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Created by {plan.createdBy.name}
                  </p>
                )}
                {plan.createdAt && (
                  <p className="text-xs text-gray-400">
                    {format(parseISO(plan.createdAt), "MMM d, yyyy")}
                  </p>
                )}
              </div>
            </div>

            {plan.description && (
              <p className="text-sm text-gray-600 leading-relaxed border-t border-gray-50 pt-4">
                {plan.description}
              </p>
            )}
          </div>

          {/* PDF viewer */}
          {plan.fileUrl ? (
            <div className="space-y-3">
              {/* Open in new tab for mobile — embedded PDF viewer is bad on mobile */}
              
                href={getViewableUrl(plan.fileUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between bg-white border border-gray-100 rounded-2xl px-5 py-4 hover:border-gray-200 transition-colors"
              <a>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                    <FileText size={18} className="text-red-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">View PDF</p>
                    <p className="text-xs text-gray-400">Opens in browser</p>
                  </div>
                </div>
                <ExternalLink size={16} className="text-gray-300" />
              </a>

              {/* Embedded preview — desktop only, hidden on mobile */}
              <div className="hidden md:block bg-white border border-gray-100 rounded-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-50">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Preview
                  </p>
                </div>
                <iframe
                  src={getViewableUrl(plan.fileUrl)}
                  className="w-full"
                  style={{ height: "70vh" }}
                  title={plan.title}
                />
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 border border-gray-100 rounded-2xl px-5 py-6 text-center">
              <FileText size={24} className="text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No PDF attached to this plan</p>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-20">
          <Dumbbell size={32} className="text-gray-200 mx-auto mb-3" />
          <p className="text-sm text-gray-400">No workout plan assigned yet</p>
          <p className="text-xs text-gray-300 mt-1">
            Your trainer will assign one soon
          </p>
        </div>
      )}
    </div>
  );
}