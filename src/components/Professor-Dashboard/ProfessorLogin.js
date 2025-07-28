import { useState, useEffect } from "react";
import img from "../img/logo.png";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Professor Login - Tectigon Academy";
  }, []);

  const handleLogin = async () => {
    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/ProfessorLogin.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const text = await res.text();
      try {
        const data = JSON.parse(text);

        if (data.success) {
          localStorage.setItem("professorId", data.user.id);
          navigate(`/professor/calendar/${data.user.course_id}`);
        } else {
          setError(data.message);
        }
      } catch (jsonError) {
        console.error("JSON parse error:", text);
        setError("Server error: invalid response");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to connect to server");
    }
  };

  return (
    <section className="flex flex-col items-center justify-center min-h-screen w-full bg-[#152259] relative">
      <button
        onClick={() => navigate(-1)}
        className="absolute top-6 left-6 text-blue bg-white hover:bg-[#CECECE] px-4 py-2 rounded-md shadow-md"
      >
        ← Back
      </button>

      <img src={img} className="w-[15%] mb-8 drop-shadow-lg" alt="Logo" />
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
            Professor Login
          </h2>
          {error && <p className="text-red-500 text-center mb-4">{error}</p>}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLogin();
            }}
          >
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="block w-full mb-4 px-4 py-3 border border-gray-300 focus:ring-2 focus:ring-blue-400 rounded-lg"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full mb-6 px-4 py-3 border border-gray-300 focus:ring-2 focus:ring-blue-400 rounded-lg"
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
