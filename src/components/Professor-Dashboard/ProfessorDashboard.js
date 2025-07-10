import ProffesorNav from "./ProffesorNav";
import { useEffect, useState } from "react";
import FirstClass from "../img/Firstclass.png";
import Footer from "../Footer";

function ProfessorDashboard() {
  useEffect(() => {
    document.title = "Professor Dashboard - Tectigon Academy";
  }, []);

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState({});
  const [assignmentData, setAssignmentData] = useState({});

  useEffect(() => {
    const professorId = localStorage.getItem("professorId");
    if (!professorId) {
      console.warn("No professor ID found in localStorage");
      setError("Professor not logged in.");
      setLoading(false);
      return;
    }

    fetch(
      `http://localhost/backend/get_professor_courses.php?professor_id=${professorId}`
    )
      .then((res) => res.json())
      .then((data) => {
        console.log("Fetched courses:", data);
        if (data.error) {
          setError(data.error);
          setCourses([]);
        } else {
          setCourses(data);
          setError(null);
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load courses");
        setLoading(false);
      });
  }, []);

  const toggleForm = (courseId) => {
    setShowForm((prev) => ({ ...prev, [courseId]: !prev[courseId] }));
  };

  const handleInputChange = (courseId, field, value) => {
    setAssignmentData((prev) => ({
      ...prev,
      [courseId]: {
        ...prev[courseId],
        [field]: value,
      },
    }));
  };

  const handleAssignmentSubmit = async (e, courseId) => {
    e.preventDefault();
    const professorId = localStorage.getItem("professorId");
    const assignment = assignmentData[courseId];

    try {
      const response = await fetch(
        "http://localhost/backend/create_assignments.php",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            course_id: courseId,
            professor_id: professorId,
            title: assignment?.title,
            description: assignment?.description,
            due_date: assignment?.due_date,
          }),
        }
      );
      const data = await response.json();

      console.log("Assignment creation response:", data);

      if (data.success) {
        alert("Assignment created successfully!");
        setAssignmentData((prev) => ({ ...prev, [courseId]: {} }));
        setShowForm((prev) => ({ ...prev, [courseId]: false }));
      } else {
        alert("Error creating assignment: " + (data.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Assignment creation failed:", err);
      alert("Failed to create assignment, check the console");
    }
  };

  if (loading) return <p>Loading courses...</p>;
  if (error)
    return (
      <div className="flex">
        <ProffesorNav />
        <p className="text-red-600">Error: {error}</p>
      </div>
    );

  if (courses.length === 0)
    return (
      <div className="flex">
        <ProffesorNav />
        <p>No courses found.</p>
      </div>
    );

  return (
    <div>
      <div className="flex gap-4 min-h-screen bg-gray-100">
        <ProffesorNav />
        <div className="flex flex-col w-[75%] ml-[21%]">
          <div className="col relative w-[100%]">
            <h1 className="text-4xl font-medium border-b border-black mb-8">
              Professor Dashboard
            </h1>

            <div className="mainPart p-[15px] w-[100%] flex flex-wrap gap-4">
              {courses.map((course) => (
                <div key={course.id} className="w-full">
                  <div className="flex gap-[10px]">
                    <div className="w-[320px] h-[180px] rounded-2xl shadow-xl bg-white relative overflow-hidden flex items-end mb-4 group transition-transform duration-300 hover:-translate-y-2 cursor-pointer">
                      <img
                        src={FirstClass}
                        alt="Class"
                        className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="relative z-10 p-5 w-full">
                        <div className="flex items-center justify-between mb-2"></div>
                        <h2 className="text-lg font-bold text-white drop-shadow mb-1">
                          {course.title}
                        </h2>
                        <p className="mb-2 font-normal text-white">
                          {course.description}
                        </p>
                        <h2 className="text-base font-bold text-white drop-shadow mb-1">
                          {course.professor_name}
                        </h2>
                        <p className="text-sm text-gray-100 drop-shadow">
                          10:00 - 11:30 | 12/06/2025
                        </p>
                        <button
                          onClick={() => toggleForm(course.id)}
                          className="bg-[#0e6cff] text-white text-xs px-3 py-1 rounded-full font-semibold shadow hover:bg-[#326dca]"
                        >
                          {showForm[course.id]
                            ? "Hide Form"
                            : "Assign Homework"}
                        </button>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent rounded-2xl"></div>
                    </div>
                  </div>

                  {showForm[course.id] && (
                    <form
                      onSubmit={(e) => handleAssignmentSubmit(e, course.id)}
                      className="bg-white p-4 rounded shadow-md mb-8 w-[80%]"
                    >
                      <h3 className="text-lg font-semibold mb-2">
                        Assign Homework
                      </h3>
                      <input
                        type="text"
                        placeholder="Assignment Title"
                        value={assignmentData[course.id]?.title || ""}
                        onChange={(e) =>
                          handleInputChange(course.id, "title", e.target.value)
                        }
                        className="block w-full border p-2 mb-2"
                        required
                      />
                      <textarea
                        placeholder="Description"
                        value={assignmentData[course.id]?.description || ""}
                        onChange={(e) =>
                          handleInputChange(
                            course.id,
                            "description",
                            e.target.value
                          )
                        }
                        className="block w-full border p-2 mb-2"
                        required
                      ></textarea>
                      <input
                        type="date"
                        value={assignmentData[course.id]?.due_date || ""}
                        onChange={(e) =>
                          handleInputChange(
                            course.id,
                            "due_date",
                            e.target.value
                          )
                        }
                        className="block w-full border p-2 mb-2"
                        required
                      />
                      <button
                        type="submit"
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                      >
                        Submit Assignment
                      </button>
                    </form>
                  )}
                </div>
              ))}
            </div>
          </div>
          <Footer />
        </div>
      </div>
    </div>
  );
}

export default ProfessorDashboard;
