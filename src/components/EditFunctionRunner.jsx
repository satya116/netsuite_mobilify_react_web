import { useState } from "react";
import { apiRequest } from "../services/api.js";

function displayValue(value) {
  if (value === null || value === undefined || value === "") return "-";
  if (Array.isArray(value)) return value.map(displayValue).filter((item) => item !== "-").join(", ") || "-";
  if (typeof value === "object") return displayValue(value.text || value.value);
  return String(value);
}

function rawValue(row, field) {
  const value = row?.[field.id] ?? row?.values?.[field.id] ?? row?.fields?.[field.id];
  return value && typeof value === "object" && !Array.isArray(value)
    ? value.value ?? value.text ?? ""
    : value ?? "";
}

function inputType(type) {
  const normalized = String(type || "").toLowerCase();
  if (["integer", "number", "currency", "float", "percent"].includes(normalized)) return "number";
  if (normalized === "date") return "date";
  if (normalized === "email") return "email";
  if (["phone", "phonenumber"].includes(normalized)) return "tel";
  return "text";
}

export default function EditFunctionRunner({ config }) {
  const fields = Array.isArray(config.fields) ? config.fields : [];
  const [filterValue, setFilterValue] = useState("");
  const [results, setResults] = useState([]);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [values, setValues] = useState({});
  const [searching, setSearching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function search(event) {
    event.preventDefault();
    setSearching(true);
    setError("");
    setNotice("");
    setSelectedRecord(null);
    setValues({});
    try {
      const response = await apiRequest(
        `/function-builder/functions/${encodeURIComponent(config._id)}/execute-edit-search`,
        { method: "POST", body: JSON.stringify({ filterValue }) },
      );
      const payload = response?.data || response?.result || response;
      setResults(Array.isArray(payload?.results) ? payload.results : []);
    } catch (requestError) {
      setResults([]);
      setError(requestError.message);
    } finally {
      setSearching(false);
    }
  }

  function chooseRecord(row) {
    setSelectedRecord(row);
    setValues(Object.fromEntries(fields.map((field) => {
      let value = rawValue(row, field);
      if (["checkbox", "boolean"].includes(String(field.type).toLowerCase())) {
        value = value === true || value === "true" || value === "T";
      } else if (String(field.type).toLowerCase() === "date" && value) {
        value = String(value).slice(0, 10);
      }
      return [field.id, value];
    })));
    setError("");
    setNotice("");
  }

  async function submit(event) {
    event.preventDefault();
    if (!selectedRecord) return;
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await apiRequest(
        `/function-builder/functions/${encodeURIComponent(config._id)}/execute-edit`,
        {
          method: "PUT",
          body: JSON.stringify({
            recordId: selectedRecord.id ?? selectedRecord.internalid ?? selectedRecord.internalId,
            values,
          }),
        },
      );
      setNotice(`Record ${response.recordId ?? selectedRecord.id} updated successfully.`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="edit-runner" aria-label="Edit NetSuite record">
      <form className="edit-search-form" onSubmit={search}>
        <label className="form-label" htmlFor={`edit-filter-${config._id}`}>
          Search by {config.filteredBy}
          <input
            id={`edit-filter-${config._id}`}
            className="text-input"
            value={filterValue}
            onChange={(event) => setFilterValue(event.target.value)}
            placeholder={`Enter ${config.filteredBy} to find a ${config.recordType}`}
            required
          />
        </label>
        <button className="primary-button" type="submit" disabled={searching || !config.filteredBy}>
          {searching ? <><i className="spinner" /> Searching…</> : "Search records"}
        </button>
      </form>

      {error && <p className="message error-message" role="alert">{error}</p>}
      {results.length > 0 && !selectedRecord && (
        <div className="edit-record-results">
          <h3>Matching records <span>{results.length}</span></h3>
          <div className="results-table-wrap">
            <table className="results-table">
              <thead><tr><th>Internal ID</th>{fields.map((field) => <th key={field.id}>{field.label || field.id}</th>)}<th /></tr></thead>
              <tbody>{results.map((row, index) => (
                <tr key={`${row.id ?? row.internalid ?? index}`}>
                  <td>{displayValue(row.id ?? row.internalid ?? row.internalId)}</td>
                  {fields.map((field) => <td key={field.id}>{displayValue(rawValue(row, field))}</td>)}
                  <td><button type="button" className="text-button" onClick={() => chooseRecord(row)}>Edit record</button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}
      {!searching && filterValue && results.length === 0 && !error && (
        <p className="muted edit-no-results">No matching {config.recordType} records found.</p>
      )}

      {selectedRecord && (
        <form className="edit-record-form" onSubmit={submit}>
          <div className="edit-record-heading">
            <div><h3>Edit {config.recordType} · {selectedRecord.id ?? selectedRecord.internalid}</h3><p className="muted">Update the configured fields, then save the record.</p></div>
            <button type="button" className="text-button" onClick={() => setSelectedRecord(null)}>Choose another record</button>
          </div>
          {fields.map((field) => {
            const type = String(field.type || "").toLowerCase();
            const checkbox = ["checkbox", "boolean"].includes(type);
            const longText = ["textarea", "longtext", "richtext"].includes(type);
            return (
              <label className={`form-label ${checkbox ? "checkbox-field" : ""}`} key={field.id}>
                {checkbox ? <>
                  <input type="checkbox" checked={Boolean(values[field.id])} onChange={(event) => setValues((current) => ({ ...current, [field.id]: event.target.checked }))} />
                  <span>{field.label || field.id}{field.isMandatory ? " *" : ""}</span>
                </> : <>
                  {field.label || field.id}{field.isMandatory ? " *" : ""}
                  {longText ? (
                    <textarea className="text-input" value={values[field.id] ?? ""} required={field.isMandatory} onChange={(event) => setValues((current) => ({ ...current, [field.id]: event.target.value }))} />
                  ) : (
                    <input className="text-input" type={inputType(field.type)} step={type === "integer" ? "1" : ["number", "float", "currency", "percent"].includes(type) ? "any" : undefined} value={values[field.id] ?? ""} required={field.isMandatory} onChange={(event) => setValues((current) => ({ ...current, [field.id]: event.target.value }))} />
                  )}
                </>}
                <small className="create-field-id">{field.id}</small>
              </label>
            );
          })}
          {!fields.length && <p className="muted">No fields are configured for this Edit function.</p>}
          <button className="primary-button" type="submit" disabled={saving || !fields.length}>
            {saving ? <><i className="spinner" /> Saving…</> : "Save changes"}
          </button>
        </form>
      )}
      {notice && <p className="message success-message" role="status">{notice}</p>}
    </section>
  );
}
