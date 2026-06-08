import { useEffect, useState } from "react";
import AdminNav from "./AdminNav";
import { getCurrentAdminActor } from "../../utils/currentAdmin";
import DatePickerDDMMYYYY, {
  displayDateToIso,
  todayDisplayDate,
} from "./DatePickerDDMMYYYY";

export default function TemporaryCanceledStudent() {
  const [courses, setCourses] = useState([]);
  const [form, setForm] = useState({
    name: "",
    surname: "",
    email: "",
    phone_number: "",
    course_id: "",
    amount_to_pay: "",
    extra_note: "",
    canceled_date: todayDisplayDate(),
  });
  const [message, setMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    document.title = "Temporary Canceled Student - Tectigon Academy";

    fetch(`${process.env.REACT_APP_API_URL}/get_course.php`)
      .then((res) => res.json())
      .then((data) =>
        setCourses(
          Array.isArray(data)
            ? [...data].sort((a, b) => Number(b.id) - Number(a.id))
            : []
        )
      )
      .catch(() => setCourses([]));
  }, []);

  const updateForm = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setMessage({ text: "", type: "" });
    const canceledDateIso = displayDateToIso(form.canceled_date);

    if (!canceledDateIso) {
      setMessage({ text: "Please enter the canceled date in dd/mm/yyyy format.", type: "error" });
      return;
    }

    fetch(`${process.env.REACT_APP_API_URL}/add_canceled_student_temporary.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        canceled_date: canceledDateIso,
        actor: getCurrentAdminActor(),
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) {
          setMessage({ text: data.error || "Could not add canceled student.", type: "error" });
          return;
        }

        setMessage({ text: "Canceled student added successfully.", type: "success" });
        setForm({
          name: "",
          surname: "",
          email: "",
          phone_number: "",
          course_id: "",
          amount_to_pay: "",
          extra_note: "",
          canceled_date: todayDisplayDate(),
        });
      })
      .catch(() => setMessage({ text: "Could not add canceled student.", type: "error" }));
  };

  return (
    <div className="flex gap-4">
      <AdminNav />
      <div className="mt-4 ml-[22%] w-[75%]">
        <div className="cards mt-6 items-center flex flex-wrap gap-4">
          <div className="card border shadow-xl border-black p-5 w-[45%]">
            <form onSubmit={handleSubmit}>
              <h3 className="text-2xl mb-8 font-semibold border-b-2 border-[#c2c2c2]">
                Temporary canceled student
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

              <input className="mb-4 w-full border border-black p-2" type="text" placeholder="Name" value={form.name} onChange={(e) => updateForm("name", e.target.value)} required />
              <input className="mb-4 w-full border border-black p-2" type="text" placeholder="Surname" value={form.surname} onChange={(e) => updateForm("surname", e.target.value)} required />
              <input className="mb-4 w-full border border-black p-2" type="email" placeholder="Email" value={form.email} onChange={(e) => updateForm("email", e.target.value)} required />
              <input className="mb-4 w-full border border-black p-2" type="text" placeholder="Phone Number" value={form.phone_number} onChange={(e) => updateForm("phone_number", e.target.value)} required />

              <label className="font-semibold block mb-2">Course:</label>
              <select className="mb-4 w-full border border-black p-2" value={form.course_id} onChange={(e) => updateForm("course_id", e.target.value)} required>
                <option value="">-- Select a course --</option>
                {courses.map((course) => (
                  <option key={course.id} value={course.id}>{course.title}</option>
                ))}
              </select>

              <input className="mb-4 w-full border border-black p-2" type="number" min="0" step="0.01" placeholder="Amount" value={form.amount_to_pay} onChange={(e) => updateForm("amount_to_pay", e.target.value)} />

              <DatePickerDDMMYYYY
                id="temporary-canceled-date"
                label="Canceled Date:"
                value={form.canceled_date}
                onChange={(value) => updateForm("canceled_date", value)}
                required
              />

              <label className="font-semibold block mb-2">Note:</label>
              <textarea className="mb-4 w-full border border-black p-2" rows="3" value={form.extra_note} onChange={(e) => updateForm("extra_note", e.target.value)} placeholder="Any additional notes..." />

              <button type="submit" className="bg-[#152259] text-white px-4 py-2 rounded hover:bg-[#152239]">
                Add Canceled Student
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
