import { useEffect, useState } from "react";
import ProffesorNav from "./ProffesorNav";
import { useNavigate } from "react-router-dom";

function ProfessorCompletedCourses() {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [openDropdown, setOpenDropdown] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Completed Courses - Tectigon Academy";

    fetch(`${process.env.REACT_APP_API_URL}/get_completed_courses.php`)
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        return res.json();
      })
      .then((data) => {
        if (!Array.isArray(data)) {
          console.error("Expected array from backend but got:", data);
          setCourses([]);
          return;
        }
        setCourses(data);
      })
      .catch((err) => {
        console.error("Failed to load completed courses:", err);
        setCourses([]);
      });
  }, []);

  useEffect(() => {
    let filtered = [...courses];

    if (searchTerm.trim() !== "") {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter((course) => {
        const title = course.title?.toLowerCase() || "";
        return title.includes(search);
      });
    }

    setFilteredCourses(filtered);
  }, [courses, searchTerm]);

  const toggleDropdown = (courseId) => {
    setOpenDropdown((prev) => (prev === courseId ? null : courseId));
  };

  return (
    <div className="flex gap-4">
      <ProffesorNav />
      <div className="mt-4 ml-[22%] w-[75%]">
        <h1 className="text-2xl font-semibold border-b-2 border-[#c2c2c2] w-[95%]">
          Completed Courses
        </h1>

        <div className="my-4">
          <input
            type="text"
            placeholder="Search by course title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border px-3 py-1 rounded w-full md:w-80"
          />
        </div>

        <table className="w-full border border-collapse border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Title</th>
              <th className="p-2 border">Description</th>
              <th className="p-2 border">Students</th>
              <th className="p-2 border">Attendance</th>
            </tr>
          </thead>
          <tbody>
            {filteredCourses.length > 0 ? (
              filteredCourses.map((course) => (
                <tr key={course.id} className="border-b border-gray-300">
                  <td className="p-2 border">{course.title}</td>
                  <td className="p-2 border">{course.description}</td>
                  <td className="p-2 border">
                    <button
                      className="bg-[#152259] text-white px-3 py-1 rounded hover:bg-[#152249]"
                      onClick={() => toggleDropdown(course.id)}
                    >
                      {openDropdown === course.id ? "Hide Students" : "View Students"}
                    </button>
                    {openDropdown === course.id && (
                      <ul className="mt-2 list-disc ml-4 text-sm text-gray-700">
                        {Array.isArray(course.students) && course.students.length > 0 ? (
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
                      className="bg-[#152259] text-white px-3 py-1 rounded hover:bg-[#152249]"
                      onClick={() => navigate(`/course-attendance/${course.id}`)}
                    >
                      View Attendance
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="text-center p-4 text-gray-500">
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

export default ProfessorCompletedCourses;
