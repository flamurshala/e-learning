import img from "../img/logo.png";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import LogOut from "./AdminLogOut";

function AdminNav() {
  const [notificationCount, setNotificationCount] = useState(0);
  const userRole = localStorage.getItem("userRole"); // Get the user's role

  useEffect(() => {
    document.title = "Admin Dashboard - Tectigon Academy";

    fetch(`${process.env.REACT_APP_API_URL}/get_notification_count.php`)
      .then((res) => res.json())
      .then((data) => {
        if (data.count !== undefined) setNotificationCount(data.count);
      });
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

            {/* Show only if user is superadmin */}
            {userRole === "superadmin" && (
              <li className="mb-[1rem] text-white font-bold gap-3">
                <Link to="/AddAdmin">Add Admin</Link>
              </li>
            )}
            {/* Show only if user is superadmin */}
            {userRole === "superadmin" && (
              <li className="mb-[1rem] text-white font-bold gap-3">
                <Link to="/AllAdmins">All Admins</Link>
              </li>
            )}

            <li className="mb-[1rem] text-white font-bold gap-3">
              <Link to="/AllStudents">All Students</Link>
            </li>
            <li className="mb-[1rem] text-white font-bold gap-3">
              <Link to="/AllProfessors">All Professors</Link>
            </li>
            <li className="mb-[1rem] text-white font-bold gap-3">
              <Link to="/AllCourses">All Courses</Link>
            </li>

            <li className="mb-[1rem] text-white font-bold gap-3 flex items-center justify-between">
              <Link to="/admin/notifications">Notifications</Link>
              {notificationCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full ml-2">
                  {notificationCount}
                </span>
              )}
            </li>

            <li className="mb-[1rem] text-white font-bold gap-3">
              <Link to="/CompletedCourse">Completed Courses</Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="text-white text-left">
        <LogOut />
      </div>
    </div>
  );
}

export default AdminNav;
