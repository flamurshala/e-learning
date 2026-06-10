import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AdminNav from "./AdminNav";
import DatePickerDDMMYYYY, {
  displayDateToIso,
  todayDisplayDate,
} from "./DatePickerDDMMYYYY";
import { getCurrentAdminActor } from "../../utils/currentAdmin";

const paymentOptions = [
  { value: "Cash", label: "Paid by cash" },
  { value: "POS", label: "Paid by POS" },
  { value: "Bank", label: "Bank" },
  { value: "Divided", label: "Pay divided" },
  { value: "Did not pay", label: "Did not pay" },
  { value: "Free", label: "Free" },
];

function isSingleAmountPayment(method) {
  return method === "Bank" || method === "All" || method === "POS" || method === "Cash";
}

function getPaidAmount(method, allAmount, month1Amount, month2Amount) {
  if (isSingleAmountPayment(method)) {
    return Number(allAmount || 0);
  }

  if (method === "Divided") {
    return Number(month1Amount || 0) + Number(month2Amount || 0);
  }

  return 0;
}

function AddUsers({ temporaryRegistration = false }) {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = temporaryRegistration
      ? "Temporary Add Student - Tectigon Academy"
      : "Add Users - Tectigon Academy";
  }, [temporaryRegistration]);

  const [waitlistIds, setWaitlistIds] = useState([]);
  const [fromWaitlistFlow, setFromWaitlistFlow] = useState(false);

  const [studentName, setStudentName] = useState("");
  const [studentSurname, setStudentSurname] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [studentEmail, setStudentEmail] = useState("");
  const [registrationDate, setRegistrationDate] = useState(() =>
    todayDisplayDate()
  );
  const [extraNotes, setExtraNotes] = useState("");

  const [courses, setCourses] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([""]);

  const [payments, setPayments] = useState([""]);
  const [amountPaidAll, setAmountPaidAll] = useState([""]);
  const [amountPaidMonth1, setAmountPaidMonth1] = useState([""]);
  const [amountPaidMonth2, setAmountPaidMonth2] = useState([""]);
  const [message, setMessage] = useState({ text: "", type: "" });

  const isEmpty = (val) => !val.trim();

  useEffect(() => {
    fetch(`${process.env.REACT_APP_API_URL}/get_course.php`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCourses([...data].sort((a, b) => Number(b.id) - Number(a.id)));
        }
        else setCourses([]);
      })
      .catch(() => setCourses([]));
  }, []);

  useEffect(() => {
    const state = location.state;
    if (!state?.fromWaitlist) return;

    setFromWaitlistFlow(true);
    setStudentName(state.name != null ? String(state.name) : "");
    setStudentSurname(state.surname != null ? String(state.surname) : "");
    setPhoneNumber(state.phoneNumber != null ? String(state.phoneNumber) : "");
    setStudentEmail(state.email != null ? String(state.email) : "");

    if (state.bulk && Array.isArray(state.courseNotes) && state.courseNotes.length) {
      const courseIds = state.courseNotes.map((course) => String(course.courseId));
      setWaitlistIds(Array.isArray(state.waitlistIds) ? state.waitlistIds.map(Number) : []);
      setSelectedCourses(courseIds);
      setPayments(courseIds.map(() => ""));
      setAmountPaidAll(state.courseNotes.map((course) => course.amountToPay || ""));
      setAmountPaidMonth1(courseIds.map(() => ""));
      setAmountPaidMonth2(courseIds.map(() => ""));

      const mergedNotes = state.courseNotes
        .map((course, index) =>
          course.notes ? `Course ${index + 1}: ${course.notes}` : ""
        )
        .filter(Boolean)
        .join("\n\n");
      setExtraNotes(mergedNotes);
      return;
    }

    const ids =
      Array.isArray(state.waitlistIds) && state.waitlistIds.length > 0
        ? state.waitlistIds.map(Number)
        : state.waitlistId != null
        ? [Number(state.waitlistId)]
        : [];

    setWaitlistIds(ids);
    setSelectedCourses(state.courseId ? [String(state.courseId)] : [""]);
    setPayments([""]);
    setAmountPaidAll([state.amountToPay || ""]);
    setAmountPaidMonth1([""]);
    setAmountPaidMonth2([""]);
    setExtraNotes(state.notes != null ? String(state.notes) : "");
  }, [location.state]);

  const handleStudentSubmit = (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });

    if (
      [studentName, studentSurname, phoneNumber, studentEmail].some(isEmpty) ||
      selectedCourses.some((course) => !course) ||
      payments.some((payment) => !payment)
    ) {
      setMessage({
        text: "Please fill all student fields, select at least one course, and choose a payment option.",
        type: "error",
      });
      return;
    }

    const registrationDateIso = temporaryRegistration
      ? displayDateToIso(registrationDate)
      : "";

    if (temporaryRegistration && !registrationDateIso) {
      setMessage({
        text: "Please enter the registration date in dd/mm/yyyy format.",
        type: "error",
      });
      return;
    }

    const payload = {
      name: studentName,
      surname: studentSurname,
      phoneNumber,
      payments,
      amountPaidAll,
      amountPaidMonth1,
      amountPaidMonth2,
      email: studentEmail,
      notes: extraNotes,
      courses: selectedCourses,
      actor: getCurrentAdminActor(),
    };

    if (temporaryRegistration) {
      payload.registrationDate = registrationDateIso;
    }

    const selectedCourseDetails = selectedCourses.map((courseId) =>
      courses.find((course) => String(course.id) === String(courseId))
    );

    const paidVerificationItems = selectedCourses
      .map((courseId, index) => {
        const paymentMethod = payments[index];
        const paidAmount = getPaidAmount(
          paymentMethod,
          amountPaidAll[index],
          amountPaidMonth1[index],
          amountPaidMonth2[index]
        );

        if (paidAmount <= 0 || paymentMethod === "Did not pay" || paymentMethod === "Free") {
          return null;
        }

        const course = selectedCourseDetails[index];
        return {
          course_id: courseId,
          course_title: course?.title || "",
          description: "",
          unit_price: paidAmount.toFixed(2),
        };
      })
      .filter(Boolean);

    const addStudentEndpoint = temporaryRegistration
      ? "add_students_temporary.php"
      : "add_students.php";

    fetch(`${process.env.REACT_APP_API_URL}/${addStudentEndpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const addedCount = Array.isArray(data.added_course_ids)
            ? data.added_course_ids.length
            : 0;
          const skippedCount = Array.isArray(data.skipped_course_ids)
            ? data.skipped_course_ids.length
            : 0;
          const warnings = Array.isArray(data.warnings) ? data.warnings : [];
          const successLines = [
            temporaryRegistration
              ? data.merged_existing
                ? addedCount > 0
                  ? `Temporary student registration completed. ${addedCount} new course${addedCount === 1 ? "" : "s"} registered.`
                  : "Temporary student registration completed. No new courses were added."
                : "Student registered successfully!"
              : data.merged_existing
              ? addedCount > 0
                ? `Existing student found. ${addedCount} new course${addedCount === 1 ? "" : "s"} added.`
                : "Existing student found. No new courses were added."
              : "Student added successfully!",
          ];

          if (skippedCount > 0) {
            successLines.push(`${skippedCount} duplicate course${skippedCount === 1 ? "" : "s"} skipped.`);
          }

          if (warnings.length > 0) {
            successLines.push(...warnings);
          }

          const addedCourseIds = Array.isArray(data.added_course_ids)
            ? data.added_course_ids.map(String)
            : [];
          const addedPaidVerificationItems = paidVerificationItems.filter((item) =>
            addedCourseIds.includes(String(item.course_id))
          );

          const removeFromWaitlist = () => {
            if (!waitlistIds.length) return Promise.resolve();
            return Promise.all(
              waitlistIds.map((id) =>
                fetch(`${process.env.REACT_APP_API_URL}/delete_waitlist.php`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ id }),
                }).then((res) => res.json())
              )
            );
          };

          removeFromWaitlist().finally(() => {
            if (!temporaryRegistration && addedPaidVerificationItems.length > 0) {
              navigate("/PaymentVerificationForm", {
                state: {
                  prefillPaymentVerification: true,
                  studentId: data.student_id,
                  studentName: [studentName, studentSurname].filter(Boolean).join(" "),
                  invoiceDate: temporaryRegistration ? registrationDateIso : undefined,
                  items: addedPaidVerificationItems,
                },
              });
              return;
            }

            setMessage({ text: successLines.join("\n"), type: "success" });
            setStudentName("");
            setStudentSurname("");
            setPhoneNumber("");
            setPayments([""]);
            setAmountPaidAll([""]);
            setAmountPaidMonth1([""]);
            setAmountPaidMonth2([""]);
            setStudentEmail("");
            setRegistrationDate(todayDisplayDate());
            setExtraNotes("");
            setSelectedCourses([""]);
            setWaitlistIds([]);
            setFromWaitlistFlow(false);
            navigate(temporaryRegistration ? "/TemporaryAddStudent" : "/AddUsers", { replace: true });
          });
        } else {
          setMessage({
            text: "Error adding student: " + (data.error || "Unknown error"),
            type: "error",
          });
        }
      })
      .catch((err) => {
        console.error("Error adding student:", err);
        setMessage({ text: "Error adding student, check console.", type: "error" });
      });
  };

  const handleAddCourseField = () => {
    setSelectedCourses([...selectedCourses, ""]);
    setPayments([...payments, ""]);
    setAmountPaidAll([...amountPaidAll, ""]);
    setAmountPaidMonth1([...amountPaidMonth1, ""]);
    setAmountPaidMonth2([...amountPaidMonth2, ""]);
  };

  const handleRemoveCourseField = (index) => {
    const newSelectedCourses = [...selectedCourses];
    const newPayments = [...payments];
    const newAmountPaidAll = [...amountPaidAll];
    const newAmountPaidMonth1 = [...amountPaidMonth1];
    const newAmountPaidMonth2 = [...amountPaidMonth2];

    newSelectedCourses.splice(index, 1);
    newPayments.splice(index, 1);
    newAmountPaidAll.splice(index, 1);
    newAmountPaidMonth1.splice(index, 1);
    newAmountPaidMonth2.splice(index, 1);

    setSelectedCourses(newSelectedCourses);
    setPayments(newPayments);
    setAmountPaidAll(newAmountPaidAll);
    setAmountPaidMonth1(newAmountPaidMonth1);
    setAmountPaidMonth2(newAmountPaidMonth2);
  };

  const handleCourseChange = (index, value) => {
    const newCourses = [...selectedCourses];
    newCourses[index] = value;
    setSelectedCourses(newCourses);
  };

  const handlePaymentChange = (index, value) => {
    const newPayments = [...payments];
    const newAmountPaidAll = [...amountPaidAll];
    const newAmountPaidMonth1 = [...amountPaidMonth1];
    const newAmountPaidMonth2 = [...amountPaidMonth2];

    newPayments[index] = value;
    if (value === "Did not pay" || value === "Free") {
      newAmountPaidAll[index] = "";
      newAmountPaidMonth1[index] = "";
      newAmountPaidMonth2[index] = "";
    } else if (isSingleAmountPayment(value)) {
      newAmountPaidMonth1[index] = "";
      newAmountPaidMonth2[index] = "";
    } else if (value === "Divided") {
      newAmountPaidAll[index] = "";
    }

    setPayments(newPayments);
    setAmountPaidAll(newAmountPaidAll);
    setAmountPaidMonth1(newAmountPaidMonth1);
    setAmountPaidMonth2(newAmountPaidMonth2);
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

  return (
    <div className="flex gap-4">
      <AdminNav />
      <div className="mt-4 ml-[22%] w-[75%]">
        {/* <h1 className="text-2xl font-semibold border-b-2 border-[#c2c2c2] w-[95%]">Add a new Student</h1> */}
        <div className="cards mt-6 items-center flex flex-wrap gap-4">
          <div className="card border shadow-xl border-black p-5 w-[45%]">
            <form onSubmit={handleStudentSubmit}>
              <h3 className="text-2xl mb-8 font-semibold border-b-2 border-[#c2c2c2]">
                {temporaryRegistration ? "Temporary add student" : "Add a new student"}
              </h3>
              {message.text && (
                <p
                  className={
                    message.type === "success"
                      ? "text-green-600 mb-4 whitespace-pre-line"
                      : "text-red-600 mb-4 whitespace-pre-line"
                  }
                >
                  {message.text}
                </p>
              )}
              {fromWaitlistFlow && (
                <p className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-gray-800">
                  Waitlist registration: student details and course were
                  pre-filled from the waitlist.
                </p>
              )}
              <input className="mb-4 w-full border border-black p-2" type="text" placeholder="Name" value={studentName} onChange={(e) => setStudentName(e.target.value)} required />
              <input className="mb-4 w-full border border-black p-2" type="text" placeholder="Surname" value={studentSurname} onChange={(e) => setStudentSurname(e.target.value)} required />
              <input className="mb-4 w-full border border-black p-2" type="text" placeholder="Phone Number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required />
              
              <input className="mb-4 w-full border border-black p-2" type="email" placeholder="Email" value={studentEmail} onChange={(e) => setStudentEmail(e.target.value)} required />

              {temporaryRegistration && (
                <DatePickerDDMMYYYY
                  id="temporary-registration-date"
                  label="Registration Date:"
                  value={registrationDate}
                  onChange={setRegistrationDate}
                  required
                />
              )}

              {selectedCourses.map((selected, index) => (
                <div key={index} className="mb-6 border p-4 rounded-md border-gray-400 relative">
                  {selectedCourses.length > 1 && (
                    <button
                      type="button"
                      className="absolute top-2 right-2 text-red-500 font-bold hover:text-red-700 text-lg"
                      onClick={() => handleRemoveCourseField(index)}
                    >
                      ×
                    </button>
                  )}
                  <label className="font-semibold block mb-2">Select Course #{index + 1}:</label>
                  <select className="w-full border border-black p-2 mb-2" value={selected} onChange={(e) => handleCourseChange(index, e.target.value)} required>
                    <option value="">-- Select a course --</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>{course.title}</option>
                    ))}
                  </select>

                  <label className="font-semibold block mb-2">Payment Method:</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {paymentOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={`px-3 py-1 rounded border text-sm font-medium ${
                          payments[index] === option.value
                            ? "bg-[#152259] text-white border-[#152259]"
                            : "bg-white border-black hover:bg-gray-100"
                        }`}
                        onClick={() => handlePaymentChange(index, option.value)}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  {isSingleAmountPayment(payments[index]) && (
                    <input className="w-full border border-black p-2" type="number" placeholder="Amount Paid" min={0} value={amountPaidAll[index]} onChange={(e) => handleAmountPaidAllChange(index, e.target.value)} required />
                  )}

                  {payments[index] === "Divided" && (
                    <div className="flex flex-col gap-4 sm:flex-row">
                      <input className="w-1/2 border border-black p-2" type="number" placeholder="First Month Paid" min={0} value={amountPaidMonth1[index]} onChange={(e) => handleAmountPaidMonth1Change(index, e.target.value)} required />
                      <input className="w-1/2 border border-black p-2" type="number" placeholder="Second Month Paid" min={0} value={amountPaidMonth2[index]} onChange={(e) => handleAmountPaidMonth2Change(index, e.target.value)} />
                    </div>
                  )}

                  {payments[index] === "Did not pay" && (
                    <p className="text-sm text-red-600">No payment will be recorded for this course.</p>
                  )}

                  {payments[index] === "Free" && (
                    <p className="text-sm text-green-600">This course will be registered as free.</p>
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
