import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

function EditCourse() {
  useEffect(() => {
    document.title = "Edit Course - Tectigon Academy";
  }, []);

  const { id } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState({
    title: "",
    description: "",
    professor_id: "",
  });

  const [professors, setProfessors] = useState([]);

  useEffect(() => {
    fetch(`http://localhost/e-learning/backend/get_course.php?id=${id}`)
      .then((res) => res.json())
      .then((data) => setCourse(data));

    fetch("http://localhost/e-learning/backend/get_professors.php")
      .then((res) => res.json())
      .then((data) => setProfessors(data));
  }, [id]);

  const handleChange = (e) => {
    setCourse({ ...course, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    fetch("http://localhost/e-learning/backend/update_course.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...course, id }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          alert("Course updated!");
          navigate("/AllCourses");
        } else {
          alert("Failed to update course.");
        }
      });
  };

  return (
    <div className="p-6">
      <div className="flex w-[34%] items-center justify-between mb-6">
        <h1 className="text-2xl font-bold mb-4">Edit Course</h1>
        <button
          onClick={() => navigate(-1)}
          className="bg-[#152259] text-white px-4 py-2 rounded hover:bg-[#152239]"
        >
          ← Back to Courses
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <input
          type="text"
          name="title"
          value={course.title}
          onChange={handleChange}
          placeholder="Course Title"
          className="w-full p-2 border rounded"
        />
        <textarea
          name="description"
          value={course.description}
          onChange={handleChange}
          placeholder="Description"
          className="w-full p-2 border rounded"
        ></textarea>

        <select
          name="professor_id"
          value={course.professor_id}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        >
          <option value="">-- Select Professor --</option>
          {professors.map((prof) => (
            <option key={prof.id} value={prof.id}>
              {prof.name}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="bg-[#152259] text-white px-4 py-2 rounded hover:bg-[#152239]"
        >
          Save Changes
        </button>
      </form>
    </div>
  );
}

export default EditCourse;
