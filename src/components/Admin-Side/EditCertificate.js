import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import AdminNav from "./AdminNav";
import BackButton from "../BackButton";





export default function EditCertificate() {
  const { id } = useParams();


  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");

  const [formData, setFormData] = useState({
    manual_name: "",
    course_text: "",
    duration: "",
    date: "",
    instructor: ""
  });

  // Load courses
  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/get_courses.php`)
      .then(res => setCourses(res.data))
      .catch(console.error);
  }, []);

  // Load certificate details
  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/get_certificate_by_id.php?id=${id}`)
      .then(res => {
        if (res.data) {
          setFormData({
            manual_name: res.data.manual_name || res.data.student_name || "",
            course_text: res.data.course_text || "",
            duration: res.data.duration || "60h",
            date: res.data.selected_date || "",
            instructor: res.data.instructor || "Instructor"
          });
          setSelectedCourseId(res.data.course_id || "");
          setSelectedStudentId(res.data.student_id || "");
        }
      })
      .catch(err => console.error("Failed to fetch certificate", err));
  }, [id]);

  // Load students for selected course
  useEffect(() => {
    if (selectedCourseId) {
      axios.get(`${process.env.REACT_APP_API_URL}/get_students_by_course.php?course_id=${selectedCourseId}`)
        .then(res => setStudents(res.data))
        .catch(console.error);
    } else {
      setStudents([]);
    }
  }, [selectedCourseId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const res = await axios.post(`${process.env.REACT_APP_API_URL}/edit_certificate.php`, {
      certificate_id: id,
      ...formData
    });

    if (res.data?.file_url) {
      const fullUrl = `${process.env.REACT_APP_API_URL}/${res.data.file_url}`;
      window.location.href = fullUrl; // or use window.open() if you prefer
    } else {
      alert("Certificate updated but file not found.");
    }
  } catch (err) {
    console.error("Update error:", err);
    alert("Failed to update certificate.");
  }
};



  return (
    <div className="flex">
      <AdminNav />
      <div className="ml-[22%] w-[75%] mt-6">
      <BackButton text="Go Back" className="mb-4" />
       

        <h1 className="text-2xl font-semibold mb-6">Edit Certificate #{id}</h1>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">

          {/* Select Course */}
          <div>
            <label className="font-medium">Select Course</label>
            <select
              className="w-full border px-3 py-2 rounded"
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              required
            >
              <option value="">-- Choose Course --</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>{course.title}</option>
              ))}
            </select>
          </div>

          {/* Select Student */}
          {students.length > 0 && (
            <div>
              <label className="font-medium">Select Student</label>
              <select
                className="w-full border px-3 py-2 rounded"
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
              >
                <option value="">-- Choose Student --</option>
                {students.map(student => (
                  <option key={student.id} value={student.id}>{student.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Or manually enter student name */}
          {/* <div>
            <label className="font-medium">Or Enter Student Name Manually</label>
            <input
              type="text"
              name="manual_name"
              value={formData.manual_name}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
              placeholder="Leave empty if selected from above"
            />
          </div> */}

          {/* Course Text */}
          <div>
            <label className="font-medium">Course Text (with line breaks)</label>
            <textarea
              name="course_text"
              value={formData.course_text}
              onChange={handleChange}
              rows="2"
              className="w-full border px-3 py-2 rounded"
              required
            />
          </div>

          {/* Duration */}
          <div>
            <label className="font-medium">Duration</label>
            <input
              type="text"
              name="duration"
              value={formData.duration}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
              required
            />
          </div>

          {/* Date */}
          <div>
            <label className="font-medium">Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
              required
            />
          </div>

          {/* Instructor */}
          <div>
            <label className="font-medium">Instructor</label>
            <input
              type="text"
              name="instructor"
              value={formData.instructor}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
              required
            />
          </div>

          <button
            type="submit"
            className="bg-[#152259] hover:bg-[#1C2F81] text-white px-4 py-2 rounded "
          >
            Update Certificate
          </button>
        </form>
      </div>
    </div>
  );
}
