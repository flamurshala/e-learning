import img from "../img/logo.png";
import daIcon from "../img/dashboardIcon.png";
import assignmentsIcon from "../img/🦆 icon _assignments_.png";
import announcementsIcon from "../img/🦆 icon _bullhorn_.png";
import { Link } from "react-router-dom";
import LogOut from "../Professor-Dashboard/ProfessorLogOut"; 

function ProffesorNav() {
  return (
    <div className="fixed flex flex-col justify-between p-5 items-start top-0 left-0 h-screen w-[20%] bg-[#0e6cff] z-50">
      <div className="flex flex-col items-start h-full">
        <div className="logo w-[65%] mb-[2rem]">
          <img src={img} alt="logo" className="w-full" />
        </div>
        <ul className="flex flex-col gap-4 w-full">
          <li className="flex items-center text-white font-bold gap-3 px-4">
            <img src={daIcon} alt="dashboard" />
            <Link to="/ProfessorDashboard">Dashboard</Link>
          </li>

          <li className="flex items-center text-white font-bold gap-3 px-4">
            <img src={assignmentsIcon} alt="calendar" />
            <Link to="/professor/calendar/:courseId">Courses</Link>
          </li>
          
          <li className="flex items-center text-white font-bold gap-3 px-4">
            <img src={announcementsIcon} alt="announcements" />
            <Link to="/ProfessorAnnouncements">Announcements</Link>
          </li>
            <li className="flex items-center text-white font-bold gap-3 px-4">
            <img src={daIcon} alt="CompletedCourse" />
           <Link to="/professor/completed-courses">Completed Courses</Link>

          </li>
        </ul>
      </div>
      <div className="px-4">
        <LogOut />
      </div>
    </div>
  );
}

export default ProffesorNav;
