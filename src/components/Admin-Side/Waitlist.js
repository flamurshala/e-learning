import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminNav from "./AdminNav";
import { getCurrentAdminActor } from "../../utils/currentAdmin";

export default function Waitlist() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [courseId, setCourseId] = useState("");
  const [amountToPay, setAmountToPay] = useState("");
  const [extraNote, setExtraNote] = useState("");
  const [formMsg, setFormMsg] = useState("");
  const [formMsgType, setFormMsgType] = useState("");

  const [filterCourse, setFilterCourse] = useState("");
  const [filterName, setFilterName] = useState("");
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [removingIds, setRemovingIds] = useState(() => new Set());
  const [cancelingIds, setCancelingIds] = useState(() => new Set());
  const [waitlistMsg, setWaitlistMsg] = useState("");
  const [waitlistMsgType, setWaitlistMsgType] = useState("");

  const api = process.env.REACT_APP_API_URL;

  const loadWaitlist = useCallback(() => {
    setLoading(true);
    fetch(`${api}/get_waitlist.php`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setRows([]);
          setError(data.error);
        } else {
          setRows(Array.isArray(data) ? data : []);
          setError("");
        }
      })
      .catch(() => {
        setRows([]);
        setError("Nuk u arrit të ngarkohet lista e pritjes.");
      })
      .finally(() => setLoading(false));
  }, [api]);

  useEffect(() => {
    document.title = "Lista e pritjes së studentëve - Tectigon Academy";

    fetch(`${api}/get_course.php?active_only=1`)
      .then((res) => res.json())
      .then((data) => setCourses(Array.isArray(data) ? data : []))
      .catch(() => setCourses([]));

    loadWaitlist();
  }, [api, loadWaitlist]);

  const courseOptions = useMemo(() => {
    const opts = [{ id: "", title: "Të gjitha kurset" }];
    courses.forEach((c) => opts.push({ id: String(c.id), title: c.title }));
    return opts;
  }, [courses]);

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      const byCourse =
        !filterCourse || String(r.course_id) === filterCourse;
      const full = `${r.name || ""} ${r.surname || ""}`.toLowerCase();
      const byName =
        !filterName.trim() ||
        full.includes(filterName.trim().toLowerCase());
      return byCourse && byName;
    });
  }, [rows, filterCourse, filterName]);

  const handleAddWaitlist = (e) => {
    e.preventDefault();
    setFormMsg("");
    setFormMsgType("");
    if (!courseId) {
      setFormMsg("Please select a training course.");
      setFormMsgType("error");
      return;
    }

    fetch(`${api}/add_waitlist.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        surname,
        email,
        phone_number: phone,
        course_id: parseInt(courseId, 10),
        amount_to_pay: amountToPay,
        extra_note: extraNote,
        actor: getCurrentAdminActor(),
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setFormMsg("Regjistrimi u shtua në listën e pritjes.");
          setFormMsgType("success");
          setName("");
          setSurname("");
          setEmail("");
          setPhone("");
          setCourseId("");
          setAmountToPay("");
          setExtraNote("");
          loadWaitlist();
        } else {
          setFormMsg(data.error || "Could not save.");
          setFormMsgType("error");
        }
      })
      .catch(() => {
        setFormMsg("Gabim rrjeti.");
        setFormMsgType("error");
      });
  };

  const goRegister = (entry) => {
    navigate("/AddUsers", {
      state: {
        fromWaitlist: true,
        waitlistIds: [entry.id],
        name: entry.name,
        surname: entry.surname,
        email: entry.email,
        phoneNumber: entry.phone_number,
        courseId: String(entry.course_id),
        amountToPay: entry.amount_to_pay || "",
        notes: entry.extra_note || "",
      },
    });
  };

  const toggleRow = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const removeFromWaitlist = (entry) => {
    const fullName = `${entry.name || ""} ${entry.surname || ""}`.trim();
    if (
      !window.confirm(
        `A jeni i sigurt që dëshironi të hiqni ${fullName || "këtë student"} nga lista e pritjes?`
      )
    ) {
      return;
    }

    setWaitlistMsg("");
    setWaitlistMsgType("");
    setRemovingIds((prev) => new Set(prev).add(entry.id));
    fetch(`${api}/delete_waitlist.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: entry.id, actor: getCurrentAdminActor() }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) {
          setWaitlistMsg(data.error || "Nuk u arrit të hiqet regjistrimi nga lista e pritjes.");
          setWaitlistMsgType("error");
          return;
        }

        setRows((prev) => prev.filter((row) => row.id !== entry.id));
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(entry.id);
          return next;
        });
        setWaitlistMsg(
          `${fullName || "Studenti"} u hoq nga lista e pritjes.`
        );
        setWaitlistMsgType("success");
      })
      .catch(() => {
        setWaitlistMsg("Gabim rrjeti gjatë heqjes nga lista e pritjes.");
        setWaitlistMsgType("error");
      })
      .finally(() => {
        setRemovingIds((prev) => {
          const next = new Set(prev);
          next.delete(entry.id);
          return next;
        });
      });
  };

  const cancelWaitlistEntry = (entry) => {
    const fullName = `${entry.name || ""} ${entry.surname || ""}`.trim();
    if (
      !window.confirm(
        `Save ${fullName || "this student"} to the canceled list and remove them from the waitlist?`
      )
    ) {
      return;
    }

    setWaitlistMsg("");
    setWaitlistMsgType("");
    setCancelingIds((prev) => new Set(prev).add(entry.id));

    fetch(`${api}/cancel_waitlist_student.php`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: entry.id, actor: getCurrentAdminActor() }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!data.success) {
          setWaitlistMsg(data.error || "Could not save the student to the canceled list.");
          setWaitlistMsgType("error");
          return;
        }

        setRows((prev) => prev.filter((row) => row.id !== entry.id));
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(entry.id);
          return next;
        });
        setWaitlistMsg(`${fullName || "Student"} was saved to the canceled list.`);
        setWaitlistMsgType("success");
      })
      .catch(() => {
        setWaitlistMsg("Network error while saving the student to the canceled list.");
        setWaitlistMsgType("error");
      })
      .finally(() => {
        setCancelingIds((prev) => {
          const next = new Set(prev);
          next.delete(entry.id);
          return next;
        });
      });
  };

  const goRegisterSelected = () => {
    const selected = rows.filter((r) => selectedIds.has(r.id));
    setWaitlistMsg("");
    setWaitlistMsgType("");
    if (selected.length === 0) {
      setWaitlistMsg("Zgjidh të paktën një rresht nga lista e pritjes.");
      setWaitlistMsgType("error");
      return;
    }
    const emails = new Set(
      selected.map((r) => String(r.email || "").trim().toLowerCase())
    );
    if (emails.size !== 1) {
      setWaitlistMsg(
        "Regjistrimi në grup kërkon të njëjtin email në çdo rresht të zgjedhur (një student, disa kurse)."
      );
      setWaitlistMsgType("error");
      return;
    }

    const byCourse = new Map();
    for (const r of selected) {
      const cid = String(r.course_id);
      if (!byCourse.has(cid)) {
        byCourse.set(cid, { ...r });
      } else {
        const prev = byCourse.get(cid);
        const n1 = (prev.extra_note || "").trim();
        const n2 = (r.extra_note || "").trim();
        const merged = [n1, n2].filter(Boolean).join(" | ");
        byCourse.set(cid, {
          ...prev,
          amount_to_pay: prev.amount_to_pay || r.amount_to_pay || "",
          extra_note: merged,
        });
      }
    }

    const deduped = Array.from(byCourse.values());
    const first = selected[0];

    navigate("/AddUsers", {
      state: {
        fromWaitlist: true,
        bulk: true,
        waitlistIds: selected.map((r) => r.id),
        name: first.name,
        surname: first.surname,
        email: first.email,
        phoneNumber: first.phone_number,
        courseNotes: deduped.map((r) => ({
          courseId: String(r.course_id),
          amountToPay: r.amount_to_pay || "",
          notes: r.extra_note || "",
        })),
      },
    });
  };

  return (
    <div className="flex gap-4">
      <AdminNav />
      <div className="mt-4 ml-[22%] w-[75%] pb-10">
        <h1 className="text-2xl font-semibold border-b-2 border-[#c2c2c2] w-[95%] mb-6">
          Lista e pritjes së studentëve
        </h1>
        <p className="text-gray-600 mb-6 max-w-3xl">
          Shto studentë që nuk janë regjistruar plotësisht ende. Përdor{" "}
          <strong>Regjistro</strong> për një kurs, ose zgjidh disa rreshta
          (i njëjti email, kurse të ndryshme) dhe përdor{" "}
          <strong>Regjistro të zgjedhurat</strong> për të hapur shtimin e
          studentit me të gjitha kurset menjëherë. Nëse emaili ekziston tashmë
          në sistem, studentit i shtohen vetëm kurset e reja.
        </p>

        <div className="border shadow-md border-gray-400 rounded p-6 mb-10 max-w-xl bg-white">
          <h2 className="text-xl font-semibold mb-4">Shto në listën e pritjes</h2>
          {formMsg && (
            <p
              className={
                formMsgType === "success"
                  ? "text-green-600 mb-3"
                  : "text-red-600 mb-3"
              }
            >
              {formMsg}
            </p>
          )}
          <form onSubmit={handleAddWaitlist} className="space-y-3">
            <input
              className="w-full border border-black p-2"
              placeholder="Emri"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <input
              className="w-full border border-black p-2"
              placeholder="Mbiemri"
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
              required
            />
            <input
              className="w-full border border-black p-2"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              className="w-full border border-black p-2"
              placeholder="Numri i telefonit"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <label className="block font-semibold">Training course</label>
            <select
              className="w-full border border-black p-2"
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              required
            >
              <option value="">— Zgjidh kursin —</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
            <label className="block font-semibold">Shuma për t’u paguar</label>
            <input
              className="w-full border border-black p-2"
              type="number"
              min="0"
              step="0.01"
              placeholder="Shuma për t’u paguar"
              value={amountToPay}
              onChange={(e) => setAmountToPay(e.target.value)}
            />
            <label className="block font-semibold">Shënim shtesë</label>
            <textarea
              className="w-full border border-black p-2"
              rows={3}
              placeholder="Shënime opsionale"
              value={extraNote}
              onChange={(e) => setExtraNote(e.target.value)}
            />
            <button
              type="submit"
              className="bg-[#152259] text-white px-4 py-2 rounded hover:bg-[#152239]"
            >
             Shto në listën e pritjes
            </button>
          </form>
        </div>

        <h2 className="text-xl font-semibold mb-3">Lista e pritjes</h2>
        <div className="flex flex-wrap gap-4 mb-4 items-end">
          <div>
            <label className="block text-sm font-medium mb-1">
             Filtro sipas kursite
            </label>
            <select
              className="border border-black p-2 min-w-[200px]"
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
            >
              {courseOptions.map((c) => (
                <option key={c.id || "all"} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Filtro sipas emrit të studentit
            </label>
            <input
              className="border border-black p-2 w-64"
              placeholder="Emri ose mbiemri"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="bg-[#152259] hover:bg-[#152239] text-white px-4 py-2 rounded text-sm font-semibold disabled:opacity-50"
            disabled={selectedIds.size === 0}
            onClick={goRegisterSelected}
          >
            Regjistro të zgjedhurat ({selectedIds.size})
          </button>
          <button
            type="button"
            className="border border-gray-500 px-3 py-2 rounded text-sm"
            onClick={() => setSelectedIds(new Set())}
          >
           Clear selection
          </button>
        </div>
        {waitlistMsg && (
          <p
            className={
              waitlistMsgType === "success"
                ? "text-green-600 mb-4"
                : "text-red-600 mb-4"
            }
          >
            {waitlistMsg}
          </p>
        )}

        {loading ? (
          <p>Duke ngarkuar…</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : (
          <div className="overflow-x-auto border border-gray-300 rounded">
            <table className="w-full border-collapse text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border p-2 w-10"> </th>
                  <th className="border p-2 text-left">Emri</th>
                  <th className="border p-2 text-left">Mbiemri</th>
                  <th className="border p-2 text-left">Email</th>
                  <th className="border p-2 text-left">Telefoni</th>
                  <th className="border p-2 text-left">Kursi</th>
                  <th className="border p-2 text-left">Shuma</th>
                  <th className="border p-2 text-left">Shënim</th>
                  <th className="border p-2 text-left">Shtuar më</th>
                  <th className="border p-2 text-left"> </th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-4 text-center text-gray-500">
                     Asnjë regjistrim nuk përputhet me filtrat.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((r) => (
                    <tr key={r.id}>
                      <td className="border p-2 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(r.id)}
                          onChange={() => toggleRow(r.id)}
                          aria-label={`Zgjidh ${r.name} ${r.surname}`}
                        />
                      </td>
                      <td className="border p-2">{r.name}</td>
                      <td className="border p-2">{r.surname}</td>
                      <td className="border p-2">{r.email}</td>
                      <td className="border p-2">{r.phone_number}</td>
                      <td className="border p-2">{r.course_title}</td>
                      <td className="border p-2">
                        {r.amount_to_pay !== null && r.amount_to_pay !== undefined && r.amount_to_pay !== ""
                          ? `${Number(r.amount_to_pay).toFixed(2)} €`
                          : "—"}
                      </td>
                      <td className="border p-2 max-w-[180px] whitespace-pre-wrap">
                        {r.extra_note || "—"}
                      </td>
                      <td className="border p-2 whitespace-nowrap">
                        {r.created_at
                          ? new Date(r.created_at).toLocaleString()
                          : "—"}
                      </td>
                      <td className="border p-2">
                        <div className="flex gap-2 whitespace-nowrap">
                          <button
                            type="button"
                            className="bg-[#152259] hover:bg-[#152239] text-white px-3 py-1 rounded text-xs font-semibold"
                            onClick={() => goRegister(r)}
                          >
                           Regjistro
                          </button>
                          <button
                            type="button"
                            className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-xs font-semibold disabled:opacity-50"
                            disabled={cancelingIds.has(r.id)}
                            onClick={() => cancelWaitlistEntry(r)}
                          >
                            {cancelingIds.has(r.id) ? "Saving..." : "Anuluar"}
                          </button>
                          <button
                            type="button"
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-semibold disabled:opacity-50"
                            disabled={removingIds.has(r.id)}
                            onClick={() => removeFromWaitlist(r)}
                          >
                            {removingIds.has(r.id) ? "Duke hequr..." : "Hiq"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
