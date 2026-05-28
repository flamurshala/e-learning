import { useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";

const TIMEOUT_MS = 5 * 60 * 1000;

export function useInactivityLogout(enabled, redirectTo = "/AdminLogin") {
  const navigate = useNavigate();
  const timerRef = useRef(null);

  const logout = useCallback(() => {
    localStorage.removeItem("user");
    localStorage.removeItem("userRole");
    localStorage.removeItem("lastActivity");
    navigate(redirectTo, { replace: true });
  }, [navigate, redirectTo]);

  const resetTimer = useCallback(() => {
    if (!enabled) return;
    clearTimeout(timerRef.current);
    localStorage.setItem("lastActivity", Date.now().toString());
    timerRef.current = setTimeout(logout, TIMEOUT_MS);
  }, [enabled, logout]);

  useEffect(() => {
    if (!enabled) return;

    const last = parseInt(localStorage.getItem("lastActivity") || "0", 10);
    if (last && Date.now() - last > TIMEOUT_MS) {
      logout();
      return;
    }

    const events = ["mousedown", "keydown", "scroll", "touchstart", "click"];
    events.forEach((e) => window.addEventListener(e, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timerRef.current);
      events.forEach((e) => window.removeEventListener(e, resetTimer));
    };
  }, [enabled, logout, resetTimer]);
}
