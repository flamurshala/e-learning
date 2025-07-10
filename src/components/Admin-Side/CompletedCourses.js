import { useEffect, useState } from "react";
import AdminNav from "./AdminNav";

function CompletedCourses() {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [professors, setProfessors] = useState(["All"]);
  const [selectedProfessor, setSelectedProfessor] = useState("All");
  const [openDropdown, setOpenDropdown] = useState(null);

  useEffect(() => {
    document.title = "Completed Courses - Tectigon Academy";

    fetch("http://localhost/e-learning/backend/get_completed_courses.php")
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((data) => {
        console.log("Completed courses fetched:", data); // Add this!
        if (!Array.isArray(data)) {
          console.error("Expected array from backend but got:", data);
          setCourses([]);
          setFilteredCourses([]);
          setProfessors(["All"]);
          return;
        }
        setCourses(data);
        setFilteredCourses(data);

        const uniqueProfessors = Array.from(
          new Set(
            data.map((course) =>
              course.professor_name && course.professor_name.trim() !== ""
                ? course.professor_name
                : "Unassigned"
            )
          )
        );

        setProfessors(["All", ...uniqueProfessors]);
      })
      .catch((err) => {
        console.error("Failed to load completed courses:", err);
        setCourses([]);
        setFilteredCourses([]);
        setProfessors(["All"]);
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
          (course) =>
            (course.professor_name && course.professor_name.trim() !== ""
              ? course.professor_name
              : "Unassigned") === value
        )
      );
    }
  };

  return (
    <div className="flex gap-4">
      <AdminNav />
      <div className="mt-4 ml-[22%] w-[75%]">
        <h1 className="text-2xl font-semibold border-b-2 border-[#c2c2c2] w-[95%]">
          Completed Courses
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
            </tr>
          </thead>
          <tbody>
            {Array.isArray(filteredCourses) && filteredCourses.length > 0 ? (
              filteredCourses.map((course) => (
                <tr key={course.id} className="border-b border-gray-300">
                  <td className="p-2 border">{course.title}</td>
                  <td className="p-2 border">{course.description}</td>
                  <td className="p-2 border">
                    {course.professor_name &&
                    course.professor_name.trim() !== ""
                      ? course.professor_name
                      : "Unassigned"}
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
                        (window.location.href = `/course-attendance/${course.id}`)
                      }
                    >
                      View Attendance
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center p-4 text-gray-500">
                  No completed courses found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default CompletedCourses;
