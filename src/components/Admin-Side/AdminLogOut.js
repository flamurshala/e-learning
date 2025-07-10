import { useNavigate } from "react-router-dom";
function LogOut() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");

    navigate("/");
  };

  return (
    <button
      onClick={handleLogout}
      className="text-white cursor-pointer font-bold rounded-lg transition"
      >
        Log Out
    </button>
  );
}

export default LogOut;