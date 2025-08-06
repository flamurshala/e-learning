import { useEffect, useState } from "react";
import axios from "axios";
import AdminNav from "./AdminNav"; // 👈 Make sure this import is correct

export default function CertificateGenerator() {
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [formData, setFormData] = useState({
    manualStudent: "",
    formattedCourse: "",
    duration: "60h",
    date: "",
    instructor: "Erion Prokshi",
  });

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/get_courses.php`)
      .then(res => setCourses(res.data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (selectedCourseId) {
      axios.get(`${process.env.REACT_APP_API_URL}/get_students_by_course.php?course_id=${selectedCourseId}`)
        .then(res => setStudents(res.data))
        .catch(console.error);
    } else {
      setStudents([]);
    }
  }, [selectedCourseId]);

  const handleCheckboxChange = (id) => {
    setSelectedStudents(prev =>
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map(s => s.id));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      course_id: selectedCourseId,
      course_text: formData.formattedCourse,
      selected_students: selectedStudents,
      manual_name: formData.manualStudent,
      duration: formData.duration,
      date: formData.date,
      instructor: formData.instructor,
    };

    axios.post(`${process.env.REACT_APP_API_URL}/generate_certificate.php`, payload)
      .then(res => {
        if (res.data?.merged_pdf_url) {
          const mergedUrl = `${process.env.REACT_APP_API_URL}/${res.data.merged_pdf_url}`;
          window.location.href = mergedUrl;
        } else {
          alert("Failed to generate certificates.");
        }
      })
      .catch((err) => {
        console.error("Error:", err);
        alert("An error occurred while generating the certificates.");
      });
  };

  return (
    <div className="flex gap-4">
      <AdminNav />
      <div className="mt-10 ml-[22%] w-[75%] p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Generate Certificate</h2>
        <form onSubmit={handleSubmit}>

          {/* Select Course */}
          <label className="block mb-2 font-semibold">Select Course</label>
          <select
            className="w-full mb-4 border px-3 py-2 rounded"
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
          >
            <option value="">-- Choose Course --</option>
            {courses.map(course => (
              <option key={course.id} value={course.id}>{course.title}</option>
            ))}
          </select>

          {/* Students List */}
          {students.length > 0 && (
            <div className="mb-4">
              <label className="block font-semibold mb-2">Select Students</label>
              {students.map(student => (
                <label key={student.id} className="block mb-1">
                  <input
                    type="checkbox"
                    checked={selectedStudents.includes(student.id)}
                    onChange={() => handleCheckboxChange(student.id)}
                  />
                  <span className="ml-2">{student.name}</span>
                </label>
              ))}
              <button
                type="button"
                className="mt-2 text-sm text-blue-600 underline"
                onClick={toggleSelectAll}
              >
                {selectedStudents.length === students.length ? "Unselect All" : "Select All"}
              </button>
            </div>
          )}

          {/* Manual Course Text */}
          <div className="mb-4">
            <label className="block font-semibold mb-1">Course Text (how it appears on certificate)</label>
            <textarea
              rows="2"
              name="formattedCourse"
              value={formData.formattedCourse}
              onChange={(e) => setFormData(prev => ({ ...prev, formattedCourse: e.target.value }))}
              className="w-full border px-3 py-2 rounded"
              placeholder="E.g. FULL-STACK\nDEVELOPMENT"
            />
          </div>

          {/* Manual Student Name */}
          <div className="mb-4">
            <label className="block font-semibold mb-1">Or Enter Student Name Manually (Optional)</label>
            <input
              type="text"
              name="manualStudent"
              value={formData.manualStudent}
              onChange={(e) => setFormData(prev => ({ ...prev, manualStudent: e.target.value }))}
              className="w-full border px-3 py-2 rounded"
              placeholder="Only if not selected above"
            />
          </div>

          {/* Duration */}
          <input
            type="text"
            name="duration"
            value={formData.duration}
            onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
            className="w-full mb-4 border px-3 py-2 rounded"
            placeholder="Duration (e.g. 60h)"
            required
          />

          {/* Date */}
          <input
            type="date"
            name="date"
            value={formData.date}
            onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
            className="w-full mb-4 border px-3 py-2 rounded"
            required
          />

          {/* Instructor */}
          <input
            type="text"
            name="instructor"
            value={formData.instructor}
            onChange={(e) => setFormData(prev => ({ ...prev, instructor: e.target.value }))}
            className="w-full mb-6 border px-3 py-2 rounded"
            required
          />

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
          >
            Generate Certificates
          </button>
        </form>
      </div>
    </div>
  );
}
