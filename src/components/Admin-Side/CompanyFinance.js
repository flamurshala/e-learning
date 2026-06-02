import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import AdminNav from "./AdminNav";
import { getCurrentAdminActor, getCurrentAdminQueryString } from "../../utils/currentAdmin";

const expenseCategories = ["Rent", "Utilities", "Supplies", "Marketing", "Maintenance", "Software", "Other"];
const expensePaymentMethods = ["Bank", "Cash"];
const expenseCategoryLabels = {
  Rent: "Rent",
  Utilities: "Utilities",
  Supplies: "Supplies",
  Marketing: "Marketing",
  Maintenance: "Maintenance",
  Software: "Software",
  Other: "Other",
};
const salaryStatuses = ["unpaid", "partially_paid", "paid"];
const salaryStatusLabels = {
  unpaid: "Unpaid",
  partially_paid: "Partially paid",
  paid: "Paid",
};
const paymentMethodLabels = {
  Bank: "Bank",
  All: "Pay all",
  Divided: "Installment payment",
  POS: "POS",
  Cash: "Cash",
  "Did not pay": "Did not pay",
};
const incomePaymentMethodOptions = ["Bank", "All", "Divided", "POS", "Cash", "Did not pay", "Free"];
const statusOptions = [
  ["paid", "Paid"],
  ["unpaid", "Unpaid"],
  ["partially_paid", "Partially paid"],
  ["cash", "Paid by cash"],
  ["pos", "Paid by POS"],
];
const defaultPagination = { page: 1, limit: 50, total_rows: 0, total_pages: 1 };
const defaultSalarySummary = {
  expected_amount: null,
  total_paid: 0,
  remaining_amount: null,
  status: "",
};
const emptyExpense = {
  id: "",
  title: "",
  bill_number: "",
  category: "Rent",
  amount: "",
  expense_date: new Date().toISOString().slice(0, 10),
  payment_method: "",
  description: "",
};
const emptySalary = {
  id: "",
  teacher_id: "",
  course_id: "",
  expected_amount: "",
  paid_amount: "",
  payment_date: new Date().toISOString().slice(0, 10),
  notes: "",
};

function money(value) {
  return `${Number(value || 0).toFixed(2)} €`;
}

function optionalMoney(value) {
  return value === null || value === undefined || value === "" ? "-" : money(value);
}

function labelFor(map, value) {
  return map[value] || value || "-";
}

function incomeAmountDisplay(row) {
  if (row.payment_method === "Divided") {
    return `${money(row.amount_month1)} + ${money(row.amount_month2)}`;
  }

  return money(row.payment_amount);
}

function PaginationControls({ pagination, onPageChange }) {
  const page = Number(pagination?.page || 1);
  const totalPages = Number(pagination?.total_pages || 1);
  const totalRows = Number(pagination?.total_rows || 0);
  const limit = Number(pagination?.limit || 50);
  const start = totalRows === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalRows);

  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-700">
      <span>
        Showing {start}-{end} of {totalRows} rows
      </span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="rounded border px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Previous
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="rounded border px-3 py-1 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}

function apiUrl(endpoint, params = {}) {
  const search = new URLSearchParams(getCurrentAdminQueryString());
  Object.entries(params).forEach(([key, value]) => {
    if (value !== "" && value !== null && value !== undefined) search.set(key, value);
  });
  const query = search.toString();
  return `${process.env.REACT_APP_API_URL}/${endpoint}${query ? `?${query}` : ""}`;
}

