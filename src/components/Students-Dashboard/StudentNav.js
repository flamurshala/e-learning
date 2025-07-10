import { Link } from "react-router-dom";
import img from "../img/logo.png";
import daIcon from "../img/dashboardIcon.png";
import discussionIcon from "../img/🦆 icon _comment discussion_.png";
import announcementsIcon from "../img/🦆 icon _bullhorn_.png";
import progressIcon from "../img/🦆 icon _Tasks_.png";
import accountIcon from "../img/🦆 icon _User Circle_.png";

export default function StudentNav() {
  return (
    <nav className="fixed top-0 left-0 h-screen w-[18%] bg-[#0e6cff] p-6 flex flex-col justify-between text-white">
      <div>
        <div className="mb-8">
          <img src={img} alt="Logo" className="w-full object-contain" />
        </div>
        <ul>
          <li className="flex mb-[1rem] text-white font-bold gap-3">
            <img src={daIcon} alt="logo w-[100%]" />
            <Link to="/StudentDashboard">Dashboard</Link>
          </li>
          <li className="flex mb-[1rem] text-white font-bold gap-3">
            <img src={discussionIcon} alt="logo w-[100%]" />
            <Link to="/DiscussionForum">Discussion Forum</Link>
          </li>
          <li className="flex mb-[1rem] text-white font-bold gap-3">
            <img src={announcementsIcon} alt="logo w-[100%]" />
            <Link to="/StudentAnnouncements">Announcements</Link>
          </li>
          <li className="flex mb-[1rem] text-white font-bold gap-3">
            <img src={progressIcon} alt="logo w-[100%]" />
            <Link to="/ProgressTracking">Progress Tracking </Link>
          </li>
        </ul>
      </div>
      <div className="flex flex-col items-start">
        <div className="flex items-center font-bold gap-3 cursor-pointer hover:text-gray-200">
          <img src={accountIcon} alt="Account" className="w-6" />
          <Link to="/Account">Account</Link>
        </div>
      </div>
    </nav>
  );
}

