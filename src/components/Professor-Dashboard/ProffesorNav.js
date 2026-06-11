import img from "../img/logo.png";
import daIcon from "../img/dashboardIcon.png";
import assignmentsIcon from "../img/\uD83E\uDD86 icon _assignments_.png";
import { Link } from "react-router-dom";
import { useState } from "react";
import { FaBars, FaTimes } from "react-icons/fa";
import LogOut from "../Professor-Dashboard/ProfessorLogOut";

function ProffesorNav() {
  const [isOpen, setIsOpen] = useState(false);
  const professorCourseId = localStorage.getItem("professorCourseId") || "0";
  const closeMenu = () => setIsOpen(false);

  return (
    <>
      <button
        type="button"
        className={`app-menu-button rounded p-3 shadow-lg ${
          isOpen ? "bg-white text-[#152259]" : "bg-[#152259] text-white"
        }`}
        onClick={() => setIsOpen((open) => !open)}
        aria-label={isOpen ? "Close menu" : "Open menu"}
      >
        {isOpen ? <FaTimes /> : <FaBars />}
      </button>

      {isOpen && (
        <button
          type="button"
          className="app-menu-overlay bg-black/40"
          onClick={closeMenu}
          aria-label="Close menu overlay"
        />
      )}

      <div
        className={`app-sidebar flex flex-col items-start justify-between overflow-y-auto bg-[#152259] p-5 ${
          isOpen ? "app-sidebar-open" : ""
        }`}
      >
      <div className="app-sidebar-content flex flex-col items-start">
        <div className="logo w-[65%] mb-[2rem]">
          <img src={img} alt="logo" className="w-full" />
        </div>
        <ul className="flex flex-col gap-4 w-full">
          {/* <li className="flex items-center text-white font-bold gap-3 px-4">
            <img src={daIcon} alt="dashboard" />
            <Link to="/ProfessorDashboard">Dashboard</Link>
          </li> */}

          <li className="flex items-center text-white font-bold gap-3 px-4">
            <img src={assignmentsIcon} alt="calendar" />
            <Link to={`/professor/calendar/${professorCourseId}`} onClick={closeMenu}>Courses</Link>
          </li>

          <li className="flex items-center text-white font-bold gap-3 px-4">
            <img src={daIcon} alt="CompletedCourse" />
            <Link to="/professor/completed-courses" onClick={closeMenu}>Completed Courses</Link>
          </li>
        </ul>
      </div>
      <div className="app-sidebar-footer px-4">
        <LogOut />
      </div>
      </div>
    </>
  );
}

export default ProffesorNav;
