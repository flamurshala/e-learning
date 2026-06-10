import { useEffect, useRef, useState } from "react";

const CUTOFF_SECONDS = 15 * 60;
const WARN1 = 5 * 60;
const WARN2 = 10 * 60;

function SessionTimer({ sessionId, onFifteenMinutes, onTick }) {
  const [seconds, setSeconds] = useState(0);
  const [stopped, setStopped] = useState(false);
  const cutoffFiredRef = useRef(false);
  const onFifteenMinutesRef = useRef(onFifteenMinutes);
  const onTickRef = useRef(onTick);

  const lockKey = `session_locked_${sessionId}`;
  const startKey = `session_start_${sessionId}`;

  useEffect(() => {
    onFifteenMinutesRef.current = onFifteenMinutes;
  }, [onFifteenMinutes]);

  useEffect(() => {
    onTickRef.current = onTick;
  }, [onTick]);

  useEffect(() => {
    if (!sessionId) return;
    cutoffFiredRef.current = false;

    let sessionStart = localStorage.getItem(startKey);
    if (!sessionStart) {
      sessionStart = Date.now();
      localStorage.setItem(startKey, sessionStart.toString());
    } else {
      sessionStart = parseInt(sessionStart, 10);
    }

    const stopAtCutoff = () => {
      if (cutoffFiredRef.current) return;
      cutoffFiredRef.current = true;
      setSeconds(CUTOFF_SECONDS);
      setStopped(true);
      localStorage.setItem(lockKey, "locked");
      if (onTickRef.current) onTickRef.current(CUTOFF_SECONDS);
      if (onFifteenMinutesRef.current) onFifteenMinutesRef.current();
    };

    if (localStorage.getItem(lockKey) === "locked") {
      stopAtCutoff();
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = Math.floor((now - sessionStart) / 1000);

      if (elapsed >= CUTOFF_SECONDS) {
        stopAtCutoff();
        clearInterval(interval);
      } else {
        setSeconds(elapsed);
        if (onTickRef.current) onTickRef.current(elapsed);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionId, lockKey, startKey]);

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
        {stopped && <span className="ml-2 text-red-600">(stopped)</span>}
      </p>

      <div className="flex flex-wrap gap-4">
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
