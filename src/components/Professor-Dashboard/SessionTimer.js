import { useEffect, useState } from "react";

function SessionTimer({ sessionId, onFifteenMinutes, onTick }) {
  const [seconds, setSeconds] = useState(0);
  const [stopped, setStopped] = useState(false);

  const lockKey = `session_locked_${sessionId}`;
  const startKey = `session_start_${sessionId}`;

  // Cutoff (20 minutes)
  const CUTOFF_SECONDS = 15 * 60; // 1200
  const WARN1 = 5 * 60; // 600
  const WARN2 = 10 * 60; // 900

  useEffect(() => {
    if (!sessionId) return;

    let sessionStart = localStorage.getItem(startKey);
    if (!sessionStart) {
      sessionStart = Date.now();
      localStorage.setItem(startKey, sessionStart.toString());
    } else {
      sessionStart = parseInt(sessionStart, 10);
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - sessionStart) / 1000);

      if (elapsed >= CUTOFF_SECONDS) {
        setSeconds(elapsed);
        setStopped(true);
        localStorage.setItem(lockKey, "locked");
        clearInterval(interval);
        // Fire the cutoff callback (kept old name for compatibility)
        if (onFifteenMinutes) onFifteenMinutes();
      } else {
        setSeconds(elapsed);
        if (onTick) onTick(elapsed);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionId, onFifteenMinutes, onTick]);

  const getCardClass = (limit) => {
    if (seconds >= limit) {
      if (limit === WARN1) return "bg-yellow-400";
      if (limit === WARN2) return "bg-orange-500";
      if (limit === CUTOFF_SECONDS) return "bg-red-600 text-white";
    }
    return "bg-gray-300";
  };

  return (
    <div className="mb-4">
      <p className="text-blue-700 font-semibold mb-4">
        Session time: {Math.floor(seconds / 60)}m {seconds % 60}s
      </p>

      <div className="flex gap-4">
        <div className={`p-3 rounded shadow text-center w-24 ${getCardClass(WARN1)}`}>
          <p className="text-sm font-medium">5 min</p>
        </div>
        <div className={`p-3 rounded shadow text-center w-24 ${getCardClass(WARN2)}`}>
          <p className="text-sm font-medium">10 min</p>
        </div>
        <div className={`p-3 rounded shadow text-center w-24 ${getCardClass(CUTOFF_SECONDS)}`}>
          <p className="text-sm font-medium">15 min</p>
        </div>
      </div>
    </div>
  );
}

export default SessionTimer;
