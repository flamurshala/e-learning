import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminNav from "./AdminNav";

function AllCourses() {
  useEffect(() => {
    document.title = "All Courses - Tectigon Academy";
  }, []);

  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [selectedProfessor, setSelectedProfessor] = useState("All");
  const [openDropdown, setOpenDropdown] = useState(null);
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    fetch(
      "http://localhost/e-learning/backend/get_courses_with_details_for_all_courses.php"
    )
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((data) => {
        setCourses(data);
        setFilteredCourses(data);

        const uniqueProfessors = Array.from(
          new Set(data.map((course) => course.professor_name || "Unassigned"))
        );
        setProfessors(["All", ...uniqueProfessors]);
        setLoading(false);
        setError(null);
      })
      .catch((err) => {
        console.error("Failed to load courses:", err);
        setError("Failed to load courses.");
        setLoading(false);
      });
  }, []);

  const toggleDropdown = (courseId) => {
    setOpenDropdown((prev) => (prev === courseId ? null : courseId));
  };

  const handleFilterChange = (e) => {
    const value = e.target.value;
    setSelectedProfessor(value);

    if (value === "All") {
      setFilteredCourses(courses);
    } else {
      setFilteredCourses(
        courses.filter(
          (course) => (course.professor_name || "Unassigned") === value
        )
      );
    }
    setSelectedCourseId(null);
  };

  const handleDelete = (id) => {
    if (!window.confirm("Are you sure you want to delete this course?")) return;

    fetch("http://localhost/e-learning/backend/delete_course.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const updatedCourses = courses.filter((c) => c.id !== id);
          setCourses(updatedCourses);

          // Re-apply filter on updated courses
          if (selectedProfessor === "All") {
            setFilteredCourses(updatedCourses);
          } else {
            setFilteredCourses(
              updatedCourses.filter(
                (course) =>
                  (course.professor_name || "Unassigned") === selectedProfessor
              )
            );
          }

          if (selectedCourseId === id) {
            setSelectedCourseId(null);
          }
        } else {
          alert("Delete failed: " + (data.error || "Unknown error"));
        }
      })
      .catch((err) => alert("Error deleting course: " + err.message));
  };

  if (loading) return <p className="p-4 text-center">Loading courses...</p>;
  if (error) return <p className="p-4 text-center text-red-600">{error}</p>;

  return (
    <div className="flex gap-4">
      <AdminNav />
      <div className="mt-4 ml-[22%] w-[75%]">
        <h1 className="text-2xl font-semibold border-b-2 border-[#c2c2c2] w-[95%]">
          All Courses
        </h1>

        <div className="my-4">
          <label className="mr-2 font-medium">Filter by Professor:</label>
          <select
            value={selectedProfessor}
            onChange={handleFilterChange}
            className="border px-3 py-1 rounded"
          >
            {professors.map((prof, index) => (
              <option key={index} value={prof}>
                {prof}
              </option>
            ))}
          </select>
        </div>

        <table className="w-full border border-collapse border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Title</th>
              <th className="p-2 border">Description</th>
              <th className="p-2 border">Professor</th>
              <th className="p-2 border">Students</th>
              <th className="p-2 border">Attendance</th>
              <th className="p-2 border">Delete</th>
              <th className="p-2 border">Edit</th>
            </tr>
          </thead>
          <tbody>
            {filteredCourses.length > 0 ? (
              filteredCourses.map((course) => (
                <tr key={course.id} className="border-b border-gray-300">
                  <td className="p-2 border">{course.title}</td>
                  <td className="p-2 border">{course.description}</td>
                  <td className="p-2 border">
                    {course.professor_name || "Unassigned"}
                  </td>
                  <td className="p-2 border">
                    <button
                      className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                      onClick={() => toggleDropdown(course.id)}
                    >
                      {openDropdown === course.id
                        ? "Hide Students"
                        : "View Students"}
                    </button>
                    {openDropdown === course.id && (
                      <ul className="mt-2 list-disc ml-4 text-sm text-gray-700">
                        {Array.isArray(course.students) &&
                        course.students.length > 0 ? (
                          course.students.map((name, idx) => (
                            <li key={idx}>{name}</li>
                          ))
                        ) : (
                          <li>No students enrolled</li>
                        )}
                      </ul>
                    )}
                  </td>
                  <td className="p-2 border text-center">
                    <button
                      className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-800"
                      onClick={() =>
                        navigate(`/course-attendance/${course.id}`)
                      }
                    >
                      View Attendance
                    </button>
                  </td>
                  <td className="p-2">
                    <button
                      onClick={() => handleDelete(course.id)}
                      className="bg-red-600 hover:bg-red-800 text-white px-3 py-1 rounded"
                    >
                      Delete
                    </button>
                  </td>
                  <td className="p-2">
                    <button
                      onClick={() =>
                        (window.location.href = `/edit-course/${course.id}`)
                      }
                      className="bg-[#152259] hover:bg-[#152239] text-white px-3 py-1 rounded"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="text-center p-4 text-gray-500">
                  No courses found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AllCourses;
