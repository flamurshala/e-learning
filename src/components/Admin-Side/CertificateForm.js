import { useState } from "react";

export default function CertificateGenerator() {
  const [formData, setFormData] = useState({
    name: "",
    course: "FULL-STACK\nDEVELOPMENT", // default with a line break
    duration: "60h",
    date: "",
    instructor: "Erion Prokshi",
  });

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Encode newline characters correctly for the PHP backend
    const query = new URLSearchParams({
      ...formData,
      course: formData.course.replace(/\n/g, "\\n"), // Send line breaks as "\n" string
    }).toString();

    window.open(`${process.env.REACT_APP_API_URL}/generate_certificate.php?${query}`, "_blank");
  };

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Generate Certificate</h2>

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="name">
            Student Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="course">
            Course Name <span className="text-sm text-gray-500">(Use Shift+Enter to break line)</span>
          </label>
          <textarea
            id="course"
            name="course"
            value={formData.course}
            onChange={handleChange}
            rows={2}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          ></textarea>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="duration">
            Duration (e.g., 60h)
          </label>
          <input
            type="text"
            id="duration"
            name="duration"
            value={formData.duration}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="date">
            Completion Date
          </label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 mb-2" htmlFor="instructor">
            Instructor Name
          </label>
          <input
            type="text"
            id="instructor"
            name="instructor"
            value={formData.instructor}
            onChange={handleChange}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition"
        >
          Generate Certificate
        </button>
      </form>
    </div>
  );
}
