import img from "./img/LOGOS-02-e1721825559257-removebg-preview.png";
import teacher from "./img/Teacher.png";
import admin from "./img/Admin Name.png";
import { Link } from "react-router-dom";
import { useEffect } from "react";

function LoginAs() {
  useEffect(() => {
    document.title = "Login As - Tectigon Academy";
  }, []);

  return (
    <div className="flex h-screen w-screen">
      {/* Left Side - Logo */}
      <div className="w-1/2 bg-white flex items-center justify-center">
        <img src={img} alt="logo" className="w-[60%] max-w-[300px]" />
      </div>

      {/* Right Side - Form Section */}
      <div className="w-1/2 bg-[#0e6cff] flex items-center justify-center">
        <div className="bg-white w-[80%] max-w-[400px] rounded-2xl shadow-xl p-8 text-center">
          <h1 className="text-[30px] mb-6">Login As</h1>

          <div className="flex justify-between mb-6">
            {/* Teacher */}
            <div className="w-[48%] bg-[#0e6cff] p-4 relative group rounded-md overflow-hidden">
              <img src={teacher} className="w-full" alt="teacher" />
              <Link
                to={"/ProfessorLogin"}
                className="absolute inset-0 flex items-center justify-center text-black text-lg font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/40"
              >
                Teacher
              </Link>
            </div>

            {/* Admin */}
            <div className="w-[48%] bg-[#0e6cff] p-4 relative group rounded-md overflow-hidden">
              <img src={admin} className="w-full" alt="admin" />
              <Link
                to={"/AdminLogin"}
                className="absolute inset-0 flex items-center justify-center text-black text-lg font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/40"
              >
                Admin
              </Link>
            </div>
          </div>

          {/* Student Login Button */}
          <Link to={"/StudentLogin"}>
            <button className="bg-[#0e6cff] text-white font-semibold py-3 px-6 rounded-lg w-full transition hover:bg-blue-700">
              Login As Student
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default LoginAs;
