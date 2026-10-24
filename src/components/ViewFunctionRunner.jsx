import { useState } from "react";
import { apiRequest } from "../services/api.js";

function formatCell(value) {
  if (value === null || value === undefined) return "-";
  if (Array.isArray(value)) {
    return value.map(formatCell).filter((item) => item !== "-").join(", ") || "-";
  }
  if (typeof value === "object") {
    if (value.text !== null && value.text !== undefined && value.text !== "") {
      return formatCell(value.text);
    }
    if (value.value !== null && value.value !== undefined) {
      return formatCell(value.value);
    }
    return "-";
  }
  return String(value);
}

function getFieldValue(row, field) {
  return (
    row?.[field.id] ??
    row?.values?.[field.id] ??
    row?.fields?.[field.id] ??
    row?.[field.label] ??
    row?.values?.[field.label] ??
    null
  );
}

export default function ViewFunctionRunner({ config }) {
  const [filterValue, setFilterValue] = useState("");
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fields = Array.isArray(config.fields) ? config.fields : [];

  async function submitFilter(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResults(null);

    try {
      const data = await apiRequest(
        `/function-builder/functions/${encodeURIComponent(config._id)}/execute`,
        {
          method: "POST",
          body: JSON.stringify({ filterValue }),
        },
      );
      const payload = data?.data || data?.result || data;
      setResults(Array.isArray(payload?.results) ? payload.results : []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="view-runner" aria-label="Run view function">
      <form className="view-filter-form" onSubmit={submitFilter}>
        <label className="form-label" htmlFor="view-filter-value">
          Filter value <span>{config.filteredBy}</span>
          <input
            id="view-filter-value"
            className="text-input"
            value={filterValue}
            onChange={(event) => setFilterValue(event.target.value)}
            placeholder={`Enter ${config.filteredBy}`}
            required
          />
        </label>
        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? <i className="spinner" /> : null}
          {loading ? "Searching…" : "Submit"}
        </button>
      </form>

      {error && <p className="message error-message">{error}</p>}
      {results && (
        <div className="view-results">
          <h3>
            Matching records <span>{results.length}</span>
          </h3>
          {results.length ? (
            <div className="results-table-wrap">
              <table className="results-table">
                <thead>
                  <tr>
                    <th>Internal ID</th>
                    {fields.map((field) => (
                      <th key={field.id}>{field.label || field.id}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.map((row, index) => (
                    <tr key={`${row.id || "record"}-${index}`}>
                      <td>{formatCell(row.id ?? row.internalid ?? row.internalId)}</td>
                      {fields.map((field) => (
                        <td key={field.id}>{formatCell(getFieldValue(row, field))}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="muted">No records matched that filter value.</p>
          )}
        </div>
      )}
    </section>
  );
}
