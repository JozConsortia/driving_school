import type { SVGProps } from "react";

function StarShape(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.007 5.404.433c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.433 2.082-5.006Z" />
    </svg>
  );
}

const SIZE = {
  sm: { star: "h-3.5 w-3.5", text: "text-xs", gap: "gap-1" },
  md: { star: "h-5 w-5", text: "text-sm", gap: "gap-1.5" },
  lg: { star: "h-7 w-7", text: "text-lg", gap: "gap-2" },
};

interface StarRatingProps {
  /** Average rating out of 5, or null/undefined if the school has no reviews yet. */
  rating: number | null | undefined;
  /** Number of reviews behind the rating. */
  count?: number;
  size?: keyof typeof SIZE;
  /** Show the numeric value (and count) next to the stars. */
  showValue?: boolean;
  className?: string;
}

/** A friendly, fractional-fill star rating — used everywhere a school's rating is shown. */
export function StarRating({ rating, count, size = "md", showValue = true, className = "" }: StarRatingProps) {
  const { star, text, gap } = SIZE[size];

  if (rating == null) {
    return (
      <div className={`flex items-center ${gap} ${className}`}>
        <div className="flex">
          {Array.from({ length: 5 }).map((_, i) => (
            <StarShape key={i} className={`${star} text-slate-200`} />
          ))}
        </div>
        {showValue && <span className={`${text} text-slate-400`}>No reviews yet</span>}
      </div>
    );
  }

  const fillPct = Math.max(0, Math.min(100, (rating / 5) * 100));

  return (
    <div className={`flex items-center ${gap} ${className}`}>
      <div className="relative flex">
        <div className="flex">
          {Array.from({ length: 5 }).map((_, i) => (
            <StarShape key={i} className={`${star} text-slate-200`} />
          ))}
        </div>
        <div className="absolute inset-0 flex overflow-hidden" style={{ width: `${fillPct}%` }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <StarShape key={i} className={`${star} shrink-0 text-amber-400`} />
          ))}
        </div>
      </div>
      {showValue && (
        <span className={`${text} font-semibold text-slate-700`}>
          {rating.toFixed(1)}
          {count != null && <span className="font-normal text-slate-400"> ({count})</span>}
        </span>
      )}
    </div>
  );
}
