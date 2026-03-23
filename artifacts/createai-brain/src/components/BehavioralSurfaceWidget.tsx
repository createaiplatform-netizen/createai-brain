/**
 * BehavioralSurfaceWidget — most-used apps + next predicted surfaces
 * ──────────────────────────────────────────────────────────────────
 * Uses /api/contextual/predict (behavioral data) to show the user
 * what they'll likely want next. Compact, zero-config, drop-in ready.
 *
 * Props:
 *   limit?    — max surfaces to show (default 4)
 *   className? — optional wrapper class
 */

import { usePredictiveSurfaces } from "@/hooks/usePredictiveSurfaces";

interface Props {
  limit?:    number;
  className?: string;
}

export function BehavioralSurfaceWidget({ limit = 4, className = "" }: Props) {
  const { data, isLoading, isError } = usePredictiveSurfaces(limit);

  if (isLoading) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: limit }).map((_, i) => (
          <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (isError || !data?.surfaces?.length) return null;

  return (
    <div className={`space-y-1 ${className}`}>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
        Suggested for you
      </p>
      {data.surfaces.map(s => (
        <a
          key={s.id}
          href={s.url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#f0f4ee] transition-colors group"
        >
          <span className="text-xl leading-none">{s.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate group-hover:text-[#7a9068]">
              {s.title}
            </p>
            {s.tagline && (
              <p className="text-xs text-gray-400 truncate">{s.tagline}</p>
            )}
          </div>
          <span className="text-[10px] text-gray-300 group-hover:text-[#9CAF88] shrink-0">
            {s.predicted ? "new" : ""}
          </span>
        </a>
      ))}
    </div>
  );
}
