import { useState } from "react";
import { apiRequest } from "../services/api.js";

function formatCell(value) {
  if (value === null || value === undefined) return "-";
  if (typeof value === "object") return value.text ?? value.value ?? "-";
  return String(value);
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
      setResults(Array.isArray(data.results) ? data.results : []);
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
                      <td>{row.id || "-"}</td>
                      {fields.map((field) => (
                        <td key={field.id}>{formatCell(row[field.id])}</td>
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
