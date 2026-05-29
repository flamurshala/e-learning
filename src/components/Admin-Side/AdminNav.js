import img from "../img/logo.png";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import LogOut from "./AdminLogOut";
import {
  FaBell,
  FaBookOpen,
  FaCertificate,
  FaChalkboardTeacher,
  FaChartLine,
  FaFileInvoiceDollar,
  FaMoneyCheckAlt,
  FaUniversity,
  FaUserGraduate,
  FaUsersCog,
} from "react-icons/fa";

function AdminNav() {
  const [notificationCount, setNotificationCount] = useState(0);
  const userRole = localStorage.getItem("userRole"); // Get the user's role
  const navItemClass = "mb-[1rem] text-white font-bold gap-3 flex items-center";
  const iconClass = "text-lg shrink-0";

  useEffect(() => {
    document.title = "Admin Dashboard - Tectigon Academy";

    fetch(`${process.env.REACT_APP_API_URL}/get_notification_count.php`)
      .then((res) => res.json())
      .then((data) => {
        if (data.count !== undefined) setNotificationCount(data.count);
      });
  }, []);

  return (
    <div className="navBar fixed top-0 left-0 w-[17%] h-screen bg-[#152259] p-5 flex flex-col justify-between z-50">
      <div className="">
        <div className="container flex justify-center flex-col">
          <div className="logo w-[65%] mb-[2rem]">
            <img src={img} alt="logo w-[100%]" />
          </div>
          <ul>
            <li className={navItemClass}>
              <FaUserGraduate className={iconClass} />
              <Link to="/AllStudents">Students</Link>
            </li>
            <li className={navItemClass}>
              <FaBookOpen className={iconClass} />
              <Link to="/AllCourses">Courses</Link>
            </li>
            <li className={navItemClass}>
              <FaChalkboardTeacher className={iconClass} />
              <Link to="/AllProfessors">Professors</Link>
            </li>
            <li className={navItemClass}>
              <FaCertificate className={iconClass} />
              <Link to="/AllCertificates">Certificates</Link>
            </li>

            {/* Show only if user is superadmin */}
            {userRole === "superadmin" && (
              <li className={navItemClass}>
                <FaUsersCog className={iconClass} />
                <Link to="/AllAdmins">Admins</Link>
              </li>
            )}

            <li className={navItemClass}>
              <FaFileInvoiceDollar className={iconClass} />
              <Link to={userRole === "superadmin" ? "/InvoiceList" : "/InvoiceForm"}>Invoices</Link>
            </li>
            <li className={navItemClass}>
              <FaMoneyCheckAlt className={iconClass} />
              <Link to={userRole === "superadmin" ? "/PaymentVerificationList" : "/PaymentVerificationForm"}>
                Payment Verifications
              </Link>
            </li>
            {userRole === "superadmin" && (
              <>
                <li className={navItemClass}>
                  <FaUniversity className={iconClass} />
                  <Link to="/CompanyFinance">Company Finance</Link>
                </li>
                <li className={navItemClass}>
                  <FaChartLine className={iconClass} />
                  <Link to="/Reports">Reports</Link>
                </li>
              </>
            )}

            <li className="mb-[1rem] text-white font-bold gap-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FaBell className={iconClass} />
                <Link to="/admin/notifications">Notifications</Link>
              </div>
              {notificationCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full ml-2">
                  {notificationCount}
                </span>
              )}
            </li>

            <li className={navItemClass}>
              <FaCertificate className={iconClass} />
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
