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
    <div className="flex min-h-screen w-full flex-col lg:flex-row">
      {/* Left Side - Logo */}
      <div className="flex w-full items-center justify-center bg-white px-6 py-8 lg:w-1/2 lg:py-0">
        <img src={img} alt="logo" className="w-48 max-w-[450px] sm:w-[45%] lg:w-[65%]" />
      </div>

      {/* Right Side - Form Section */}
      <div className="flex flex-1 items-center justify-center bg-[#152259] px-4 py-8 lg:w-1/2">
        <div className="w-full max-w-[400px] rounded-2xl bg-white p-5 text-center shadow-xl sm:p-8">
          <h1 className="mb-6 text-2xl sm:text-[30px]">Login As</h1>

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {/* Teacher */}
            <div className="group relative overflow-hidden rounded-md bg-[#152259] p-4">
              <img src={teacher} className="w-full" alt="teacher" />
              <Link
                to={"/ProfessorLogin"}
                className="absolute inset-0 flex items-center justify-center bg-white/40 text-lg font-semibold text-black opacity-0 transition-opacity duration-300 group-hover:opacity-100 focus:opacity-100"
              >
                Teacher
              </Link>
            </div>

            {/* Admin */}
            <div className="group relative overflow-hidden rounded-md bg-[#152259] p-4">
              <img src={admin} className="w-full" alt="admin" />
              <Link
                to={"/AdminLogin"}
                className="absolute inset-0 flex items-center justify-center bg-white/40 text-lg font-semibold text-black opacity-0 transition-opacity duration-300 group-hover:opacity-100 focus:opacity-100"
              >
                Admin
              </Link>
            </div>
          </div>

          {/* Student Login Button */}
          {/* <Link to={"/StudentLogin"}>
            <button className="bg-[#152259] text-white font-semibold py-3 px-6 rounded-lg w-full transition hover:bg-[#152240]">
              Login As Student
            </button>
          </Link> */}
        </div>
      </div>
    </div>
  );
}

export default LoginAs;
