import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

function StudentProgress() {
  const { studentId } = useParams();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetch(
      `${process.env.REACT_APP_API_URL}/get_student_progress_for_admin.php?student_id=${studentId}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          data.courses = Array.isArray(data.courses) ? data.courses : [];
          setStudent(data);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching student progress:", err);
        setError("Something went wrong.");
        setLoading(false);
      });
  }, [studentId]);

  if (loading)
    return (
      <div className="p-8 text-center text-gray-600 text-lg">
        Loading progress...
      </div>
    );

  if (error)
    return (
      <div className="p-8 text-center text-red-600 font-semibold">{error}</div>
    );

  if (!student)
    return (
      <div className="p-8 text-center text-gray-700">Student not found.</div>
    );

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white rounded-lg shadow-md">
      <Link to="/admin-dashboard">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-2 bg-gray-800 hover:bg-gray-900 text-white font-semibold px-5 py-2 rounded-md transition-colors duration-300"
        >
          Back to Dashboard
        </button>
      </Link>

      <h1 className="text-4xl font-extrabold mb-8 text-gray-900">
        Progress for <span className="text-indigo-600">{student.name}</span>
      </h1>

      {!student.courses || student.courses.length === 0 ? (
        <p className="text-center text-gray-500 text-lg">
          No courses found for this student.
        </p>
      ) : (
        <div className="space-y-6">
          {student.courses.map((course) => (
            <div
              key={course.course_id}
              className="border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-lg transition-shadow duration-300"
            >
              <h2 className="text-2xl font-semibold mb-3 text-gray-800">
                {course.title}
              </h2>

              <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
                <div
                  className="bg-indigo-600 h-6 flex items-center justify-center text-white font-medium text-sm select-none transition-all duration-500"
                  style={{ width: `${course.progress_percent || 0}%` }}
                >
                  {course.progress_percent || 0}%
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default StudentProgress;
