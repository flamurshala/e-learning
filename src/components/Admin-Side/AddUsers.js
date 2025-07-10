import { useState, useEffect } from "react";
import AdminNav from "./AdminNav";

function AddUsers() {
  useEffect(() => {
    document.title = "Add Users - Tectigon Academy";
  }, []);

  const [studentName, setStudentName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [payments, setPayments] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [studentPassword, setStudentPassword] = useState("");

  const [courses, setCourses] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);

  const [professorName, setProfessorName] = useState("");
  const [professorEmail, setProfessorEmail] = useState("");
  const [professorPassword, setProfessorPassword] = useState("");

  const [amountPaidAll, setAmountPaidAll] = useState("");
  const [amountPaidMonth1, setAmountPaidMonth1] = useState("");
  const [amountPaidMonth2, setAmountPaidMonth2] = useState("");

  const isEmpty = (val) => !val.trim();

  useEffect(() => {
    fetch("http://localhost/e-learning/backend/get_course.php")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCourses(data);
        else setCourses([]);
      })
      .catch(() => setCourses([]));
  }, []);

  const handleCourseChange = (e) => {
    const courseId = parseInt(e.target.value);
    if (e.target.checked) {
      setSelectedCourses((prev) => [...prev, courseId]);
    } else {
      setSelectedCourses((prev) => prev.filter((id) => id !== courseId));
    }
  };

  const handleStudentSubmit = (e) => {
    e.preventDefault();

    if (
      [studentName, phoneNumber, studentEmail, studentPassword].some(isEmpty) ||
      selectedCourses.length === 0
    ) {
      alert("Please fill all student fields and select at least one course.");
      return;
    }

    const payload = {
      name: studentName,
      phoneNumber,
      payments,
      amountPaidAll,
      amountPaidMonth1,
      amountPaidMonth2,
      email: studentEmail,
      password: studentPassword,
      courses: selectedCourses,
    };

    fetch("http://localhost/e-learning/backend/add_students.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          alert("Student added successfully!");
          setStudentName("");
          setPhoneNumber("");
          setPayments("");
          setAmountPaidAll("");
          setAmountPaidMonth1("");
          setAmountPaidMonth2("");
          setStudentEmail("");
          setStudentPassword("");
          setSelectedCourses([]);
        } else {
          alert("Error adding student: " + (data.error || "Unknown error"));
        }
      })
      .catch((err) => {
        console.error("Error adding student:", err);
        alert("Error adding student, check console.");
      });
  };

  const handleProfessorSubmit = (e) => {
    e.preventDefault();

    if ([professorName, professorEmail, professorPassword].some(isEmpty)) {
      alert("Please enter all professor fields.");
      return;
    }

    const payload = {
      name: professorName,
      email: professorEmail,
      password: professorPassword,
    };

    fetch("http://localhost/e-learning/backend/add_professors.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          alert("Professor added successfully!");
          setProfessorName("");
          setProfessorEmail("");
          setProfessorPassword("");
        } else {
          alert("Error adding professor: " + (data.error || "Unknown error"));
        }
      })
      .catch((err) => {
        console.error("Professor error:", err);
        alert("Error adding professor. Check console.");
      });
  };

  return (
    <div className="flex gap-4">
      <AdminNav />
      <div className="mt-4 ml-[22%] w-[75%]">
        <h1 className="text-2xl font-semibold border-b-2 border-[#c2c2c2] w-[95%]">
          Add a new User
        </h1>
        <div className="cards mt-6 items-center flex flex-wrap gap-4">
          <div className="card border shadow-xl border-black p-5 w-[45%]">
            <form onSubmit={handleStudentSubmit}>
              <h3 className="text-2xl mb-8 font-semibold border-b-2 border-[#c2c2c2]">
                Add a new student
              </h3>

              <input
                className="mb-4 w-full border border-black p-2"
                type="text"
                name="studentName"
                placeholder="Name"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                required
              />
              <input
                className="mb-4 w-full border border-black p-2"
                type="text"
                name="phoneNumber"
                placeholder="Phone Number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
              />

              <div className="mb-4">
                <label className="font-semibold mb-2 block">
                  Select Courses:
                </label>
                {courses.length > 0 ? (
                  courses.map((course) => (
                    <label key={course.id} className="block">
                      <input
                        type="checkbox"
                        value={course.id}
                        checked={selectedCourses.includes(course.id)}
                        onChange={handleCourseChange}
                        className="mr-2"
                      />
                      {course.title}
                    </label>
                  ))
                ) : (
                  <p>No courses available</p>
                )}
              </div>

              <div className="mb-4">
                <label className="font-semibold mr-4">Payment Method:</label>
                <select
                  className="border border-black p-2"
                  value={payments}
                  onChange={(e) => setPayments(e.target.value)}
                  required
                >
                  <option value="">Select method</option>
                  <option value="All">Pay All</option>
                  <option value="Divided">Pay Divided (2 months)</option>
                </select>
              </div>
              {payments === "All" && (
                <div className="mb-4">
                  <label className="font-semibold mr-2">Amount Paid:</label>
                  <input
                    className="border border-black p-2 w-1/2"
                    type="number"
                    name="amountPaidAll"
                    placeholder="Enter amount paid"
                    value={amountPaidAll}
                    onChange={(e) => setAmountPaidAll(e.target.value)}
                    min={0}
                    required
                  />
                </div>
              )}
              {payments === "Divided" && (
                <div className="mb-4 flex gap-4">
                  <div>
                    <label className="font-semibold mr-2">
                      First Month Paid:
                    </label>
                    <input
                      className="border border-black p-2 w-24"
                      type="number"
                      name="amountPaidMonth1"
                      placeholder="Month 1"
                      value={amountPaidMonth1}
                      onChange={(e) => setAmountPaidMonth1(e.target.value)}
                      min={0}
                      required
                    />
                  </div>
                  <div>
                    <label className="font-semibold mr-2">
                      Second Month Paid:
                    </label>
                    <input
                      className="border border-black p-2 w-24"
                      type="number"
                      name="amountPaidMonth2"
                      placeholder="Month 2"
                      value={amountPaidMonth2}
                      onChange={(e) => setAmountPaidMonth2(e.target.value)}
                      min={0}
                      required
                    />
                  </div>
                </div>
              )}
              <input
                className="mb-4 w-full border border-black p-2"
                type="email"
                name="studentEmail"
                placeholder="Email"
                value={studentEmail}
                onChange={(e) => setStudentEmail(e.target.value)}
                required
              />
              <input
                className="mb-4 w-full border border-black p-2"
                type="password"
                name="studentPassword"
                placeholder="Password"
                value={studentPassword}
                onChange={(e) => setStudentPassword(e.target.value)}
                required
              />
              <button
                type="submit"
                className="bg-[#0e6cff] text-white px-4 py-2 rounded hover:bg-[#255ebb]"
              >
                Add
              </button>
            </form>
          </div>

          <div className="card border shadow-xl border-black p-5 w-[45%]">
            <form onSubmit={handleProfessorSubmit}>
              <h3 className="text-2xl mb-8 font-semibold border-b-2 border-[#c2c2c2]">
                Add a new professor
              </h3>
              <input
                className="mb-4 w-full border border-black p-2"
                type="text"
                name="professorName"
                placeholder="Name"
                value={professorName}
                onChange={(e) => setProfessorName(e.target.value)}
                required
              />
              <input
                className="mb-4 w-full border border-black p-2"
                type="email"
                name="professorEmail"
                placeholder="Email"
                value={professorEmail}
                onChange={(e) => setProfessorEmail(e.target.value)}
                required
              />
              <input
                className="mb-4 w-full border border-black p-2"
                type="password"
                name="professorPassword"
                placeholder="Password"
                value={professorPassword}
                onChange={(e) => setProfessorPassword(e.target.value)}
                required
              />
              <button
                type="submit"
                className="bg-[#0e6cff] text-white px-4 py-2 rounded hover:bg-[#255ebb]"
              >
                Add
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddUsers;
