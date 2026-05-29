import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link, useLocation } from "react-router-dom";
import AdminNav from "./AdminNav";
import { getCurrentAdminActor } from "../../utils/currentAdmin";

export default function InvoiceForm({ variant = "invoice" }) {
  const location = useLocation();
  const isVerification = variant === "verification";
  const prefillDate =
    isVerification && location.state?.prefillPaymentVerification
      ? location.state
      : null;
  const hasVerificationPrefill = Boolean(prefillDate);
  const config = isVerification
    ? {
        title: "Generate Payment Verification",
        settingsPath: "/PaymentVerificationSettings",
        settingsEndpoint: "get_payment_verification_settings.php",
        nextNumberEndpoint: "get_next_payment_verification_number.php",
        generateEndpoint: "generate_payment_verification.php",
        numberLabel: "Verification Number",
      }
    : {
        title: "Generate Invoice",
        settingsPath: "/InvoiceSettings",
        settingsEndpoint: "get_invoice_settings.php",
        nextNumberEndpoint: "get_next_invoice_number.php",
        generateEndpoint: "generate_invoice.php",
        numberLabel: "Invoice Number",
      };
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [studentMode, setStudentMode] = useState("select");
  const [studentSearch, setStudentSearch] = useState("");
  const [manualStudentName, setManualStudentName] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [descriptionOptions, setDescriptionOptions] = useState([]);
  const [formDate, setFormDate] = useState({
    invoiceDate: new Date().toISOString().slice(0, 10),
  });
  const [items, setItems] = useState([
    { courseIndex: "", courseId: null, courseTitle: "", description: "", unitPrice: "", locked: false },
  ]);
  const [message, setMessage] = useState({ text: "", type: "" });

  const selectedStudent = useMemo(
    () => students.find((student) => String(student.id) === String(selectedStudentId)),
    [students, selectedStudentId]
  );

  const filteredStudents = useMemo(() => {
    const query = studentSearch.trim().toLowerCase();
    if (!query) return students;

    return students.filter((student) =>
      getStudentName(student).toLowerCase().includes(query)
    );
  }, [students, studentSearch]);

  useEffect(() => {
    document.title = `${config.title} - Tectigon Academy`;

    axios
      .get(`${process.env.REACT_APP_API_URL}/get_students_with_payments.php`)
      .then((res) => setStudents(Array.isArray(res.data) ? res.data : []))
      .catch(() => setMessage({ text: "Could not load students.", type: "error" }));

    axios
      .get(`${process.env.REACT_APP_API_URL}/${config.nextNumberEndpoint}`)
      .then((res) => {
        if (res.data?.document_number) setInvoiceNumber(res.data.document_number);
        else if (res.data?.invoice_number) setInvoiceNumber(res.data.invoice_number);
      })
      .catch(() => setInvoiceNumber(""));

    axios
      .get(`${process.env.REACT_APP_API_URL}/${config.settingsEndpoint}`)
      .then((res) => setDescriptionOptions(res.data?.description_options || []))
      .catch(() => setDescriptionOptions([]));
  }, [config.nextNumberEndpoint, config.settingsEndpoint, config.title]);

  useEffect(() => {
    if (!prefillDate) return;

    if (prefillDate.studentId) {
      setStudentMode("select");
      setSelectedStudentId(String(prefillDate.studentId));
      setStudentSearch(prefillDate.studentName || "");
    } else if (prefillDate.studentName) {
      setStudentMode("manual");
      setManualStudentName(prefillDate.studentName);
    }

    if (Array.isArray(prefillDate.items) && prefillDate.items.length > 0) {
      setItems(
        prefillDate.items.map((item) => ({
          courseIndex: "",
          courseId: item.course_id || null,
          courseTitle: item.course_title || "",
          description: item.description || descriptionOptions[0]?.label || "",
          unitPrice: item.unit_price || "",
          locked: true,
        }))
      );
    }
  }, [prefillDate, descriptionOptions]);

  useEffect(() => {
    if (!prefillDate || !selectedStudent) return;

    setItems((prev) =>
      prev.map((item) => {
        if (!item.courseId) return item;
        const courseIndex = (selectedStudent.courses || []).findIndex(
          (course) => String(course.course_id) === String(item.courseId)
        );

        if (courseIndex < 0) return item;

        const course = selectedStudent.courses[courseIndex];
        return {
          ...item,
          courseIndex: String(courseIndex),
          courseTitle: item.courseTitle || course.title || "",
        };
      })
    );
  }, [prefillDate, selectedStudent]);

  function getStudentName(student) {
    return (
      [student.name, student.surname].filter(Boolean).join(" ") ||
      `Student #${student.id}`
    );
  }

  const getCourseAmount = (course) => {
    if (!course) return "";
    if (course.amount_all) return course.amount_all;
    if (course.amount_month1 || course.amount_month2) {
      return (Number(course.amount_month1 || 0) + Number(course.amount_month2 || 0)).toFixed(2);
    }
    return "";
  };

  const handleStudentChange = (studentId) => {
    setSelectedStudentId(studentId);
    setItems([{ courseIndex: "", courseId: null, courseTitle: "", description: "", unitPrice: "", locked: false }]);
  };

  const handleStudentModeChange = (mode) => {
    setStudentMode(mode);
    setSelectedStudentId("");
    setManualStudentName("");
    setStudentSearch("");
    setItems([{ courseIndex: "", courseId: null, courseTitle: "", description: "", unitPrice: "", locked: false }]);
  };

  const updateItem = (index, field, value) => {
    setItems((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    );
  };

  const handleCourseChange = (index, courseIndex) => {
    const course = selectedStudent?.courses?.[Number(courseIndex)];
    updateItem(index, "courseIndex", courseIndex);
    setItems((prev) =>
      prev.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              courseIndex,
              courseId: course?.course_id || null,
              description:
                item.description ||
                descriptionOptions[0]?.label ||
                (course?.title ? `TRAINING for ${course.title}` : ""),
              unitPrice: getCourseAmount(course),
            }
          : item
      )
    );
  };

  const addItem = () => {
    setItems((prev) => [
      ...prev,
      {
        courseIndex: "",
        courseId: null,
        courseTitle: "",
        description: descriptionOptions[0]?.label || "",
        unitPrice: "",
        locked: false,
      },
    ]);
  };

  const removeItem = (index) => {
    setItems((prev) =>
      prev.length === 1 ? prev : prev.filter((_, itemIndex) => itemIndex !== index)
    );
  };

  const invoiceItems = items.map((item) => {
    const course = selectedStudent?.courses?.[Number(item.courseIndex)];
    return {
      course_id: item.courseId || course?.course_id || null,
      description:
        item.description ||
        descriptionOptions[0]?.label ||
        (course?.title ? `TRAINING for ${course.title}` : ""),
      unit_price: item.unitPrice,
    };
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });

    axios
      .post(`${process.env.REACT_APP_API_URL}/${config.generateEndpoint}`, {
        student_id: studentMode === "select" ? selectedStudentId : null,
        manual_student_name: studentMode === "manual" ? manualStudentName : "",
        invoice_date: formDate.invoiceDate,
        items: invoiceItems,
        actor: getCurrentAdminActor(),
      })
      .then((res) => {
        const documentUrl = res.data?.document_url || res.data?.invoice_url;
        if (documentUrl) {
          window.location.href = `${process.env.REACT_APP_API_URL}/${documentUrl}`;
        } else {
          setMessage({
            text: res.data?.error || `Could not generate the ${isVerification ? "payment verification" : "invoice"}.`,
            type: "error",
          });
        }
      })
      .catch(() =>
        setMessage({
          text: `Could not generate the ${isVerification ? "payment verification" : "invoice"}.`,
          type: "error",
        })
      );
  };

  return (
    <div className="flex gap-4">
      <AdminNav />
      <div className="ml-[22%] mt-10 w-[75%]">
        <div className="max-w-2xl rounded border border-gray-300 bg-white p-6 shadow-md">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-semibold">{config.title}</h1>
            <Link
              to={config.settingsPath}
              className="rounded border border-[#152259] px-4 py-2 text-[#152259] hover:bg-[#eef2ff]"
            >
              Settings
            </Link>
          </div>
          {message.text && (
            <p
              className={
                message.type === "success"
                  ? "mb-4 text-green-600"
                  : "mb-4 text-red-600"
              }
            >
              {message.text}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block font-medium">{config.numberLabel}</label>
              <input
                type="text"
                value={invoiceNumber || "Generated automatically"}
                className="w-full rounded border bg-gray-100 px-3 py-2"
                readOnly
              />
            </div>

            <div>
              <label className="mb-2 block font-medium">Bill to</label>
              <div className="mb-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => handleStudentModeChange("select")}
                  disabled={hasVerificationPrefill}
                  className={`rounded px-4 py-2 ${
                    studentMode === "select"
                      ? "bg-[#152259] text-white"
                      : "border border-gray-300 text-gray-700"
                  }`}
                >
                  Select Student
                </button>
                <button
                  type="button"
                  onClick={() => handleStudentModeChange("manual")}
                  disabled={hasVerificationPrefill}
                  className={`rounded px-4 py-2 ${
                    studentMode === "manual"
                      ? "bg-[#152259] text-white"
                      : "border border-gray-300 text-gray-700"
                  }`}
                >
                  Write Name
                </button>
              </div>

              {studentMode === "select" ? (
                <>
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="mb-2 w-full rounded border px-3 py-2 disabled:bg-gray-100"
                    placeholder="Search student by name..."
                    disabled={hasVerificationPrefill}
                  />
                  <select
                    value={selectedStudentId}
                    onChange={(e) => handleStudentChange(e.target.value)}
                    className="w-full rounded border px-3 py-2 disabled:bg-gray-100"
                    required
                    size={Math.min(8, Math.max(3, filteredStudents.length + 1))}
                    disabled={hasVerificationPrefill}
                  >
                    <option value="">-- Select Student --</option>
                    {filteredStudents.map((student) => (
                      <option key={student.id} value={student.id}>
                        {getStudentName(student)}
                      </option>
                    ))}
                  </select>
                </>
              ) : (
                <input
                  type="text"
                  value={manualStudentName}
                  onChange={(e) => setManualStudentName(e.target.value)}
                  className="w-full rounded border px-3 py-2 disabled:bg-gray-100"
                  placeholder="Write student name"
                  disabled={hasVerificationPrefill}
                  required
                />
              )}
            </div>

            <div>
              <label className="mb-1 block font-medium">Invoice Date</label>
              <input
                type="date"
                value={formDate.invoiceDate}
                onChange={(e) =>
                  setFormDate((prev) => ({ ...prev, invoiceDate: e.target.value }))
                }
                className="w-full rounded border px-3 py-2"
                required
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="font-medium">Trainings</label>
                <button
                  type="button"
                  onClick={addItem}
                  disabled={hasVerificationPrefill}
                  className="rounded border border-[#152259] px-3 py-1 text-sm text-[#152259] hover:bg-[#eef2ff]"
                >
                  Add another
                </button>
              </div>

              {items.map((item, index) => (
                <div key={index} className="rounded border border-gray-200 p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <strong>Training #{index + 1}</strong>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        disabled={item.locked}
                        className="rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-800"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  {selectedStudent && (
                    <div className="mb-3">
                      <label className="mb-1 block font-medium">Course / Payment</label>
                      <select
                        value={item.courseIndex}
                        onChange={(e) => handleCourseChange(index, e.target.value)}
                        className="w-full rounded border px-3 py-2 disabled:bg-gray-100"
                        disabled={item.locked}
                      >
                        <option value="">-- Select course --</option>
                        {(selectedStudent.courses || []).map((course, courseIndex) => (
                          <option key={`${course.title}-${courseIndex}`} value={courseIndex}>
                            {course.title} {getCourseAmount(course) ? `- ${getCourseAmount(course)} EUR` : ""}
                          </option>
                        ))}
                      </select>
                      {item.locked && !item.courseIndex && item.courseTitle && (
                        <p className="mt-2 rounded border bg-gray-100 px-3 py-2 text-sm">
                          {item.courseTitle} - {item.unitPrice} EUR
                        </p>
                      )}
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="mb-1 block font-medium">Description</label>
                    <select
                      value={item.description}
                      onChange={(e) => updateItem(index, "description", e.target.value)}
                      className="w-full rounded border px-3 py-2"
                      required
                    >
                      <option value="">-- Select description --</option>
                      {descriptionOptions.map((option) => (
                        <option key={option.id} value={option.label}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block font-medium">Amount</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, "unitPrice", e.target.value)}
                      className="w-full rounded border px-3 py-2 disabled:bg-gray-100"
                      placeholder="110.00"
                      disabled={item.locked}
                      required
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              type="submit"
              className="w-full rounded bg-[#152259] px-4 py-2 text-white hover:bg-[#152239]"
            >
              Generate {isVerification ? "payment verification" : "invoice"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
