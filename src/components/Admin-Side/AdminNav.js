import img from "../img/logo.png";
import { Link } from "react-router-dom";
import { useEffect } from "react";
import LogOut from "./AdminLogOut";

function AdminNav() {
  useEffect(() => {
    document.title = "Admin Dashboard - Tectigon Academy";
  }, []);

  return (
    <div className="navBar fixed top-0 left-0 w-[20%] h-screen bg-[#152259] p-5 flex flex-col justify-between z-50">
      <div className="">
        <div className="container flex justify-center flex-col">
          <div className="logo w-[65%] mb-[2rem]">
            <img src={img} alt="logo w-[100%]" />
          </div>
          <ul>
            <li className="mb-[1rem] text-white font-bold gap-3">
              <Link to="/CreateCourse">Create Course</Link>
            </li>
            <li className="mb-[1rem] text-white font-bold gap-3">
              <Link to="/AddUsers">Add Student</Link>
            </li>
             <li className="mb-[1rem] text-white font-bold gap-3">
              <Link to="/AddProf">Add Teachers</Link>
            </li>
            <li className="mb-[1rem] text-white font-bold gap-3">
              <Link to="/AllStudents">All Students</Link>
            </li>
            <li className="mb-[1rem] text-white font-bold gap-3">
              <Link to="/AllProfessors">All Professors</Link>
            </li>
            <li className="mb-[1rem] text-white font-bold gap-3">
              <Link to="/AllCourses">All Courses</Link>
            </li>
           
            <li className="mb-[1rem] text-white font-bold gap-3">
              <Link
                to="/admin/notifications"
              >
                Notifications
              </Link>
            </li>
            <li className="mb-[1rem] text-white font-bold gap-3">
              <Link
                to="/CompletedCourse"
              >
                Completed Courses
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div>
        <LogOut />
      </div>
    </div>
  );
}

export default AdminNav;
