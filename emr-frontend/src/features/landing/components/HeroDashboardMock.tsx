import { LineChartOutlined, ClockCircleOutlined } from "@ant-design/icons";
import { PulseDot } from "./PulseDot";
import { queue, heroKpis, heroLiveStats } from "../data/queue";

const initials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");

export const HeroDashboardMock = () => (
  <div className="relative">
    <div className="absolute -inset-6 bg-gradient-to-tr from-[var(--color-green-custom)]/20 via-[var(--color-green-custom)]/0 to-emerald-300/30 rounded-3xl blur-2xl" />

    <div className="absolute -top-3 -right-2 z-10 hidden sm:flex items-center gap-2 rounded-full bg-white shadow-lg px-3.5 py-1.5 border border-emerald-100">
      <PulseDot color="bg-emerald-500" />
      <span className="text-xs font-semibold text-gray-700">
        Live · {heroLiveStats.facilitiesOnline} facilities online
      </span>
    </div>

    <div className="absolute -bottom-6 -left-4 z-10 hidden sm:flex items-center gap-3 rounded-xl bg-white shadow-xl px-4 py-3 border border-gray-100">
      <span className="w-9 h-9 rounded-lg bg-[var(--color-green-custom)]/10 text-[var(--color-green-custom)] flex items-center justify-center">
        <LineChartOutlined />
      </span>
      <div>
        <div className="text-[11px] uppercase tracking-wider text-gray-500">
          Today vs Yesterday
        </div>
        <div className="text-sm font-semibold text-[var(--color-green-custom)]">
          +{heroLiveStats.encountersDelta}% encounters
        </div>
      </div>
    </div>

    <div className="relative bg-white rounded-2xl shadow-[var(--shadow-green-lg)] border border-[var(--green-100)] overflow-hidden">
      <div className="px-6 py-4 bg-[var(--color-green-custom)] text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <span key={i} className="w-2.5 h-2.5 rounded-full bg-white/40" />
          ))}
        </div>
        <span className="text-xs font-medium opacity-90 tracking-wide">
          EMR · Facility Dashboard
        </span>
        <span className="w-2.5 h-2.5" />
      </div>

      <div className="p-6 grid grid-cols-3 gap-3">
        {heroKpis.map((c) => (
          <div
            key={c.k}
            className="rounded-xl border border-gray-100 p-3.5 bg-gradient-to-br from-white to-gray-50"
          >
            <div className="text-[11px] text-gray-500 leading-tight">{c.k}</div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <div className="text-2xl font-bold text-[var(--color-green-custom)]">
                {c.v}
              </div>
              <div className="text-[10px] font-semibold text-emerald-600">
                +{c.delta}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="px-6 pb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-gray-700">Live Queue</span>
          <span className="text-[10px] uppercase tracking-wider text-gray-400">
            Updated just now
          </span>
        </div>
        <div className="space-y-2">
          {queue.map((row) => (
            <div
              key={row.name}
              className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2.5 hover:border-[var(--color-green-custom)]/30 transition"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-[var(--color-green-custom)]/10 text-[var(--color-green-custom)] flex items-center justify-center font-semibold text-xs shrink-0">
                  {initials(row.name)}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold truncate">{row.name}</div>
                  <div className="text-[11px] text-gray-500 truncate">{row.svc}</div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${row.tagColor}`}
                >
                  {row.tag}
                </span>
                <span className="text-[11px] font-mono text-gray-500">
                  {row.time}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-6 pb-5 flex items-center justify-between text-[11px] text-gray-500 border-t border-gray-100 pt-3">
        <span className="inline-flex items-center gap-1.5">
          <ClockCircleOutlined /> Synced {heroLiveStats.syncedSecondsAgo}s ago
        </span>
      </div>
    </div>
  </div>
);
