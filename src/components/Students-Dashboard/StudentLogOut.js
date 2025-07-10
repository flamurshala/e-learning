import { useNavigate } from "react-router-dom";
function LogOut() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("studentId");

    navigate("/");
  };

  return (
    <button
      onClick={handleLogout}
      className="text-white bg-red-600 cursor-pointer font-bold py-1 px-3 rounded-lg transition"
      >
        Log Out
    </button>
  );
}

export default LogOut;