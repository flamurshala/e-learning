import { useEffect, useState } from "react";
import StudentNav from "./StudentNav";
import Footer from "../Footer";
import FirstClass from "../img/Firstclass.png";

function StudentDashboard() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAssignments, setShowAssignments] = useState({});
  const [assignments, setAssignments] = useState({});

  useEffect(() => {
    const studentId = localStorage.getItem("studentId");
    if (!studentId) {
      setError("Student not logged in.");
      setLoading(false);
      return;
    }

    fetch(
      `http://localhost/backend/get_student_courses.php?student_id=${studentId}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          setCourses([]);
        } else {
          setCourses(data);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load courses.");
        setLoading(false);
      });
  }, []);

  const toggleAssignments = async (courseId) => {
    setShowAssignments((prev) => ({
      ...prev,
      [courseId]: !prev[courseId],
    }));

    if (!assignments[courseId]) {
      try {
        const res = await fetch(
          `http://localhost/backend/get_student_assignments.php?course_id=${courseId}`
        );
        const data = await res.json();
        if (Array.isArray(data)) {
          setAssignments((prev) => ({
            ...prev,
            [courseId]: data,
          }));
        } else {
          console.error("Invalid assignment response", data);
        }
      } catch (err) {
        console.error("Error fetching assignments", err);
      }
    }
  };

  if (loading) return <p className="p-10">Loading courses...</p>;
  if (error)
    return (
      <div className="min-h-screen bg-gray-100">
        <StudentNav />
        <div className="ml-64 p-10">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-100">
      <StudentNav />

      <div className="ml-[18%] p-8">
        <div className="w-full">
          <h1 className="text-4xl font-medium border-b border-black ">
            Student Dashboard
          </h1>

          <div className="p-[15px] flex flex-wrap gap-2">
            {courses.map((course) => (
              <div className="">
                <div key={course.id} className="flex flex-wrap gap-4">
                  <div className="w-[320px] h-[180px] rounded-tr-2xl rounded-tl-2xl overflow-hidden relative">
                    <img
                      src={FirstClass}
                      alt="Course"
                      className="absolute inset-0 w-full h-full opacity-80"
                    />
                    <div className="relative z-10 p-4 h-full flex flex-col justify-end">
                      <h2 className="text-lg font-bold text-white">
                        {course.title}
                      </h2>
                      <p className="text-white">{course.description}</p>
                      <h3 className="text-white font-semibold">
                        {course.professor_name}
                      </h3>
                      <button
                        onClick={() => toggleAssignments(course.id)}
                        className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-semibold shadow hover:bg-blue-700"
                      >
                        {showAssignments[course.id]
                          ? "Hide"
                          : "View Assignments"}
                      </button>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent rounded-2xl"></div>
                  </div>
                </div>

                {showAssignments[course.id] && assignments[course.id] && (
                  <div className="bg-white w-[320px] p-4 rounded-br-2xl rounded-bl-2xl shadow ">
                    <h3 className="text-lg font-semibold mb-2">Assignments</h3>

                    {assignments[course.id].length > 0 ? (
                      assignments[course.id].map((assignment) => (
                        <div key={assignment.id} className="mb-2">
                          <h4 className="font-semibold">{assignment.title}</h4>
                          <p className="">{assignment.description}</p>
                          <p className="text-sm text-gray-500">
                            Due: {assignment.due_date}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500">
                        No assignments found.
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-[30%]">
          <Footer />
        </div>
      </div>
    </div>
  );
}

export default StudentDashboard;
