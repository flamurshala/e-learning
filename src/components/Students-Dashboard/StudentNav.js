import { Link } from "react-router-dom";
import { useState } from "react";
import { FaBars, FaTimes } from "react-icons/fa";
import img from "../img/logo.png";
import daIcon from "../img/dashboardIcon.png";
import discussionIcon from "../img/🦆 icon _comment discussion_.png";
import announcementsIcon from "../img/🦆 icon _bullhorn_.png";
import progressIcon from "../img/🦆 icon _Tasks_.png";
import accountIcon from "../img/🦆 icon _User Circle_.png";

export default function StudentNav() {
  const [isOpen, setIsOpen] = useState(false);
  const closeMenu = () => setIsOpen(false);

  return (
    <>
      <button
        type="button"
        className={`app-menu-button rounded p-3 shadow-lg ${
          isOpen ? "bg-white text-[#0e6cff]" : "bg-[#0e6cff] text-white"
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

      <nav
        className={`app-sidebar flex flex-col justify-between overflow-y-auto bg-[#0e6cff] p-6 text-white ${
          isOpen ? "app-sidebar-open" : ""
        }`}
      >
      <div className="app-sidebar-content">
        <div className="mb-8">
          <img src={img} alt="Logo" className="w-full object-contain" />
        </div>
        <ul>
          <li className="flex mb-[1rem] text-white font-bold gap-3">
            <img src={daIcon} alt="logo w-[100%]" />
            <Link to="/StudentDashboard" onClick={closeMenu}>Dashboard</Link>
          </li>
          <li className="flex mb-[1rem] text-white font-bold gap-3">
            <img src={discussionIcon} alt="logo w-[100%]" />
            <Link to="/DiscussionForum" onClick={closeMenu}>Discussion Forum</Link>
          </li>
          <li className="flex mb-[1rem] text-white font-bold gap-3">
            <img src={announcementsIcon} alt="logo w-[100%]" />
            <Link to="/StudentAnnouncements" onClick={closeMenu}>Announcements</Link>
          </li>
          <li className="flex mb-[1rem] text-white font-bold gap-3">
            <img src={progressIcon} alt="logo w-[100%]" />
            <Link to="/ProgressTracking" onClick={closeMenu}>Progress Tracking </Link>
          </li>
        </ul>
      </div>
      <div className="app-sidebar-footer flex flex-col items-start">
        <div className="flex items-center font-bold gap-3 cursor-pointer hover:text-gray-200">
          <img src={accountIcon} alt="Account" className="w-6" />
          <Link to="/Account" onClick={closeMenu}>Account</Link>
        </div>
      </div>
      </nav>
    </>
  );
}