export default function CompanyFinance() {
  const [activeTab, setActiveTab] = useState("income");
  const [summary, setSummary] = useState({
    total_income: 0,
    total_expenses: 0,
    total_teacher_salaries: 0,
    net_profit: 0,
  });
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [incomeRows, setIncomeRows] = useState([]);
  const [incomeTotal, setIncomeTotal] = useState(0);
  const [expenses, setExpenses] = useState([]);
  const [expensesTotal, setExpensesTotal] = useState(0);
  const [salaryPayments, setSalaryPayments] = useState([]);
  const [salaryTotal, setSalaryTotal] = useState(0);
  const [incomePage, setIncomePage] = useState(1);
  const [expensePage, setExpensePage] = useState(1);
  const [salaryPage, setSalaryPage] = useState(1);
  const [incomePagination, setIncomePagination] = useState(defaultPagination);
  const [expensePagination, setExpensePagination] = useState(defaultPagination);
  const [salaryPagination, setSalaryPagination] = useState(defaultPagination);
  const [selectedSalarySummary, setSelectedSalarySummary] = useState(defaultSalarySummary);
  const [message, setMessage] = useState({ text: "", type: "" });

  const [topFilters, setTopFilters] = useState({
    date_from: "",
    date_to: "",
    course_id: "",
    status: "",
  });
  const [incomeFilters, setIncomeFilters] = useState({
    student: "",
  });
  const [expenseFilters, setExpenseFilters] = useState({
    title: "",
    category: "",
    amount_min: "",
    amount_max: "",
  });
  const [salaryFilters, setSalaryFilters] = useState({
    teacher_id: "",
  });
  const [expenseForm, setExpenseForm] = useState(emptyExpense);
  const [salaryForm, setSalaryForm] = useState(emptySalary);

  useEffect(() => {
    document.title = "Company Finance - Tectigon Academy";
  }, []);

  const loadSummary = useCallback(() => {
    axios
      .get(apiUrl("finance_summary.php", topFilters))
      .then((res) => {
        if (res.data?.success) setSummary(res.data.totals || {
          total_income: 0,
          total_expenses: 0,
          total_teacher_salaries: 0,
          net_profit: 0,
        });
      })
      .catch(() => setMessage({ text: "Could not load the financial summary.", type: "error" }));
  }, [topFilters]);

  const loadOptions = useCallback(() => {
    axios
      .get(apiUrl("finance_options.php"))
      .then((res) => {
        if (res.data?.success) {
          setCourses(Array.isArray(res.data.courses) ? res.data.courses : []);
          setTeachers(Array.isArray(res.data.teachers) ? res.data.teachers : []);
        }
      })
      .catch(() => setMessage({ text: "Could not load finance options.", type: "error" }));
  }, []);

  const loadIncome = useCallback(() => {
    axios
      .get(apiUrl("finance_income.php", { ...topFilters, ...incomeFilters, page: incomePage }))
      .then((res) => {
        if (res.data?.success) {
          setIncomeRows(Array.isArray(res.data.payments) ? res.data.payments : []);
          setIncomeTotal(res.data.total_income || 0);
          setIncomePagination(res.data.pagination || defaultPagination);
        }
      })
      .catch(() => setMessage({ text: "Could not load income.", type: "error" }));
  }, [incomeFilters, incomePage, topFilters]);

  const loadExpenses = useCallback(() => {
    axios
      .get(apiUrl("finance_expenses.php", {
        date_from: topFilters.date_from,
        date_to: topFilters.date_to,
        page: expensePage,
        ...expenseFilters,
      }))
      .then((res) => {
        if (res.data?.success) {
          setExpenses(Array.isArray(res.data.expenses) ? res.data.expenses : []);
          setExpensesTotal(res.data.total_expenses || 0);
          setExpensePagination(res.data.pagination || defaultPagination);
        }
      })
      .catch(() => setMessage({ text: "Could not load expenses.", type: "error" }));
  }, [expenseFilters, expensePage, topFilters.date_from, topFilters.date_to]);

  const loadSalaryPayments = useCallback(() => {
    const salaryStatus = salaryStatuses.includes(topFilters.status) ? topFilters.status : "";
    axios
      .get(apiUrl("teacher_salary_payments.php", {
        date_from: topFilters.date_from,
        date_to: topFilters.date_to,
        course_id: topFilters.course_id,
        status: salaryStatus,
        page: salaryPage,
        ...salaryFilters,
      }))
      .then((res) => {
        if (res.data?.success) {
          setSalaryPayments(Array.isArray(res.data.payments) ? res.data.payments : []);
          setSalaryTotal(res.data.total_paid || 0);
          setSalaryPagination(res.data.pagination || defaultPagination);
        }
      })
      .catch(() => setMessage({ text: "Could not load teacher salaries.", type: "error" }));
  }, [salaryFilters, salaryPage, topFilters]);

  useEffect(() => {
    loadSummary();
    loadOptions();
  }, [loadSummary, loadOptions]);

  useEffect(() => {
    loadIncome();
  }, [loadIncome]);

  useEffect(() => {
    loadExpenses();
  }, [loadExpenses]);

  useEffect(() => {
    loadSalaryPayments();
  }, [loadSalaryPayments]);

  useEffect(() => {
    if (!salaryForm.teacher_id || !salaryForm.course_id) {
      setSelectedSalarySummary(defaultSalarySummary);
      return;
    }

    axios
      .get(apiUrl("teacher_salary_payments.php", {
        teacher_id: salaryForm.teacher_id,
        course_id: salaryForm.course_id,
        page: 1,
      }))
      .then((res) => {
        if (res.data?.success) {
          setSelectedSalarySummary(res.data.salary_summary || defaultSalarySummary);
        }
      })
      .catch(() => setSelectedSalarySummary(defaultSalarySummary));
  }, [salaryForm.teacher_id, salaryForm.course_id]);

  const relatedCourses = useMemo(
    () => courses.filter((course) => String(course.teacher_id || "") === String(salaryForm.teacher_id || "")),
    [courses, salaryForm.teacher_id]
  );

  const previousSalaryPaid = Number(selectedSalarySummary.total_paid || 0);
  const suggestedExpected = selectedSalarySummary.expected_amount || "";
  const expectedForProjection = salaryForm.expected_amount || suggestedExpected;
  const remainingBeforePayment =
    expectedForProjection === "" ? null : Math.max(Number(expectedForProjection || 0) - previousSalaryPaid, 0);

  const resetPages = () => {
    setIncomePage(1);
    setExpensePage(1);
    setSalaryPage(1);
  };
  const updateTopFilter = (key, value) => {
    resetPages();
    setTopFilters((prev) => ({ ...prev, [key]: value }));
  };
  const updateIncomeFilter = (key, value) => {
    setIncomePage(1);
    setIncomeFilters((prev) => ({ ...prev, [key]: value }));
  };
  const updateExpenseFilter = (key, value) => {
    setExpensePage(1);
    setExpenseFilters((prev) => ({ ...prev, [key]: value }));
  };
  const updateSalaryFilter = (key, value) => {
    setSalaryPage(1);
    setSalaryFilters((prev) => ({ ...prev, [key]: value }));
  };
  const updateExpenseForm = (key, value) => setExpenseForm((prev) => ({ ...prev, [key]: value }));
  const clearFilters = () => {
    resetPages();
    setTopFilters({ date_from: "", date_to: "", course_id: "", status: "" });
    setIncomeFilters({ student: "" });
    setExpenseFilters({ title: "", category: "", amount_min: "", amount_max: "" });
    setSalaryFilters({ teacher_id: "" });
  };
  const changeTab = (tab) => {
    setActiveTab(tab);
    clearFilters();
  };
  const updateSalaryForm = (key, value) => {
    setSalaryForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "teacher_id") next.course_id = "";
      return next;
    });
  };

  const generateCsv = () => {
    const params = {
      tab: activeTab,
      date_from: topFilters.date_from,
      date_to: topFilters.date_to,
    };

    if (activeTab === "income") {
      Object.assign(params, {
        course_id: topFilters.course_id,
        status: topFilters.status,
        student: incomeFilters.student,
      });
    } else if (activeTab === "expenses") {
      Object.assign(params, expenseFilters);
    } else {
      Object.assign(params, {
        course_id: topFilters.course_id,
        status: salaryStatuses.includes(topFilters.status) ? topFilters.status : "",
        teacher_id: salaryFilters.teacher_id,
      });
    }

    const url = apiUrl("finance_export_csv.php", params);
    const link = document.createElement("a");
    link.href = url;
    link.download = "";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const saveExpense = (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });
    axios
      .post(`${process.env.REACT_APP_API_URL}/save_finance_expense.php`, {
        ...expenseForm,
        actor: getCurrentAdminActor(),
      })
      .then((res) => {
        if (res.data?.success) {
          setMessage({ text: res.data.message || "Expense saved.", type: "success" });
          setExpenseForm(emptyExpense);
          loadExpenses();
          loadSummary();
        } else {
          setMessage({ text: res.data?.error || "Could not save the expense.", type: "error" });
        }
      })
      .catch(() => setMessage({ text: "Could not save the expense.", type: "error" }));
  };

  const editExpense = (expense) => {
    setExpenseForm({
      id: expense.id,
      title: expense.title || "",
      bill_number: expense.bill_number || "",
      category: expense.category || "Other",
      amount: expense.amount || "",
      expense_date: expense.expense_date || new Date().toISOString().slice(0, 10),
      payment_method: expense.payment_method || "",
      description: expense.description || "",
    });
    setActiveTab("expenses");
  };

  const deleteExpense = (id) => {
    if (!window.confirm("Delete this expense?")) return;
    axios
      .post(`${process.env.REACT_APP_API_URL}/delete_finance_expense.php`, {
        id,
        actor: getCurrentAdminActor(),
      })
      .then((res) => {
        if (res.data?.success) {
          loadExpenses();
          loadSummary();
        } else {
          setMessage({ text: res.data?.error || "Could not delete the expense.", type: "error" });
        }
      })
      .catch(() => setMessage({ text: "Could not delete the expense.", type: "error" }));
  };

  const saveSalaryPayment = (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });
    axios
      .post(`${process.env.REACT_APP_API_URL}/save_teacher_salary_payment.php`, {
        ...salaryForm,
        actor: getCurrentAdminActor(),
      })
      .then((res) => {
        if (res.data?.success) {
          setMessage({
            text: `Teacher salary payment was saved as ${labelFor(salaryStatusLabels, res.data.status)}.`,
            type: "success",
          });
          setSalaryForm(emptySalary);
          loadSalaryPayments();
          loadSummary();
        } else {
          setMessage({ text: res.data?.error || "Could not save the teacher salary payment.", type: "error" });
        }
      })
      .catch(() => setMessage({ text: "Could not save the teacher salary payment.", type: "error" }));
  };

  const editSalaryPayment = (payment) => {
    setSalaryForm({
      id: payment.id || "",
      teacher_id: payment.teacher_id || "",
      course_id: payment.course_id || "",
      expected_amount: payment.expected_amount || "",
      paid_amount: payment.paid_amount || "",
      payment_date: payment.payment_date || new Date().toISOString().slice(0, 10),
      notes: payment.notes || "",
    });
    setActiveTab("salaries");
  };

  const deleteSalaryPayment = (id) => {
    if (!window.confirm("Delete this teacher salary payment?")) return;
    setMessage({ text: "", type: "" });

    axios
      .post(`${process.env.REACT_APP_API_URL}/delete_teacher_salary_payment.php`, {
        id,
        actor: getCurrentAdminActor(),
      })
      .then((res) => {
        if (res.data?.success) {
          setMessage({ text: "Teacher salary payment deleted.", type: "success" });
          if (String(salaryForm.id) === String(id)) setSalaryForm(emptySalary);
          loadSalaryPayments();
          loadSummary();
        } else {
          setMessage({ text: res.data?.error || "Could not delete the teacher salary payment.", type: "error" });
        }
      })
      .catch(() => setMessage({ text: "Could not delete the teacher salary payment.", type: "error" }));
  };

  return (
    <div className="flex gap-4">
      <AdminNav />
      <div className="ml-[22%] mt-6 w-[75%] pb-10">
        <h1 className="mb-4 border-b-2 border-[#c2c2c2] pb-2 text-2xl font-semibold">
          Company Finance
        </h1>

        <div className="mb-6 rounded border bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">Filters</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
            <input type="date" value={topFilters.date_from} onChange={(e) => updateTopFilter("date_from", e.target.value)} className="rounded border px-3 py-2" />
            <input type="date" value={topFilters.date_to} onChange={(e) => updateTopFilter("date_to", e.target.value)} className="rounded border px-3 py-2" />
            <select value={topFilters.course_id} onChange={(e) => updateTopFilter("course_id", e.target.value)} className="rounded border px-3 py-2">
              <option value="">All courses</option>
              {courses.map((course) => (
                <option key={`${course.id}-${course.teacher_id || "none"}`} value={course.id}>{course.title}</option>
              ))}
            </select>
            {activeTab !== "expenses" && (
              <select value={topFilters.status} onChange={(e) => updateTopFilter("status", e.target.value)} className="rounded border px-3 py-2">
                {activeTab === "income" ? (
                  <>
                    <option value="">All payment methods</option>
                    {incomePaymentMethodOptions.map((method) => (
                      <option key={method} value={method}>{labelFor(paymentMethodLabels, method)}</option>
                    ))}
                  </>
                ) : (
                  <>
                    <option value="">All statuses</option>
                    {statusOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </>
                )}
              </select>
            )}
            {activeTab === "income" && (
              <input placeholder="Student name" value={incomeFilters.student} onChange={(e) => updateIncomeFilter("student", e.target.value)} className="rounded border px-3 py-2" />
            )}
            {activeTab === "expenses" && (
              <>
                <input placeholder="Search by title" value={expenseFilters.title} onChange={(e) => updateExpenseFilter("title", e.target.value)} className="rounded border px-3 py-2" />
                <select value={expenseFilters.category} onChange={(e) => updateExpenseFilter("category", e.target.value)} className="rounded border px-3 py-2">
                  <option value="">All categories</option>
                  {expenseCategories.map((category) => <option key={category} value={category}>{labelFor(expenseCategoryLabels, category)}</option>)}
                </select>
                <input type="number" placeholder="Minimum amount" value={expenseFilters.amount_min} onChange={(e) => updateExpenseFilter("amount_min", e.target.value)} className="rounded border px-3 py-2" />
                <input type="number" placeholder="Maximum amount" value={expenseFilters.amount_max} onChange={(e) => updateExpenseFilter("amount_max", e.target.value)} className="rounded border px-3 py-2" />
              </>
            )}
            {activeTab === "salaries" && (
              <select value={salaryFilters.teacher_id} onChange={(e) => updateSalaryFilter("teacher_id", e.target.value)} className="rounded border px-3 py-2">
                <option value="">All teachers</option>
                {teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}
              </select>
            )}
            <button type="button" onClick={generateCsv} className="rounded bg-[#152259] px-4 py-2 text-white hover:bg-[#152239]">Generate CSV</button>
            <button type="button" onClick={clearFilters} className="rounded border px-4 py-2">Clear Filters</button>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded border bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-600">Total Income</p>
            <strong className="text-2xl text-green-700">{money(summary.total_income)}</strong>
          </div>
          <div className="rounded border bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-600">Total Expenses</p>
            <strong className="text-2xl text-red-700">{money(summary.total_expenses)}</strong>
          </div>
          <div className="rounded border bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-600">Paid Teacher Salaries</p>
            <strong className="text-2xl text-orange-700">{money(summary.total_teacher_salaries)}</strong>
          </div>
          <div className="rounded border bg-white p-4 shadow-sm">
            <p className="text-sm text-gray-600">Net Profit / Loss</p>
            <strong className={Number(summary.net_profit) >= 0 ? "text-2xl text-green-700" : "text-2xl text-red-700"}>
              {money(summary.net_profit)}
            </strong>
          </div>
        </div>

        {message.text && (
          <p className={message.type === "success" ? "mb-4 text-green-600" : "mb-4 text-red-600"}>
            {message.text}
          </p>
        )}

        <div className="mb-5 flex flex-wrap gap-2">
          {[
            ["income", "Income"],
            ["expenses", "Expenses"],
            ["salaries", "Teacher Salaries"],
          ].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => changeTab(key)}
              className={`rounded border px-4 py-2 ${
                activeTab === key ? "border-[#152259] bg-[#152259] text-white" : "border-gray-300 bg-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === "income" && (
          <section>
            <h2 className="mb-3 text-xl font-semibold">Income from Student Payments</h2>
            <p className="mb-2 font-semibold">Filtered income: {money(incomeTotal)}</p>
            <table className="w-full border-collapse border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border p-2 text-left">Student</th>
                  <th className="border p-2 text-left">Course</th>
                  <th className="border p-2 text-left">Date</th>
                  <th className="border p-2 text-left">Method</th>
                  <th className="border p-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {incomeRows.map((row) => (
                  <tr key={row.id}>
                    <td className="border p-2">{row.student_name}</td>
                    <td className="border p-2">{row.course_title}</td>
                    <td className="border p-2">{row.payment_date}</td>
                    <td className="border p-2">{labelFor(paymentMethodLabels, row.payment_method)}</td>
                    <td className="border p-2 text-right">{incomeAmountDisplay(row)}</td>
                  </tr>
                ))}
                {incomeRows.length === 0 && <tr><td colSpan="5" className="p-4 text-center text-gray-500">No income found.</td></tr>}
              </tbody>
            </table>
            <PaginationControls pagination={incomePagination} onPageChange={setIncomePage} />
          </section>
        )}

        {activeTab === "expenses" && (
          <section>
            <h2 className="mb-3 text-xl font-semibold">Company Expenses</h2>
            <form onSubmit={saveExpense} className="mb-6 grid grid-cols-1 gap-3 rounded border bg-white p-4 md:grid-cols-2">
              <input placeholder="Expense title" value={expenseForm.title} onChange={(e) => updateExpenseForm("title", e.target.value)} className="rounded border px-3 py-2" required />
              <input placeholder="Invoice number" value={expenseForm.bill_number} onChange={(e) => updateExpenseForm("bill_number", e.target.value)} className="rounded border px-3 py-2" />
              <select value={expenseForm.category} onChange={(e) => updateExpenseForm("category", e.target.value)} className="rounded border px-3 py-2" required>
                {expenseCategories.map((category) => <option key={category} value={category}>{labelFor(expenseCategoryLabels, category)}</option>)}
              </select>
              <input type="number" min="0" step="0.01" placeholder="Amount" value={expenseForm.amount} onChange={(e) => updateExpenseForm("amount", e.target.value)} className="rounded border px-3 py-2" required />
              <input type="date" value={expenseForm.expense_date} onChange={(e) => updateExpenseForm("expense_date", e.target.value)} className="rounded border px-3 py-2" required />
              <div className="rounded border px-3 py-2">
                <span className="mb-2 block text-sm font-medium text-gray-700">Payment method</span>
                <div className="flex gap-2">
                  {expensePaymentMethods.map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => updateExpenseForm("payment_method", method)}
                      className={`rounded border px-4 py-1 text-sm font-medium ${
                        expenseForm.payment_method === method
                          ? "border-[#152259] bg-[#152259] text-white"
                          : "border-gray-300 bg-white text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>
              <textarea placeholder="Description / notes" value={expenseForm.description} onChange={(e) => updateExpenseForm("description", e.target.value)} className="rounded border px-3 py-2 md:col-span-2" />
              <div className="flex gap-2 md:col-span-2">
                <button className="rounded bg-[#152259] px-4 py-2 text-white">{expenseForm.id ? "Update expense" : "Create expense"}</button>
                {expenseForm.id && <button type="button" onClick={() => setExpenseForm(emptyExpense)} className="rounded border px-4 py-2">Cancel edit</button>}
              </div>
            </form>
            <p className="mb-2 font-semibold">Filtered expenses: {money(expensesTotal)}</p>
            <table className="w-full border-collapse border">
              <thead className="bg-gray-100"><tr><th className="border p-2 text-left">Title</th><th className="border p-2">Date</th><th className="border p-2">Category</th><th className="border p-2">Invoice</th><th className="border p-2 text-right">Amount</th><th className="border p-2">Actions</th></tr></thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id}>
                    <td className="border p-2">{expense.title}</td>
                    <td className="border p-2">{expense.expense_date}</td>
                    <td className="border p-2">{labelFor(expenseCategoryLabels, expense.category)}</td>
                    <td className="border p-2">{expense.bill_number || "-"}</td>
                    <td className="border p-2 text-right">
                      {money(expense.amount)}
                      {expense.payment_method ? (
                        <span className="ml-1 text-sm text-gray-600">
                          ({expense.payment_method})
                        </span>
                      ) : null}
                    </td>
                    <td className="border p-2"><button onClick={() => editExpense(expense)} className="mr-2 rounded bg-[#152259] px-3 py-1 text-white">Edit</button><button onClick={() => deleteExpense(expense.id)} className="rounded bg-red-600 px-3 py-1 text-white">Delete</button></td>
                  </tr>
                ))}
                {expenses.length === 0 && <tr><td colSpan="6" className="p-4 text-center text-gray-500">No expenses found.</td></tr>}
              </tbody>
            </table>
            <PaginationControls pagination={expensePagination} onPageChange={setExpensePage} />
          </section>
        )}

        {activeTab === "salaries" && (
          <section>
            <h2 className="mb-3 text-xl font-semibold">Teacher Salary Payments</h2>
            <form onSubmit={saveSalaryPayment} className="mb-6 grid grid-cols-1 gap-3 rounded border bg-white p-4 md:grid-cols-2">
              <select value={salaryForm.teacher_id} onChange={(e) => updateSalaryForm("teacher_id", e.target.value)} className="rounded border px-3 py-2" required>
                <option value="">Select teacher</option>
                {teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}
              </select>
              <select value={salaryForm.course_id} onChange={(e) => updateSalaryForm("course_id", e.target.value)} className="rounded border px-3 py-2" required>
                <option value="">Select teacher course</option>
                {relatedCourses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
              </select>
              <div className="grid gap-2 rounded border bg-gray-50 p-3 text-sm text-gray-700 md:col-span-2 md:grid-cols-2">
                <p>
                  <span className="font-semibold">Set full amount:</span>{" "}
                  {expectedForProjection === "" ? "Not set" : money(expectedForProjection)}
                </p>
                <p>
                  <span className="font-semibold">Remaining to pay:</span>{" "}
                  {remainingBeforePayment === null ? "-" : money(remainingBeforePayment)}
                </p>
              </div>
              <input type="number" min="0" step="0.01" placeholder={suggestedExpected ? `Full amount optional, previous ${suggestedExpected}` : "Full amount to pay (optional)"} value={salaryForm.expected_amount} onChange={(e) => updateSalaryForm("expected_amount", e.target.value)} className="rounded border px-3 py-2" />
              <input type="number" min="0" step="0.01" placeholder="Paid amount" value={salaryForm.paid_amount} onChange={(e) => updateSalaryForm("paid_amount", e.target.value)} className="rounded border px-3 py-2" required />
              <input type="date" value={salaryForm.payment_date} onChange={(e) => updateSalaryForm("payment_date", e.target.value)} className="rounded border px-3 py-2" required />
              <textarea placeholder="Notes" value={salaryForm.notes} onChange={(e) => updateSalaryForm("notes", e.target.value)} className="rounded border px-3 py-2 md:col-span-2" />
              <div className="flex gap-2 md:col-span-2">
                <button className="w-fit rounded bg-[#152259] px-4 py-2 text-white">
                  {salaryForm.id ? "Update salary payment" : "Register salary payment"}
                </button>
                {salaryForm.id && (
                  <button type="button" onClick={() => setSalaryForm(emptySalary)} className="rounded border px-4 py-2">
                    Cancel edit
                  </button>
                )}
              </div>
            </form>
            <p className="mb-2 font-semibold">Filtered paid salaries: {money(salaryTotal)}</p>
            <table className="w-full border-collapse border">
              <thead className="bg-gray-100"><tr><th className="border p-2 text-left">Professor</th><th className="border p-2 text-left">Course</th><th className="border p-2">Date</th><th className="border p-2 text-right">Expected</th><th className="border p-2 text-right">Paid</th><th className="border p-2">Status</th><th className="border p-2">Actions</th></tr></thead>
              <tbody>
                {salaryPayments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="border p-2">{payment.teacher_name}</td>
                    <td className="border p-2">{payment.course_title}</td>
                    <td className="border p-2">{payment.payment_date}</td>
                    <td className="border p-2 text-right">{optionalMoney(payment.expected_amount)}</td>
                    <td className="border p-2 text-right">{money(payment.paid_amount)}</td>
                    <td className="border p-2">{labelFor(salaryStatusLabels, payment.status)}</td>
                    <td className="border p-2">
                      <button onClick={() => editSalaryPayment(payment)} className="mr-2 rounded bg-[#152259] px-3 py-1 text-white">Edit</button>
                      <button onClick={() => deleteSalaryPayment(payment.id)} className="rounded bg-red-600 px-3 py-1 text-white">Delete</button>
                    </td>
                  </tr>
                ))}
                {salaryPayments.length === 0 && <tr><td colSpan="7" className="p-4 text-center text-gray-500">No salary payments found.</td></tr>}
              </tbody>
            </table>
            <PaginationControls pagination={salaryPagination} onPageChange={setSalaryPage} />
          </section>
        )}
      </div>
    </div>
  );
}
