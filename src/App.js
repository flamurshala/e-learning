import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Loader from "./components/Loader";
import LoginAs from "./components/LoginAs";
import ProfessorLogin from "./components/Professor-Dashboard/ProfessorLogin";
import ProfessorCompletedCourses from "./components/Professor-Dashboard/ProfessorCompletedCourses";


import StudentLogin from "./components/Students-Dashboard/StudentLogin";
import StudentDashboard from "./components/Students-Dashboard/StudentDashboard";
import StudentNav from "./components/Students-Dashboard/StudentNav";
import ProfessorDashboard from "./components/Professor-Dashboard/ProfessorDashboard";
import AdminLogin from "./components/Admin-Side/AdminLogin";
import CreateCourse from "./components/Admin-Side/CreateCourse";
import AddUsers from "./components/Admin-Side/AddUsers";
import AddProf from "./components/Admin-Side/AddProf";
import AllStudents from "./components/Admin-Side/AllStudents";
import EditStudent from "./components/Admin-Side/EditStudent";
import AllProfessors from "./components/Admin-Side/AllProfessors";
import EditProfessor from "./components/Admin-Side/EditProfessor";
import AllCourses from "./components/Admin-Side/AllCourses";
import EditCourse from "./components/Admin-Side/EditCourse";
import Announcements from "./components/Admin-Side/announcements";
import ProfessorAnnouncements from "./components/Professor-Dashboard/ProfessorAnnouncement";
import StudentAnnouncements from "./components/Students-Dashboard/StudentAnnouncement";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import ProgressTracking from "./components/Students-Dashboard/ProgressTracking";
import Account from "./components/Students-Dashboard/Account";
import ProfessorCalendar from "./components/Professor-Dashboard/ProfessorCalendar";
import ProfessorAttendancePage from "./components/Professor-Dashboard/ProfessorAttendancePage";
import DiscussionForum from "./components/Students-Dashboard/DiscussionForum";
import ProtectedRoute from "./components/ProtectedRoute";
import CourseAttendance from "./components/Admin-Side/CourseAttendance";
import AdminNotifications from "./components/Admin-Side/AdminNotifications";
import StudentProgress from "./components/Admin-Side/StudentProgess";
import CompletedCourses from "./components/Admin-Side/CompletedCourses";
import AdminRegister from "./components/Admin-Side/AdminRegister";

function App() {
  return (
    <div className="App ">
      <Router>
        <ToastContainer />
        <Routes>
          <Route path="/" element={<Loader />} />
          <Route path="LoginAs" element={<LoginAs />} />
          <Route path="/ProfessorLogin" element={<ProfessorLogin />} />
          <Route path="/StudentLogin" element={<StudentLogin />} />
          <Route path="/AdminRegister" element={<AdminRegister />} />
          <Route
            path="/StudentDashboard"
            element={
              <ProtectedRoute userType="studentId">
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/StudentNav" element={<StudentNav />} />
          <Route
            path="/ProfessorDashboard"
            element={
              <ProtectedRoute userType="professorId">
                <ProfessorDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/AdminLogin" element={<AdminLogin />} />
          <Route
            path="/CreateCourse"
            element={
              <ProtectedRoute userType="user">
                <CreateCourse />
              </ProtectedRoute>
            }
          />
          <Route
            path="/AddUsers"
            element={
              <ProtectedRoute userType="user">
                <AddUsers />
              </ProtectedRoute>
            }
          />
          <Route
  path="/AddProf"
  element={
    <ProtectedRoute userType="user">
      <AddProf />
    </ProtectedRoute>
  }
/>

          <Route
            path="/AllStudents"
            element={
              <ProtectedRoute userType="user">
                <AllStudents />
              </ProtectedRoute>
            }
          />
          <Route path="/edit-student/:id" element={<EditStudent />} />
          <Route
            path="/AllProfessors"
            element={
              <ProtectedRoute userType="user">
                <AllProfessors />
              </ProtectedRoute>
            }
          />
          <Route path="/edit-professor/:id" element={<EditProfessor />} />
          <Route
            path="/AllCourses"
            element={
              <ProtectedRoute userType="user">
                <AllCourses />
              </ProtectedRoute>
            }
          />
          <Route path="/edit-course/:id" element={<EditCourse />} />
          <Route
            path="/Announcements"
            element={
              <ProtectedRoute userType="user">
                <Announcements />
              </ProtectedRoute>
            }
          />
          <Route
            path="ProgressTracking"
            element={
              <ProtectedRoute userType="studentId">
                <ProgressTracking />
              </ProtectedRoute>
            }
          />
          <Route
            path="DiscussionForum"
            element={
              <ProtectedRoute userType="studentId">
                <DiscussionForum />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ProfessorAnnouncements"
            element={
              <ProtectedRoute userType="professorId">
                <ProfessorAnnouncements />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/StudentAnnouncements"
            element={
              <ProtectedRoute userType="studentId">
                <StudentAnnouncements />
              </ProtectedRoute>
            }
          />

          <Route
            path="Account"
            element={
              <ProtectedRoute userType="studentId">
                <Account />
              </ProtectedRoute>
            }
          />
          <Route
            path="/professor/calendar/:courseId"
            element={
              <ProtectedRoute userType="professorId">
                <ProfessorCalendar />
              </ProtectedRoute>
            }
          />
          <Route
  path="/professor/completed-courses"
  element={
    <ProtectedRoute userType="professorId">
      <ProfessorCompletedCourses />
    </ProtectedRoute>
  }
/>

          <Route
            path="/professor/attendance"
            element={
              <ProtectedRoute userType="professorId">
                <ProfessorAttendancePage />
              </ProtectedRoute>
            }
          />
          <Route
  path="/course-attendance/:courseId"
  element={
    <ProtectedRoute userType={["user", "professorId"]}>
      <CourseAttendance />
    </ProtectedRoute>
  }
/>

          <Route path="/admin/notifications" element={<AdminNotifications />} />
          <Route
            path="/student-progress/:studentId"
            element={
              <ProtectedRoute userType="user">
                <StudentProgress />
              </ProtectedRoute>
            }
          />
          <Route
            path="/CompletedCourse"
            element={
              <ProtectedRoute userType="user">
                <CompletedCourses />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
