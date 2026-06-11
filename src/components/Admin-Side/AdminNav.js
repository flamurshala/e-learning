import img from "../img/logo.png";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import LogOut from "./AdminLogOut";
import {
  FaBars,
  FaBell,
  FaBookOpen,
  FaCertificate,
  FaChalkboardTeacher,
  FaChartLine,
  FaFileInvoiceDollar,
  FaMoneyCheckAlt,
  FaUserPlus,
  FaTimes,
  FaUniversity,
  FaUserGraduate,
  FaUsersCog,
  FaUserTimes,
} from "react-icons/fa";

function AdminNav() {
  const [notificationCount, setNotificationCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const userRole = localStorage.getItem("userRole"); // Get the user's role
  const navItemClass = "mb-[1rem] text-white font-bold gap-3 flex items-center";
  const iconClass = "text-lg shrink-0";
  const closeMenu = () => setIsOpen(false);

  useEffect(() => {
    document.title = "Admin Dashboard - Tectigon Academy";

    fetch(`${process.env.REACT_APP_API_URL}/get_notification_count.php`)
      .then((res) => res.json())
      .then((data) => {
        if (data.count !== undefined) setNotificationCount(data.count);
      });
  }, []);

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
        className={`app-sidebar navBar flex flex-col justify-between overflow-y-auto bg-[#152259] p-5 ${
          isOpen ? "app-sidebar-open" : ""
        }`}
      >
      <div className="app-sidebar-content">
        <div className="container flex justify-center flex-col">
          <div className="logo w-[65%] mb-[2rem]">
            <img src={img} alt="logo w-[100%]" />
          </div>
          <ul>
            <li className={navItemClass}>
              <FaUserGraduate className={iconClass} />
              <Link to="/AllStudents" onClick={closeMenu}>Students</Link>
            </li>
            <li className={navItemClass}>
              <FaBookOpen className={iconClass} />
              <Link to="/AllCourses" onClick={closeMenu}>Courses</Link>
            </li>
            <li className={navItemClass}>
              <FaChalkboardTeacher className={iconClass} />
              <Link to="/AllProfessors" onClick={closeMenu}>Professors</Link>
            </li>
            <li className={navItemClass}>
              <FaCertificate className={iconClass} />
              <Link to="/AllCertificates" onClick={closeMenu}>Certificates</Link>
            </li>

            {/* Show only if user is superadmin */}
            {userRole === "superadmin" && (
              <li className={navItemClass}>
                <FaUsersCog className={iconClass} />
                <Link to="/AllAdmins" onClick={closeMenu}>Admins</Link>
              </li>
            )}

            <li className={navItemClass}>
              <FaFileInvoiceDollar className={iconClass} />
              <Link to={userRole === "superadmin" ? "/InvoiceList" : "/InvoiceForm"} onClick={closeMenu}>Invoices</Link>
            </li>
            <li className={navItemClass}>
              <FaMoneyCheckAlt className={iconClass} />
              <Link to={userRole === "superadmin" ? "/PaymentVerificationList" : "/PaymentVerificationForm"} onClick={closeMenu}>
                Payment Verifications
              </Link>
            </li>
            {userRole === "superadmin" && (
              <>
                <li className={navItemClass}>
                  <FaUniversity className={iconClass} />
                  <Link to="/CompanyFinance" onClick={closeMenu}>Company Finance</Link>
                </li>
                <li className={navItemClass}>
                  <FaChartLine className={iconClass} />
                  <Link to="/Reports" onClick={closeMenu}>Reports</Link>
                </li>
              </>
            )}

            <li className="mb-[1rem] text-white font-bold gap-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FaBell className={iconClass} />
                <Link to="/admin/notifications" onClick={closeMenu}>Notifications</Link>
              </div>
              {notificationCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full ml-2">
                  {notificationCount}
                </span>
              )}
            </li>

            <li className={navItemClass}>
              <FaCertificate className={iconClass} />
              <Link to="/CompletedCourse" onClick={closeMenu}>Completed Courses</Link>
            </li>

            {userRole === "superadmin" && (
              <>
                <li className={navItemClass}>
                  <FaUserPlus className={iconClass} />
                  <Link to="/TemporaryAddStudent" onClick={closeMenu}>Temporary Add Student</Link>
                </li>
                <li className={navItemClass}>
                  <FaUserTimes className={iconClass} />
                  <Link to="/TemporaryCanceledStudent" onClick={closeMenu}>Temporary Canceled Student</Link>
                </li>
              </>
            )}
          
          </ul>
        </div>
      </div>
      <div className="app-sidebar-footer text-white text-left">
        <LogOut />
      </div>
      </div>
    </>
  );
}

export default AdminNav;
