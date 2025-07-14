import { useEffect, useState } from "react";

function SessionTimer({ sessionId, onFifteenMinutes, onTick }) {
  const [seconds, setSeconds] = useState(0);
  const [stopped, setStopped] = useState(false);

  const lockKey = `session_locked_${sessionId}`;
  const startKey = `session_start_${sessionId}`;

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

      if (elapsed >= 240) {
        setStopped(true);
        localStorage.setItem(lockKey, "locked");
        clearInterval(interval);
        onFifteenMinutes(); // lock attendance form
      } else {
        setSeconds(elapsed);
        if (onTick) onTick(elapsed);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionId, onFifteenMinutes, onTick]);

  const getCardClass = (limit) => {
    if (seconds >= limit) {
      if (limit === 120) return "bg-yellow-400";
      if (limit === 180) return "bg-orange-500";
      if (limit === 240) return "bg-red-600 text-white";
    }
    return "bg-gray-300";
  };

  return (
    <div className="mb-4">
      <p className="text-blue-700 font-semibold mb-4">
        Session time: {Math.floor(seconds / 60)}m {seconds % 60}s
      </p>

      <div className="flex gap-4">
        <div className={`p-3 rounded shadow text-center w-24 ${getCardClass(120)}`}>
          <p className="text-sm font-medium">2 min</p>
        </div>
        <div className={`p-3 rounded shadow text-center w-24 ${getCardClass(180)}`}>
          <p className="text-sm font-medium">3 min</p>
        </div>
        <div className={`p-3 rounded shadow text-center w-24 ${getCardClass(240)}`}>
          <p className="text-sm font-medium">4 min</p>
        </div>
      </div>
    </div>
  );
}

export default SessionTimer;
