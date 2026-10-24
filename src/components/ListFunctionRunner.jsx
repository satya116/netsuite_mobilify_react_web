import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "../services/api.js";

const PAGE_SIZE = 50;

function displayValue(value) {
  if (value === null || value === undefined || value === "") return "-";
  if (Array.isArray(value)) return value.map(displayValue).filter((item) => item !== "-").join(", ") || "-";
  if (typeof value === "object") return displayValue(value.text ?? value.value);
  return String(value);
}

export default function ListFunctionRunner({ config }) {
  const fields = Array.isArray(config.fields) ? config.fields : [];
  const [filterValue, setFilterValue] = useState("");
  const [results, setResults] = useState([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadPage = useCallback(async (nextPage, nextFilter) => {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest(
        `/function-builder/functions/${encodeURIComponent(config._id)}/execute-list`,
        {
          method: "POST",
          body: JSON.stringify({ filterValue: nextFilter, pageIndex: nextPage }),
        },
      );
      const payload = data?.data || data?.result || data;
      const rows = Array.isArray(payload?.results) ? payload.results : [];
      setResults(rows);
      setPageIndex(nextPage);
      setHasNext(rows.length === PAGE_SIZE);
    } catch (requestError) {
      setResults([]);
      setHasNext(false);
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, [config._id]);

  useEffect(() => {
    // Load the first page when the saved list function opens.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPage(0, "");
  }, [loadPage]);

  return (
    <section className="list-runner" aria-label="Run NetSuite list function">
      {config.filteredBy && (
        <form
          className="list-filter-form"
          onSubmit={(event) => {
            event.preventDefault();
            loadPage(0, filterValue);
          }}
        >
          <label className="form-label" htmlFor={`list-filter-${config._id}`}>
            Filter by {config.filteredBy}
            <input
              id={`list-filter-${config._id}`}
              className="text-input"
              value={filterValue}
              onChange={(event) => setFilterValue(event.target.value)}
              placeholder="Optional filter value"
            />
          </label>
          <button className="primary-button" type="submit" disabled={loading}>
            {loading ? <i className="spinner" /> : null}
            {loading ? "Loading…" : "Apply filter"}
          </button>
        </form>
      )}
      {error && <p className="message error-message" role="alert">{error}</p>}
      <div className="list-results">
        <h3>Records <span>{loading ? "Loading…" : results.length}</span></h3>
        {loading && !results.length ? (
          <div className="loading-state"><i className="spinner" /> Loading records…</div>
        ) : error ? null : results.length ? (
          <div className="results-table-wrap">
            <table className="results-table">
              <thead>
                <tr>
                  <th>Internal ID</th>
                  {fields.map((field) => <th key={field.id}>{field.label || field.id}</th>)}
                </tr>
              </thead>
              <tbody>
                {results.map((row, index) => (
                  <tr key={`${row.id || "record"}-${index}`}>
                    <td>{displayValue(row.id ?? row.internalid ?? row.internalId)}</td>
                    {fields.map((field) => (
                      <td key={field.id}>
                        {displayValue(row[field.id] ?? row.values?.[field.id] ?? row.fields?.[field.id] ?? row[field.label])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="muted">No records found.</p>
        )}
        <div className="list-pagination">
          <button type="button" className="text-button" onClick={() => loadPage(pageIndex - 1, filterValue)} disabled={loading || pageIndex === 0}>Previous</button>
          <span className="muted">Page {pageIndex + 1}</span>
          <button type="button" className="text-button" onClick={() => loadPage(pageIndex + 1, filterValue)} disabled={loading || !hasNext}>Next</button>
        </div>
      </div>
    </section>
  );
}
