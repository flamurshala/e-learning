import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import AdminNav from "./AdminNav";
import DatePickerDDMMYYYY, {
  displayDateToIso,
  isoDateToDisplay,
} from "./DatePickerDDMMYYYY";
import { getCurrentAdminActor } from "../../utils/currentAdmin";

const REPORT_CATEGORIES = [
  { value: "students", label: "Students" },
  { value: "payments", label: "Payments" },
  { value: "expenses", label: "Expenses" },
  { value: "teacher_salaries", label: "Teacher Salaries" },
  { value: "invoices", label: "Invoices" },
  { value: "payment_verifications", label: "Payment verifications" },
  { value: "waitlist", label: "Waitlist" },
  { value: "courses", label: "Courses" },
  { value: "admins", label: "Admins" },
  { value: "professors", label: "Professors" },
  { value: "certificates", label: "Certificates" },
  { value: "announcements", label: "Announcements" },
  { value: "attendance", label: "Attendance" },
];

function getProtectedCutoffDisplay() {
  const date = new Date();
  date.setMonth(date.getMonth() - 1);
  const iso = date.toISOString().slice(0, 10);
  return isoDateToDisplay(iso);
}

export default function ReportsCleanup() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [confirmed, setConfirmed] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });

  useEffect(() => {
    document.title = "Delete Reports - Tectigon Academy";
  }, []);

  const selectedCount = selectedCategories.length;
  const canSubmit = useMemo(
    () => dateTo && selectedCount > 0 && confirmed && !isDeleting,
    [dateTo, selectedCount, confirmed, isDeleting]
  );

  const toggleCategory = (category) => {
    setSelectedCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category]
    );
  };

  const toggleAll = () => {
    setSelectedCategories((current) =>
      current.length === REPORT_CATEGORIES.length
        ? []
        : REPORT_CATEGORIES.map((category) => category.value)
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage({ text: "", type: "" });

    const isoFrom = dateFrom ? displayDateToIso(dateFrom) : "";
    const isoTo = displayDateToIso(dateTo);

    if (!isoTo) {
      setMessage({ text: "Please select a valid To date.", type: "error" });
      return;
    }

    if (dateFrom && !isoFrom) {
      setMessage({ text: "Please select a valid From date.", type: "error" });
      return;
    }

    setIsDeleting(true);
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/delete_reports.php`, {
        date_from: isoFrom,
        date_to: isoTo,
        categories: selectedCategories,
        actor: getCurrentAdminActor(),
      });

      if (res.data?.success) {
        setMessage({
          text: `Deleted ${res.data.deleted_count || 0} old report record(s).`,
          type: "success",
        });
        setConfirmed(false);
      } else {
        setMessage({ text: res.data?.error || "Could not delete reports.", type: "error" });
      }
    } catch (error) {
      setMessage({
        text: error.response?.data?.error || "Could not delete reports.",
        type: "error",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex gap-4">
      <AdminNav />
      <div className="ml-[22%] mt-6 w-[75%] pb-10">
        <div className="mb-4 flex items-center justify-between border-b-2 border-[#c2c2c2] pb-2">
          <h1 className="text-2xl font-semibold">Delete Reports</h1>
          <Link
            to="/Reports"
            className="rounded border border-[#152259] px-4 py-2 text-[#152259] hover:bg-[#eef2ff]"
          >
            Back to Reports
          </Link>
        </div>

        <div className="mb-5 rounded border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          Reports newer than {getProtectedCutoffDisplay()} are protected and cannot be deleted.
          Choose a To date older than that protected date.
        </div>

        {message.text && (
          <p className={message.type === "success" ? "mb-4 text-green-600" : "mb-4 text-red-600"}>
            {message.text}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <DatePickerDDMMYYYY
              id="reports-delete-from"
              label="From (optional)"
              value={dateFrom}
              onChange={setDateFrom}
            />
            <DatePickerDDMMYYYY
              id="reports-delete-to"
              label="To"
              value={dateTo}
              onChange={setDateTo}
              required
            />
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Categories to delete</h2>
              <button
                type="button"
                onClick={toggleAll}
                className="rounded border px-3 py-1 text-sm hover:bg-gray-50"
              >
                {selectedCount === REPORT_CATEGORIES.length ? "Clear all" : "Select all"}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              {REPORT_CATEGORIES.map((category) => (
                <label
                  key={category.value}
                  className="flex items-center gap-2 rounded border bg-white p-3"
                >
                  <input
                    type="checkbox"
                    checked={selectedCategories.includes(category.value)}
                    onChange={() => toggleCategory(category.value)}
                  />
                  <span>{category.label}</span>
                </label>
              ))}
            </div>
          </div>

          <label className="flex items-start gap-2 rounded border bg-gray-50 p-3">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
              className="mt-1"
            />
            <span>
              I understand this permanently deletes only the selected old report records and keeps
              the protected last-month reports.
            </span>
          </label>

          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded bg-red-600 px-5 py-2 font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {isDeleting ? "Deleting..." : "Delete selected reports"}
          </button>
        </form>
      </div>
    </div>
  );
}
