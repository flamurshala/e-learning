import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import img from "../img/logo.png";

export default function Login() {
  useEffect(() => {
    document.title = "Student Login - Tectigon Academy";
  }, []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    const res = await fetch("http://localhost/backend/studentLogin.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    console.log("Login response:", data);

    if (data.success && data.user && data.user.id) {
      localStorage.setItem("studentId", data.user.id);
      navigate("/StudentDashboard");
    } else {
      setError(data.message || "Login failed");
    }
  };

  return (
    <section className="flex flex-col items-center justify-center min-h-screen w-full bg-gradient-to-br bg-[#0e6cff]">
      <img src={img} className="w-[15%] mb-8 drop-shadow-lg" alt="Logo" />
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
            Login
          </h2>
          {error && <p className="text-red-500 text-center mb-4">{error}</p>}
          
          <form
            onSubmit={(e) => {
              e.preventDefault(); 
              handleLogin();    
            }}
          >
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full mb-4 px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 transition rounded-lg"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full mb-6 px-4 py-3 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 transition rounded-lg"
              required
            />
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
