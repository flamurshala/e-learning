import { useState, useEffect } from "react";
import img from "../img/logo.png";
import { useNavigate } from "react-router-dom";

export default function Login() {
  useEffect(() => {
    document.title = "Professor Login - Tectigon Academy";
  }, []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async () => {
    const res = await fetch(
      `${process.env.REACT_APP_API_URL}/professorLogin.php`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      }
    );
    const data = await res.json();
    console.log(data);

    if (data.success) {
      localStorage.setItem("professorId", data.user.id);
      navigate("/professor/calendar/:courseId");
    } else {
      setError(data.message);
    }
  };

  return (
    <section className="flex flex-col items-center justify-center min-h-screen w-full bg-gradient-to-br bg-[#152259]">
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
              className="w-full bg-[#152259] hover:bg-[#152239] text-white font-semibold py-3 rounded-lg transition"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
