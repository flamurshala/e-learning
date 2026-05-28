export function getCurrentAdminActor() {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "{}");
    return {
      id: user.id || null,
      username: user.username || "Unknown",
      role: user.role || localStorage.getItem("userRole") || "",
    };
  } catch {
    return {
      id: null,
      username: "Unknown",
      role: localStorage.getItem("userRole") || "",
    };
  }
}

export function getCurrentAdminQueryString() {
  const actor = getCurrentAdminActor();
  const params = new URLSearchParams();
  if (actor.id) params.set("actor_id", actor.id);
  return params.toString();
}
