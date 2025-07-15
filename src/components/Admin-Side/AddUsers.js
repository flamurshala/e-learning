import { useState, useEffect } from "react";
import AdminNav from "./AdminNav";

function AddUsers() {
  useEffect(() => {
    document.title = "Add Users - Tectigon Academy";
  }, []);

  const [studentName, setStudentName] = useState("");
  const [studentSurname, setStudentSurname] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [personalNumber, setPersonalNumber] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [extraNotes, setExtraNotes] = useState("");

  const [courses, setCourses] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([""]);

  const [professorName, setProfessorName] = useState("");
  const [professorEmail, setProfessorEmail] = useState("");

  const [payments, setPayments] = useState([""]);
  const [amountPaidAll, setAmountPaidAll] = useState([""]);
  const [amountPaidMonth1, setAmountPaidMonth1] = useState([""]);
  const [amountPaidMonth2, setAmountPaidMonth2] = useState([""]);

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

  const handleStudentSubmit = (e) => {
    e.preventDefault();

    if (
      [studentName, studentSurname, phoneNumber, personalNumber, studentEmail].some(isEmpty) ||
      selectedCourses.some((course) => !course)
    ) {
      alert("Please fill all student fields and select at least one course.");
      return;
    }

    const payload = {
      name: studentName,
      surname: studentSurname,
      phoneNumber,
      personalNumber,
      payments,
      amountPaidAll,
      amountPaidMonth1,
      amountPaidMonth2,
      email: studentEmail,
      notes: extraNotes,
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
          setStudentSurname("");
          setPhoneNumber("");
          setPersonalNumber("");
          setPayments([""]);
          setAmountPaidAll([""]);
          setAmountPaidMonth1([""]);
          setAmountPaidMonth2([""]);
          setStudentEmail("");
          setExtraNotes("");
          setSelectedCourses([""]);
        } else {
          alert("Error adding student: " + (data.error || "Unknown error"));
        }
      })
      .catch((err) => {
        console.error("Error adding student:", err);
        alert("Error adding student, check console.");
      });
  };

  const handleAddCourseField = () => {
    setSelectedCourses([...selectedCourses, ""]);
    setPayments([...payments, ""]);
    setAmountPaidAll([...amountPaidAll, ""]);
    setAmountPaidMonth1([...amountPaidMonth1, ""]);
    setAmountPaidMonth2([...amountPaidMonth2, ""]);
  };

  const handleCourseChange = (index, value) => {
    const newCourses = [...selectedCourses];
    newCourses[index] = value;
    setSelectedCourses(newCourses);
  };

  const handlePaymentChange = (index, value) => {
    const newPayments = [...payments];
    newPayments[index] = value;
    setPayments(newPayments);
  };

  const handleAmountPaidAllChange = (index, value) => {
    const newAmounts = [...amountPaidAll];
    newAmounts[index] = value;
    setAmountPaidAll(newAmounts);
  };

  const handleAmountPaidMonth1Change = (index, value) => {
    const newAmounts = [...amountPaidMonth1];
    newAmounts[index] = value;
    setAmountPaidMonth1(newAmounts);
  };

  const handleAmountPaidMonth2Change = (index, value) => {
    const newAmounts = [...amountPaidMonth2];
    newAmounts[index] = value;
    setAmountPaidMonth2(newAmounts);
  };

  const handleProfessorSubmit = (e) => {
    e.preventDefault();

    if ([professorName, professorEmail].some(isEmpty)) {
      alert("Please enter all professor fields.");
      return;
    }

    const payload = {
      name: professorName,
      email: professorEmail,
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
        <h1 className="text-2xl font-semibold border-b-2 border-[#c2c2c2] w-[95%]">Add a new User</h1>
        <div className="cards mt-6 items-center flex flex-wrap gap-4">
          <div className="card border shadow-xl border-black p-5 w-[45%]">
            <form onSubmit={handleStudentSubmit}>
              <h3 className="text-2xl mb-8 font-semibold border-b-2 border-[#c2c2c2]">Add a new student</h3>
              <input className="mb-4 w-full border border-black p-2" type="text" placeholder="Name" value={studentName} onChange={(e) => setStudentName(e.target.value)} required />
              <input className="mb-4 w-full border border-black p-2" type="text" placeholder="Surname" value={studentSurname} onChange={(e) => setStudentSurname(e.target.value)} required />
              <input className="mb-4 w-full border border-black p-2" type="text" placeholder="Phone Number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required />
              <input className="mb-4 w-full border border-black p-2" type="text" placeholder="Personal Number" value={personalNumber} onChange={(e) => setPersonalNumber(e.target.value)} required />
              <input className="mb-4 w-full border border-black p-2" type="email" placeholder="Email" value={studentEmail} onChange={(e) => setStudentEmail(e.target.value)} required />

              {selectedCourses.map((selected, index) => (
                <div key={index} className="mb-6 border p-4 rounded-md border-gray-400">
                  <label className="font-semibold block mb-2">Select Course #{index + 1}:</label>
                  <select className="w-full border border-black p-2 mb-2" value={selected} onChange={(e) => handleCourseChange(index, e.target.value)} required>
                    <option value="">-- Select a course --</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>{course.title}</option>
                    ))}
                  </select>

                  <label className="font-semibold block mb-2">Payment Method:</label>
                  <select className="w-full border border-black p-2 mb-2" value={payments[index]} onChange={(e) => handlePaymentChange(index, e.target.value)} required>
                    <option value="">Select method</option>
                    <option value="All">Pay All</option>
                    <option value="Divided">Pay Divided (2 months)</option>
                  </select>

                  {payments[index] === "All" && (
                    <input className="w-full border border-black p-2" type="number" placeholder="Amount Paid" min={0} value={amountPaidAll[index]} onChange={(e) => handleAmountPaidAllChange(index, e.target.value)} required />
                  )}

                  {payments[index] === "Divided" && (
                    <div className="flex gap-4">
                      <input className="w-1/2 border border-black p-2" type="number" placeholder="First Month Paid" min={0} value={amountPaidMonth1[index]} onChange={(e) => handleAmountPaidMonth1Change(index, e.target.value)} required />
                      <input className="w-1/2 border border-black p-2" type="number" placeholder="Second Month Paid" min={0} value={amountPaidMonth2[index]} onChange={(e) => handleAmountPaidMonth2Change(index, e.target.value)} required />
                    </div>
                  )}
                </div>
              ))}

              <button type="button" className="mb-4 bg-[#152259] text-white px-4 py-2 rounded hover:bg-[#152239]" onClick={handleAddCourseField}>+ Add Another Course</button>

              <div className="mb-4">
                <label className="font-semibold block mb-2">Extra Notes:</label>
                <textarea className="w-full border border-black p-2" rows="3" value={extraNotes} onChange={(e) => setExtraNotes(e.target.value)} placeholder="Any additional notes..." />
              </div>
              <button type="submit" className="bg-[#152259] text-white px-4 py-2 rounded hover:bg-[#152239]">Add</button>
            </form>
          </div>

          
        </div>
      </div>
    </div>
  );
}

export default AddUsers;
