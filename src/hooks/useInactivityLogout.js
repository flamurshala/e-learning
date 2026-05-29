import { useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";

const ADMINISTRATA_TIMEOUT_MS = 5 * 60 * 1000;
const DEFAULT_ADMIN_TIMEOUT_MS = 90 * 60 * 1000;

export function useInactivityLogout(enabled, redirectTo = "/AdminLogin", role = "") {
  const navigate = useNavigate();
  const timerRef = useRef(null);
  const timeoutMs =
    role === "administrata" ? ADMINISTRATA_TIMEOUT_MS : DEFAULT_ADMIN_TIMEOUT_MS;

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
    timerRef.current = setTimeout(logout, timeoutMs);
  }, [enabled, logout, timeoutMs]);

  useEffect(() => {
    if (!enabled) return;

    const last = parseInt(localStorage.getItem("lastActivity") || "0", 10);
    if (last && Date.now() - last > timeoutMs) {
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
  }, [enabled, logout, resetTimer, timeoutMs]);
}
