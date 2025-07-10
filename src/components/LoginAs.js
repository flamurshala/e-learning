import img from "./img/logo.png";
import teacher from "./img/Teacher.png";
import admin from "./img/Admin Name.png";
import { Link } from "react-router-dom";
import { useEffect } from "react";

function LoginAs() {
  useEffect(() => {
    document.title = "Login As - Tectigon Academy";
  }, []);

  return (
    <div className="mainPart bg-[#0e6cff] h-screen w-screen">
      <div className="logo w-[20%] flex justify-center m-auto">
        <img src={img} className="logo mt-[20%]" alt="logo" />
      </div>

      <div className="LoginAs w-[30%] bg-white m-auto mt-[5%] items-center rounded-2xl shadow-xl h-[53%] p-[5px] text-center">
        <h1 className="text-center text-[30px] mt-[20px]">Login As</h1>

        <div className="row w-[90%] flex justify-between m-auto mt-[5%] p-[5px]">
          <div className="col w-[43%] bg-[#0e6cff] p-8 relative group rounded-md overflow-hidden">
            <img src={teacher} className="w-[100%]" alt="teacher" />
            <Link
              to={"/ProfessorLogin"}
              className="absolute inset-0 flex items-center justify-center text-black text-lg font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/40"
            >
              Teacher
            </Link>
          </div>

          <div className="ol w-[43%] bg-[#0e6cff] p-8 relative group rounded-md overflow-hidden">
            <img src={admin} className="w-[100%]" alt="admin" />
            <Link
              to={"/AdminLogin"}
              className="absolute inset-0 flex items-center justify-center text-black text-lg font-semibold opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white/40"
            >
              Admin
            </Link>
          </div>
        </div>
        <button className="bg-[#0e6cff] text-white font-semibold py-3 px-6 rounded-lg mt-5 w-[90%] transition hover:bg-blue-700">
          <Link to={"/StudentLogin"}>Login As Student</Link>
        </button>
      </div>
    </div>
  );
}

export default LoginAs;
