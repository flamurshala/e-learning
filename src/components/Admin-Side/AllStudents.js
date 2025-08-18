import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminNav from "./AdminNav";

function AllStudents() {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 10;

  useEffect(() => {
    document.title = "All Students - Tectigon Academy";

    fetch(`${process.env.REACT_APP_API_URL}/get_students_with_payments.php`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setStudents(data);
          setFilteredStudents(data);

          const allCourses = new Set();
          data.forEach((student) => {
            student.courses.forEach((c) => {
              if (c.title) allCourses.add(c.title);
            });
          });
          setCourses(["All", ...Array.from(allCourses)]);
        } else {
          console.error("Unexpected data:", data);
        }
      })
      .catch((err) => console.error("Failed to fetch students:", err));
  }, []);

  const handleFilterChange = (e) => {
    const selected = e.target.value;
    setSelectedCourse(selected);
    setCurrentPage(1);

    const filtered = students.filter((student) => {
      const fullName = `${student.name || ""} ${student.surname || ""}`.toLowerCase();
      return fullName.includes(searchQuery.toLowerCase());
    });

    if (selected === "All") {
      setFilteredStudents(filtered);
    } else {
      setFilteredStudents(
        filtered.filter((student) =>
          student.courses.some((c) => c.title === selected)
        )
      );
    }
  };

  const handleSearchChange = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    setCurrentPage(1);

    const filtered = students.filter((student) => {
      const fullName = `${student.name || ""} ${student.surname || ""}`.toLowerCase();
      return fullName.includes(query);
    });

    if (selectedCourse !== "All") {
      setFilteredStudents(
        filtered.filter((student) =>
          student.courses.some((c) => c.title === selectedCourse)
        )
      );
    } else {
      setFilteredStudents(filtered);
    }
  };

  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const totalPages = Math.ceil(filteredStudents.length / rowsPerPage);

  return (
    <div className="flex gap-4">
      <AdminNav />
      <div className="mt-4 ml-[22%] w-[75%]">
        <h1 className="text-2xl font-semibold border-b-2 border-[#c2c2c2] w-[95%]">
          All Students
        </h1>

        <div className="my-4 flex justify-between">
          <div>
            <label className="mr-2 font-medium">Filter by Course:</label>
            <select
              value={selectedCourse}
              onChange={handleFilterChange}
              className="border px-3 py-1 rounded"
            >
              {courses.map((course, i) => (
                <option key={i} value={course}>
                  {course}
                </option>
              ))}
            </select>
          </div>

          <input
            type="text"
            placeholder="Search by name or surname"
            value={searchQuery}
            onChange={handleSearchChange}
            className="border px-3 py-1 rounded w-1/3"
          />
        </div>

        <table className="w-full mt-4 border-collapse border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Name</th>
              <th className="p-2 border">Phone Number</th>
              <th className="p-2 border">Email</th>
              <th className="p-2 border">Courses</th>
              <th className="p-2 border">Payments</th>
              <th className="p-2 border">Edit</th>
              <th className="p-2 border">Delete</th>
              <th className="p-2 border">Progress</th>
            </tr>
          </thead>
          <tbody>
            {paginatedStudents.map((student) => (
              <tr key={student.id} className="border-b border-gray-300">
                <td className="p-2">{student.name} {student.surname}</td>
                <td className="p-2">{student.phone_number}</td>
                <td className="p-2">{student.email}</td>
                <td className="p-2">
                  {student.courses.length > 0 ? (
                    <ul className="list-disc ml-5">
                      {student.courses.map((c, idx) => (
                        <li key={idx}>{c.title}</li>
                      ))}
                    </ul>
                  ) : (
                    "No courses"
                  )}
                </td>
                <td className="p-2">
                  {student.courses.length > 0 ? (
                    <ul>
                      {student.courses.map((c, idx) => (
                        <li key={idx} className="mb-1">
                          <strong>{c.title}:</strong>{" "}
                          {c.payment_method === "All"
                            ? `${c.amount_all} €`
                            : c.payment_method === "Divided"
                            ? `${c.amount_month1} € + ${c.amount_month2} €`
                            : "No payment info"}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    "No payments"
                  )}
                </td>
                <td className="p-2">
                  <Link to={`/edit-student/${student.id}`}>
                    <button className="bg-[#152259] hover:bg-[#152239] text-white py-1 px-3 rounded">
                      Edit
                    </button>
                  </Link>
                </td>
                <td className="p-2">
                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          "Are you sure you want to delete this student?"
                        )
                      ) {
                        fetch(
                          `${process.env.REACT_APP_API_URL}/delete_student.php`,
                          {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ id: student.id }),
                          }
                        )
                          .then((res) => res.json())
                          .then((data) => {
                            if (data.success) {
                              setStudents((prev) =>
                                prev.filter((s) => s.id !== student.id)
                              );
                              setFilteredStudents((prev) =>
                                prev.filter((s) => s.id !== student.id)
                              );
                            } else {
                              alert("Failed to delete student.");
                            }
                          })
                          .catch(() =>
                            alert("Error occurred while deleting student.")
                          );
                      }
                    }}
                    className="bg-red-600 text-white px-3 py-1 rounded"
                  >
                    Delete
                  </button>
                </td>
                <td className="p-2">
                  <Link to={`/student-progress/${student.id}`}>
                    <button className="bg-[#152259] hover:bg-[#152239] text-white py-1 px-3 rounded">
                      Progress
                    </button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-center items-center mt-6">
          <button
            className="px-4 py-1 mx-1 border rounded disabled:opacity-50"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => prev - 1)}
          >
            Prev
          </button>
          <span className="px-2 font-medium">
            Page {currentPage} of {totalPages}
          </span>
          <button
            className="px-4 py-1 mx-1 border rounded disabled:opacity-50"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((prev) => prev + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

export default AllStudents;
