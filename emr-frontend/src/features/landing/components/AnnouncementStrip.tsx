import { PulseDot } from "./PulseDot";

export const AnnouncementStrip = () => (
  <div
    className="text-white text-xs sm:text-sm"
    style={{
      background:
        "linear-gradient(90deg, var(--color-green-custom) 0%, #0a5d34 100%)",
    }}
  >
    <div className="max-w-7xl mx-auto px-6 lg:px-10 h-9 flex items-center justify-between gap-4">
      <div className="flex items-center gap-2 truncate">
        <PulseDot />
        <span className="truncate">
          Live across <strong className="font-semibold">150+ facilities</strong>{" "}
          in Sindh — powering frontline care every day.
        </span>
      </div>
    </div>
  </div>
);
