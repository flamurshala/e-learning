import AdminNav from "./AdminNav";
import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

function EditStudent() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [studentName, setStudentName] = useState("");
  const [studentSurname, setStudentSurname] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [extraNotes, setExtraNotes] = useState("");

  const [courses, setCourses] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([""]);
  const [payments, setPayments] = useState([""]);
  const [amountPaidAll, setAmountPaidAll] = useState([""]);
  const [amountPaidMonth1, setAmountPaidMonth1] = useState([""]);
  const [amountPaidMonth2, setAmountPaidMonth2] = useState([""]);

  useEffect(() => {
    document.title = "Edit Student - Tectigon Academy";

    fetch(`${process.env.REACT_APP_API_URL}/get_course.php`)
      .then((res) => res.json())
      .then((data) => setCourses(Array.isArray(data) ? data : []))
      .catch(() => setCourses([]));

    fetch(`${process.env.REACT_APP_API_URL}/get_single_student.php?id=${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success === false) {
          alert("Student not found");
          navigate("/AllStudents");
          return;
        }

        setStudentName(data.name || "");
        setStudentSurname(data.surname || "");
        setPhoneNumber(data.phone_number || "");
        setStudentEmail(data.email || "");
        setExtraNotes(data.notes || "");

        const userCourses = data.courses || [];
        setSelectedCourses(userCourses.map((c) => c.course_id));
        setPayments(userCourses.map((c) => c.payment_method || ""));
        setAmountPaidAll(userCourses.map((c) => c.amount_all || ""));
        setAmountPaidMonth1(userCourses.map((c) => c.amount_month1 || ""));
        setAmountPaidMonth2(userCourses.map((c) => c.amount_month2 || ""));
      })
      .catch((err) => {
        console.error("Failed to load student", err);
        alert("Failed to load student data");
      });
  }, [id, navigate]);

  const handleCourseChange = (index, value) => {
    const updated = [...selectedCourses];
    updated[index] = value;
    setSelectedCourses(updated);
  };

  const handlePaymentChange = (index, value) => {
    const updated = [...payments];
    updated[index] = value;
    setPayments(updated);
  };

  const handleAmountPaidAllChange = (index, value) => {
    const updated = [...amountPaidAll];
    updated[index] = value;
    setAmountPaidAll(updated);
  };

  const handleAmountPaidMonth1Change = (index, value) => {
    const updated = [...amountPaidMonth1];
    updated[index] = value;
    setAmountPaidMonth1(updated);
  };

  const handleAmountPaidMonth2Change = (index, value) => {
    const updated = [...amountPaidMonth2];
    updated[index] = value;
    setAmountPaidMonth2(updated);
  };

  const addAnotherCourse = () => {
    setSelectedCourses([...selectedCourses, ""]);
    setPayments([...payments, ""]);
    setAmountPaidAll([...amountPaidAll, ""]);
    setAmountPaidMonth1([...amountPaidMonth1, ""]);
    setAmountPaidMonth2([...amountPaidMonth2, ""]);
  };

  const removeCourse = (index) => {
    setSelectedCourses(selectedCourses.filter((_, i) => i !== index));
    setPayments(payments.filter((_, i) => i !== index));
    setAmountPaidAll(amountPaidAll.filter((_, i) => i !== index));
    setAmountPaidMonth1(amountPaidMonth1.filter((_, i) => i !== index));
    setAmountPaidMonth2(amountPaidMonth2.filter((_, i) => i !== index));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      id,
      name: studentName,
      surname: studentSurname,
      phoneNumber,
      email: studentEmail,
      notes: extraNotes,
      courses: selectedCourses,
      payments,
      amountPaidAll,
      amountPaidMonth1,
      amountPaidMonth2,
    };

    fetch(`${process.env.REACT_APP_API_URL}/update_student.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          alert("Student updated successfully");
          navigate("/AllStudents");
        } else {
          alert("Update failed: " + (data.error || "Unknown error"));
        }
      })
      .catch((err) => alert("Fetch error: " + err.message));
  };

  return (
    <div className="flex gap-4">
      <AdminNav />
      <div className="ml-[22%] mt-6 w-[75%]">
        <h1 className="text-2xl font-semibold border-b-2 border-[#c2c2c2] mb-6">
          Edit Student
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block font-semibold">Name</label>
          <input type="text" value={studentName} onChange={(e) => setStudentName(e.target.value)} className="w-full border p-2" required />

          <label className="block font-semibold">Surname</label>
          <input type="text" value={studentSurname} onChange={(e) => setStudentSurname(e.target.value)} className="w-full border p-2" required />

          <label className="block font-semibold">Phone Number</label>
          <input type="text" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full border p-2" required />

          <label className="block font-semibold">Email</label>
          <input type="email" value={studentEmail} onChange={(e) => setStudentEmail(e.target.value)} className="w-full border p-2" required />

          {selectedCourses.map((courseId, index) => (
            <div key={index} className="p-4 border rounded-md mb-4 bg-gray-50">
              <div className="flex justify-between items-center mb-2">
                <label className="font-semibold">Course #{index + 1}</label>
                <button
                  type="button"
                  onClick={() => removeCourse(index)}
                  className="text-red-500 text-sm"
                >
                  🗑️ Remove
                </button>
              </div>

              <select value={courseId} onChange={(e) => handleCourseChange(index, e.target.value)} className="w-full mb-2 border p-2">
                <option value="">-- Select Course --</option>
                {courses.map((course) => (
                  <option
                    key={course.id}
                    value={course.id}
                    disabled={selectedCourses.includes(course.id) && course.id !== courseId}
                  >
                    {course.title}
                  </option>
                ))}
              </select>

              <label className="block font-semibold mb-1">Payment Method</label>
              <select value={payments[index]} onChange={(e) => handlePaymentChange(index, e.target.value)} className="w-full mb-2 border p-2">
                <option value="">Select method</option>
                <option value="All">Pay All</option>
                <option value="Divided">Pay Divided (2 months)</option>
              </select>

              {payments[index] === "All" && (
                <div>
                  <label className="block font-semibold">Amount Paid</label>
                  <input type="number" placeholder="Amount Paid" className="w-full mb-2 border p-2" value={amountPaidAll[index]} onChange={(e) => handleAmountPaidAllChange(index, e.target.value)} />
                </div>
              )}

              {payments[index] === "Divided" && (
                <div className="flex gap-2">
                  <div className="w-1/2">
                    <label className="block font-semibold">Month 1</label>
                    <input type="number" placeholder="Month 1 Paid" className="w-full border p-2" value={amountPaidMonth1[index]} onChange={(e) => handleAmountPaidMonth1Change(index, e.target.value)} />
                  </div>
                  <div className="w-1/2">
                    <label className="block font-semibold">Month 2</label>
                    <input type="number" placeholder="Month 2 Paid" className="w-full border p-2" value={amountPaidMonth2[index]} onChange={(e) => handleAmountPaidMonth2Change(index, e.target.value)} />
                  </div>
                </div>
              )}
            </div>
          ))}

          <button
            type="button"
            onClick={addAnotherCourse}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            ➕ Add Another Course
          </button>

          <label className="block font-semibold mt-4">Extra Notes</label>
          <textarea value={extraNotes} onChange={(e) => setExtraNotes(e.target.value)} className="w-full border p-2" rows="3" placeholder="Any additional notes..." />

          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded w-full">
            Save Changes
          </button>
        </form>
      </div>
    </div>
  );
}

export default EditStudent;
