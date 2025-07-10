import { useEffect, useState } from "react";

function SessionTimer({ onFifteenMinutes, onTick }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((prev) => {
        const next = prev + 1;
        if (next === 900) onFifteenMinutes();
        if (onTick) onTick(next);
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onFifteenMinutes, onTick]);

  const getCardClass = (limit) => {
    if (seconds >= limit) {
      if (limit === 300) return "bg-yellow-400";
      if (limit === 600) return "bg-orange-500";
      if (limit === 900) return "bg-red-600 text-white";
    }
    return "bg-gray-300";
  };

  return (
    <div className="mb-4">
      <p className="text-blue-700 font-semibold mb-4">
        Session started: {Math.floor(seconds / 60)}m {seconds % 60}s
      </p>

      <div className="flex gap-4">
        <div className={`p-3 rounded shadow text-center w-24 ${getCardClass(300)}`}>
          <p className="text-sm font-medium">5 min</p>
        </div>
        <div className={`p-3 rounded shadow text-center w-24 ${getCardClass(600)}`}>
          <p className="text-sm font-medium">10 min</p>
        </div>
        <div className={`p-3 rounded shadow text-center w-24 ${getCardClass(900)}`}>
          <p className="text-sm font-medium">15 min</p>
        </div>
      </div>
    </div>
  );
}

export default SessionTimer;
