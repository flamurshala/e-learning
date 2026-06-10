import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import AdminNav from "./AdminNav";

export default function InvoiceSettings({ variant = "invoice" }) {
  const navigate = useNavigate();
  const isVerification = variant === "verification";
  const config = isVerification
    ? {
        title: "Payment Verification Settings",
        settingsEndpoint: "get_payment_verification_settings.php",
        nextNumberEndpoint: "get_next_payment_verification_number.php",
        updateSequenceEndpoint: "update_payment_verification_sequence.php",
        addOptionEndpoint: "add_payment_verification_description_option.php",
        deleteOptionEndpoint: "delete_payment_verification_description_option.php",
        numberLabel: "Next Verification Number",
      }
    : {
        title: "Invoice Settings",
        settingsEndpoint: "get_invoice_settings.php",
        nextNumberEndpoint: "get_next_invoice_number.php",
        updateSequenceEndpoint: "update_invoice_sequence.php",
        addOptionEndpoint: "add_invoice_description_option.php",
        deleteOptionEndpoint: "delete_invoice_description_option.php",
        numberLabel: "Next Invoice Number",
      };
  const [options, setOptions] = useState([]);
  const [newOption, setNewOption] = useState("");
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });

  const loadSettings = useCallback(() => {
    axios
      .get(`${process.env.REACT_APP_API_URL}/${config.settingsEndpoint}`)
      .then((res) => {
        setOptions(res.data?.description_options || []);
      })
      .catch(() =>
        setMessage({ text: "Could not load settings.", type: "error" })
      );

    axios
      .get(`${process.env.REACT_APP_API_URL}/${config.nextNumberEndpoint}`)
      .then((res) => {
        if (res.data?.document_number || res.data?.invoice_number) {
          setNextInvoiceNumber(res.data.document_number || res.data.invoice_number);
        }
      })
      .catch(() =>
        setMessage({ text: "Could not load the next number.", type: "error" })
      );
  }, [config.nextNumberEndpoint, config.settingsEndpoint]);

  useEffect(() => {
    document.title = `${config.title} - Tectigon Academy`;
    loadSettings();
  }, [config.title, loadSettings]);

  const addOption = (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });

    axios
      .post(`${process.env.REACT_APP_API_URL}/${config.addOptionEndpoint}`, {
        label: newOption,
      })
      .then((res) => {
        if (res.data?.success) {
          setNewOption("");
          setMessage({ text: "Option added.", type: "success" });
          loadSettings();
        } else {
          setMessage({
            text: res.data?.error || "Could not add option.",
            type: "error",
          });
        }
      })
      .catch(() => setMessage({ text: "Could not add option.", type: "error" }));
  };

  const deleteOption = (id) => {
    if (!window.confirm("Remove this option from the list?")) return;
    setMessage({ text: "", type: "" });

    axios
      .post(`${process.env.REACT_APP_API_URL}/${config.deleteOptionEndpoint}`, {
        id,
      })
      .then((res) => {
        if (res.data?.success) {
          setMessage({ text: "Option removed.", type: "success" });
          loadSettings();
        } else {
          setMessage({
            text: res.data?.error || "Could not remove option.",
            type: "error",
          });
        }
      })
      .catch(() =>
        setMessage({ text: "Could not remove option.", type: "error" })
      );
  };

  const saveInvoiceNumber = (e) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });

    axios
      .post(`${process.env.REACT_APP_API_URL}/${config.updateSequenceEndpoint}`, {
        invoice_number: nextInvoiceNumber,
      })
      .then((res) => {
        if (res.data?.success) {
          setNextInvoiceNumber(res.data.document_number || res.data.invoice_number);
          setMessage({ text: `${config.numberLabel} updated.`, type: "success" });
        } else {
          setMessage({
            text: res.data?.error || "Could not update invoice number.",
            type: "error",
          });
        }
      })
      .catch(() =>
        setMessage({ text: "Could not update the number.", type: "error" })
      );
  };

  return (
    <div className="flex gap-4">
      <AdminNav />
      <div className="ml-[22%] mt-10 w-[75%]">
        <div className="max-w-2xl rounded border border-gray-300 bg-white p-6 shadow-md">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-semibold">{config.title}</h1>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="rounded bg-[#152259] px-4 py-2 text-white hover:bg-[#152239]"
            >
              Back
            </button>
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

          <form onSubmit={saveInvoiceNumber} className="mb-8 rounded border border-gray-200 p-4">
            <label className="mb-2 block font-medium">{config.numberLabel}</label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                value={nextInvoiceNumber}
                onChange={(e) => setNextInvoiceNumber(e.target.value)}
                className="flex-1 rounded border px-3 py-2"
                placeholder="001/2026"
                required
              />
              <button
                type="submit"
                className="rounded bg-[#152259] px-4 py-2 text-white hover:bg-[#152239]"
              >
                Save
              </button>
            </div>
          </form>

          <h2 className="mb-3 text-lg font-semibold">Description Options</h2>
          <form onSubmit={addOption} className="mb-6 flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={newOption}
              onChange={(e) => setNewOption(e.target.value)}
              className="flex-1 rounded border px-3 py-2"
              placeholder="Add a description option"
              required
            />
            <button
              type="submit"
              className="rounded bg-[#152259] px-4 py-2 text-white hover:bg-[#152239]"
            >
              Add
            </button>
          </form>

          <div className="overflow-hidden rounded border border-gray-200">
            {options.length === 0 ? (
              <p className="p-4 text-gray-500">No invoice options yet.</p>
            ) : (
              options.map((option) => (
                <div
                  key={option.id}
                  className="flex items-center justify-between border-b border-gray-200 px-4 py-3 last:border-b-0"
                >
                  <span>{option.label}</span>
                  <button
                    type="button"
                    onClick={() => deleteOption(option.id)}
                    className="rounded bg-red-600 px-3 py-1 text-white hover:bg-red-800"
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
