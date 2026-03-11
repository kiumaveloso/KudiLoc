import React, { useRef, useState, useCallback } from "react";
import { RefreshCw } from "lucide-react";

const THRESHOLD = 72;

export default function PullToRefresh({ onRefresh, children }) {
  const startY = useRef(null);
  const [pullDelta, setPullDelta] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const onTouchStart = useCallback((e) => {
    // Only activate if scrolled to top
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
    }
  }, []);

  const onTouchMove = useCallback((e) => {
    if (startY.current === null || refreshing) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) {
      setPullDelta(Math.min(delta * 0.45, THRESHOLD + 20));
    }
  }, [refreshing]);

  const onTouchEnd = useCallback(async () => {
    if (pullDelta >= THRESHOLD && !refreshing) {
      setRefreshing(true);
      setPullDelta(THRESHOLD);
      await onRefresh();
      setRefreshing(false);
    }
    setPullDelta(0);
    startY.current = null;
  }, [pullDelta, refreshing, onRefresh]);

  const progress = Math.min(pullDelta / THRESHOLD, 1);
  const showIndicator = pullDelta > 8;

  return (
    <div
      className="relative flex-1 flex flex-col"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Pull indicator */}
      <div
        className="absolute top-0 left-0 right-0 flex items-center justify-center z-[2000] pointer-events-none transition-all duration-150"
        style={{ height: pullDelta, opacity: showIndicator ? 1 : 0 }}
      >
        <div
          className="w-9 h-9 bg-white rounded-full shadow-lg flex items-center justify-center border border-slate-100"
          style={{ transform: `rotate(${progress * 360}deg)` }}
        >
          <RefreshCw
            className={`w-4 h-4 ${refreshing ? "text-[#10B981] animate-spin" : "text-slate-400"}`}
          />
        </div>
      </div>

      <div
        className="flex-1 flex flex-col transition-transform duration-150"
        style={{ transform: `translateY(${pullDelta}px)` }}
      >
        {children}
      </div>
    </div>
  );
}