import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import AdminNav from "./AdminNav";

export default function AllCertificates() {
  const [certificates, setCertificates] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_API_URL}/get_certificates.php`)
      .then((res) => setCertificates(res.data))
      .catch((err) => console.error("Failed to load certificates:", err));
  }, []);

  const filtered = certificates.filter(
    (c) =>
      c.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(c.certificate_id).includes(searchTerm)
  );

  // Pagination logic
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const currentItems = filtered.slice(startIdx, startIdx + itemsPerPage);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  return (
    <div className="flex">
      <AdminNav />
      <div className="mt-4 ml-[22%] w-[75%]">
        <h1 className="text-2xl font-semibold mb-4">All Certificates</h1>

        <input
          type="text"
          placeholder="Search by name or ID"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1); // Reset to first page when searching
          }}
          className="w-[50%] mb-4 px-3 py-2 border rounded"
        />

        <table className="w-full border border-collapse border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">ID</th>
              <th className="p-2 border">Student</th>
              <th className="p-2 border">Course</th>
              <th className="p-2 border">Date</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((cert, i) => (
              <tr key={i}>
                <td className="p-2 border">{cert.certificate_id}</td>
                <td className="p-2 border">
                  {cert.student_name || "Manual Entry"}
                </td>
                <td className="p-2 border">{cert.course_name}</td>
                <td className="p-2 border">
                  {cert.selected_date
                    ? new Date(cert.selected_date).toLocaleDateString()
                    : "N/A"}
                </td>
                <td className="p-2 border text-center space-x-2">
                  <a
                    href={`${process.env.REACT_APP_API_URL}/certificates/${cert.file_path}`}
                    download
                    className="text-blue-600 hover:underline"
                  >
                    Download
                  </a>
                  <button
                    onClick={() =>
                      navigate(`/edit-certificate/${cert.certificate_id}`)
                    }
                    className="text-green-600 hover:underline"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
            {currentItems.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center text-gray-500 py-4">
                  No certificates found.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <button
              className="px-3 py-1 border rounded disabled:opacity-50"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Prev
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                className={`px-3 py-1 border rounded ${
                  currentPage === i + 1 ? "bg-blue-600 text-white" : ""
                }`}
                onClick={() => goToPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
            <button
              className="px-3 py-1 border rounded disabled:opacity-50"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
