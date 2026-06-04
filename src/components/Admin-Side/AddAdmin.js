import { useState, useEffect } from "react";
import AdminNav from "./AdminNav";
import { getCurrentAdminActor } from "../../utils/currentAdmin";

export default function RegisterAdmin() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("admin");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    document.title = "Register Admin - Tectigon Academy";
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (role === "administrata" && !/^\d{4}$/.test(username.trim())) {
      setError("Administrata code must be exactly 4 digits.");
      return;
    }

    const res = await fetch(`${process.env.REACT_APP_API_URL}/register_admin.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        email,
        password: role === "administrata" ? username : password,
        role,
        actor: getCurrentAdminActor(),
      }),
    });

    const data = await res.json();

    if (data.success) {
      setSuccess("User registered successfully!");
      setUsername("");
      setEmail("");
      setPassword("");
      setRole("admin");
      setError("");
    } else {
      setError(data.error || "Something went wrong.");
      setSuccess("");
    }
  };

  return (
    <div className="flex">
      {/* Sidebar */}
      <AdminNav />

      {/* Main Content */}
      <div className="ml-[22%] mt-10 w-[75%] flex justify-start">
        <div className="bg-white shadow-md border border-black rounded p-6 w-[400px]">
          <h2 className="text-2xl font-semibold mb-4">Register Admin/Superadmin/Administrata</h2>
          {success && <p className="text-green-600 mb-4">{success}</p>}
          {error && <p className="text-red-600 mb-4">{error}</p>}
          <form onSubmit={handleRegister}>
            <input
              type="text"
              placeholder={role === "administrata" ? "4-digit code" : "Username"}
              className="w-full mb-3 p-2 border border-gray-300 rounded"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              maxLength={role === "administrata" ? 4 : undefined}
              pattern={role === "administrata" ? "\\d{4}" : undefined}
              required
            />
            {role !== "administrata" && (
              <>
                <input
                  type="email"
                  placeholder="Email"
                  className="w-full mb-3 p-2 border border-gray-300 rounded"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full mb-3 p-2 border border-gray-300 rounded"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </>
            )}
            {role === "administrata" && (
              <p className="text-sm text-gray-600 mb-3">
                This user will log in from the admin page by entering only this
                4-digit code.
              </p>
            )}
            <select
              className="w-full mb-4 p-2 border border-gray-300 rounded"
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                setEmail("");
                setPassword("");
                setError("");
                setSuccess("");
              }}
            >
              <option value="admin">Admin</option>
              <option value="superadmin">Superadmin</option>
              <option value="administrata">Administrata</option>
            </select>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white w-full py-2 rounded"
            >
              Register
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
