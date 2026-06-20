'use client';

/**
 * Inline pre-flight pill for the limit-order ticket — reflects `spot_can_place_limit_order`. Green ✓
 * when valid, clay ✗ with a reason when not (the ticket disables its Place CTA on invalid). No sign.
 */
export function OrderValidityHint({
  valid,
  reason,
  className = '',
}: {
  valid: boolean;
  reason?: string;
  className?: string;
}) {
  if (valid) {
    return (
      <div className={`flex items-center gap-[7px] rounded-[8px] border border-[#DCEAE2] bg-[#F4F7F4] px-3 py-2 ${className}`}>
        <span className="flex size-4 flex-none items-center justify-center rounded-full bg-green text-[10px] text-white">✓</span>
        <span className="text-[11.5px] font-semibold text-green">Order is valid</span>
      </div>
    );
  }
  return (
    <div className={`flex items-center gap-[7px] rounded-[8px] border border-[#E6C9BE] bg-[#FBF1EC] px-3 py-2 ${className}`}>
      <span className="flex size-4 flex-none items-center justify-center rounded-full bg-clay text-[10px] text-white">✗</span>
      <span className="text-[11.5px] font-semibold text-[#8a2f1c]">{reason ?? "Can't place — insufficient balance or size"}</span>
    </div>
  );
}
