import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import AdminNav from "./AdminNav";

export default function EditCertificate() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    manual_name: "",
    course_text: "",
    duration: "",
    date: "",
    instructor: ""
  });

  useEffect(() => {
    axios.get(`${process.env.REACT_APP_API_URL}/get_certificate_by_id.php?id=${id}`)
      .then(res => {
        if (res.data) {
          setFormData({
            manual_name: res.data.manual_name || res.data.student_name || "",
            course_text: res.data.course_name || "",
            duration: res.data.duration || "60h",
            date: res.data.selected_date || "",
            instructor: res.data.instructor || "Instructor"
          });
        }
      })
      .catch(err => console.error("Failed to fetch certificate", err));
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/edit_certificate.php`, {
        certificate_id: id,
        ...formData
      });
      alert("Certificate updated and regenerated.");
      navigate("/all-certificates");
    } catch (err) {
      console.error("Update error:", err);
      alert("Failed to update certificate.");
    }
  };

  return (
    <div className="flex">
      <AdminNav />
      <div className="ml-[22%] w-[75%] mt-6">
        <h1 className="text-2xl font-semibold mb-6">Edit Certificate #{id}</h1>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
          <div>
            <label className="font-medium">Student Name</label>
            <input
              type="text"
              name="manual_name"
              value={formData.manual_name}
              onChange={handleChange}
              className="w-full border px-3 py-2 rounded"
              required
            />
          </div>
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
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Update Certificate
          </button>
        </form>
      </div>
    </div>
  );
}
