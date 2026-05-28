import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import AdminNav from "./AdminNav";

const MONTHS = [
  { value: "", label: "Të gjithë muajt" },
  { value: "1", label: "Janar" },
  { value: "2", label: "Shkurt" },
  { value: "3", label: "Mars" },
  { value: "4", label: "Prill" },
  { value: "5", label: "Maj" },
  { value: "6", label: "Qershor" },
  { value: "7", label: "Korrik" },
  { value: "8", label: "Gusht" },
  { value: "9", label: "Shtator" },
  { value: "10", label: "Tetor" },
  { value: "11", label: "Nëntor" },
  { value: "12", label: "Dhjetor" },
];

export default function DocumentList({ variant = "invoice" }) {
  const isVerification = variant === "verification";
  const config = isVerification
    ? {
        title: "Payment Verifications",
        endpoint: "get_payment_verifications_list.php",
        numberLabel: "Verification No.",
        folder: "payment_verifications",
        formPath: "/PaymentVerificationForm",
        addLabel: "Add payment verification",
      }
    : {
        title: "Faturat",
        endpoint: "get_invoices_list.php",
        numberLabel: "Nr. i faturës",
        folder: "invoices",
        formPath: "/InvoiceForm",
        addLabel: "Shto faturë",
      };

  const [documents, setDocuments] = useState([]);
  const [courses, setCourses] = useState([]);
  const [filters, setFilters] = useState({
    year: "",
    month: "",
    date_from: "",
    date_to: "",
    name: "",
    course_id: "",
  });
  const [message, setMessage] = useState({ text: "", type: "" });

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const documentYears = documents
      .map((document) => new Date(document.document_date).getFullYear())
      .filter(Boolean);
    return Array.from(new Set([currentYear, ...documentYears])).sort((a, b) => b - a);
  }, [documents]);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    return params.toString();
  }, [filters]);

  useEffect(() => {
    document.title = `${config.title} - Tectigon Academy`;
  }, [config.title]);

  useEffect(() => {
    axios
      .get(`${process.env.REACT_APP_API_URL}/get_course.php`)
      .then((res) => setCourses(Array.isArray(res.data) ? res.data : []))
      .catch(() => setCourses([]));
  }, []);

  useEffect(() => {
    setMessage({ text: "", type: "" });
    axios
      .get(`${process.env.REACT_APP_API_URL}/${config.endpoint}${queryString ? `?${queryString}` : ""}`)
      .then((res) => {
        if (res.data?.success === false) {
          setMessage({ text: res.data.error || "Nuk u arrit të ngarkohen dokumentet.", type: "error" });
          setDocuments([]);
          return;
        }
        setDocuments(Array.isArray(res.data?.documents) ? res.data.documents : []);
      })
      .catch(() => {
        setDocuments([]);
        setMessage({ text: "Nuk u arrit të ngarkohen dokumentet.", type: "error" });
      });
  }, [config.endpoint, queryString]);

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({ year: "", month: "", date_from: "", date_to: "", name: "", course_id: "" });
  };

  return (
    <div className="flex gap-4">
      <AdminNav />
      <div className="ml-[22%] mt-6 w-[75%]">
        <div className="mb-4 flex items-center justify-between border-b-2 border-[#c2c2c2] pb-2">
          <h1 className="text-2xl font-semibold">{config.title}</h1>
          <div className="flex gap-2">
            <Link to={config.formPath}>
              <button className="rounded bg-[#152259] px-4 py-2 text-white hover:bg-[#152239]">
                {config.addLabel}
              </button>
            </Link>
            <button
              type="button"
              onClick={resetFilters}
              className="rounded border border-[#152259] px-4 py-2 text-[#152259] hover:bg-[#eef2ff]"
            >
              Pastro filtrat
            </button>
          </div>
        </div>

        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-5">
          <label className="font-medium">
            Viti
            <select
              value={filters.year}
              onChange={(e) => updateFilter("year", e.target.value)}
              className="mt-1 w-full rounded border px-3 py-2"
            >
              <option value="">All years</option>
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </label>

          <label className="font-medium">
            Muaji
            <select
              value={filters.month}
              onChange={(e) => updateFilter("month", e.target.value)}
              className="mt-1 w-full rounded border px-3 py-2"
            >
              {MONTHS.map((month) => (
                <option key={month.value || "all"} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </label>

          <div className="font-medium">
            Intervali i datave
            <div className="mt-1 grid grid-cols-2 gap-2 rounded border p-2">
              <input
                type="date"
                value={filters.date_from}
                onChange={(e) => updateFilter("date_from", e.target.value)}
                className="w-full rounded border px-2 py-1"
                aria-label="Data nga"
              />
              <input
                type="date"
                value={filters.date_to}
                onChange={(e) => updateFilter("date_to", e.target.value)}
                className="w-full rounded border px-2 py-1"
                aria-label="Data deri"
              />
            </div>
          </div>

          <label className="font-medium">
            Kërko emrin
            <input
              type="text"
              value={filters.name}
              onChange={(e) => updateFilter("name", e.target.value)}
              className="mt-1 w-full rounded border px-3 py-2"
              placeholder="Student name"
            />
          </label>

          <label className="font-medium">
            Trajnimi
            <select
              value={filters.course_id}
              onChange={(e) => updateFilter("course_id", e.target.value)}
              className="mt-1 w-full rounded border px-3 py-2"
            >
              <option value="">Të gjitha trajnimet</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </label>
        </div>

        {message.text && (
          <p className={message.type === "success" ? "mb-4 text-green-600" : "mb-4 text-red-600"}>
            {message.text}
          </p>
        )}

        <table className="w-full border-collapse border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="border p-2 text-left">{config.numberLabel}</th>
              <th className="border p-2 text-left">Data</th>
              <th className="border p-2 text-left">Studenti</th>
              <th className="border p-2 text-left">Trajnimi</th>
              <th className="border p-2 text-left">Përshkrimi</th>
              <th className="border p-2 text-right">Total</th>
              <th className="border p-2 text-left">PDF</th>
            </tr>
          </thead>
          <tbody>
            {documents.length > 0 ? (
              documents.map((document) => (
                <tr key={document.id} className="border-b">
                  <td className="border p-2">{document.document_number}</td>
                  <td className="border p-2">{document.document_date}</td>
                  <td className="border p-2">{document.student_name || "Manual student"}</td>
                  <td className="border p-2">{document.course_title || "E paspecifikuar"}</td>
                  <td className="border p-2">{document.description}</td>
                  <td className="border p-2 text-right">
                    {Number(document.total || 0).toFixed(2)} €
                  </td>
                  <td className="border p-2">
                    <a
                      href={`${process.env.REACT_APP_API_URL}/${config.folder}/${document.file_path}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#152259] underline"
                    >
                      Shiko
                    </a>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="p-4 text-center text-gray-500">
                  Nuk u gjetën dokumente.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
