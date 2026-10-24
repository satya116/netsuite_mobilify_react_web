import { useEffect, useMemo, useRef, useState } from "react";
import { apiRequest } from "../services/api.js";

export default function MetadataCacheRefresh({ onBack }) {
  const [recordTypes, setRecordTypes] = useState([]);
  const [recordType, setRecordType] = useState("__all__");
  const [recordSearch, setRecordSearch] = useState("All record types");
  const [recordMenuOpen, setRecordMenuOpen] = useState(false);
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const pickerRef = useRef(null);

  const filteredRecordTypes = useMemo(
    () => recordTypes.filter((item) =>
      `${item.label} ${item.id}`.toLowerCase().includes(recordSearch.toLowerCase()),
    ),
    [recordSearch, recordTypes],
  );

  useEffect(() => {
    let mounted = true;
    apiRequest("/function-builder/record-types")
      .then((data) => {
        const types = Array.isArray(data) ? data : data?.recordTypes || [];
        if (mounted) {
          setRecordTypes(
            types
              .map((item) => ({
                id: String(item.id ?? item.value ?? item.recordType ?? ""),
                label: String(item.label ?? item.text ?? item.name ?? item.id ?? ""),
              }))
              .filter((item) => item.id),
          );
        }
      })
      .catch((requestError) => {
        if (mounted) setError(`Unable to load record types: ${requestError.message}`);
      })
      .finally(() => {
        if (mounted) setLoadingTypes(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    function closePicker(event) {
      if (!pickerRef.current?.contains(event.target)) setRecordMenuOpen(false);
    }
    document.addEventListener("mousedown", closePicker);
    return () => document.removeEventListener("mousedown", closePicker);
  }, []);

  async function submit(event) {
    event.preventDefault();
    setRefreshing(true);
    setResult(null);
    setError("");
    try {
      const data = await apiRequest(
        "/function-builder/record-details-cache/refresh",
        {
          method: "POST",
          body: JSON.stringify(recordType === "__all__" ? {} : { recordType }),
        },
      );
      setResult(data);
    } catch (requestError) {
      setError(`Metadata update failed: ${requestError.message}`);
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="page-view metadata-page">
      <button className="back-button" onClick={onBack}>
        <span>‹</span> Home
      </button>
      <div className="page-title-row">
        <div>
          <p className="eyebrow">NETSUITE ADMINISTRATION</p>
          <h1>NetSuite Metadata</h1>
          <p className="muted">Update record type field metadata in the cache.</p>
        </div>
        <span className="large-type-icon" aria-hidden="true">↻</span>
      </div>

      <form className="form-panel metadata-form" onSubmit={submit}>
        <div className="form-label record-picker" ref={pickerRef}>
          <label htmlFor="metadata-record-type">Record type</label>
          <input
            id="metadata-record-type"
            className="text-input"
            role="combobox"
            aria-expanded={recordMenuOpen}
            aria-autocomplete="list"
            aria-controls="metadata-record-type-options"
            value={recordSearch}
            onFocus={() => setRecordMenuOpen(true)}
            onChange={(event) => {
              setRecordSearch(event.target.value);
              setRecordType("");
              setRecordMenuOpen(true);
            }}
            placeholder={loadingTypes ? "Loading record types…" : "Search record types"}
            disabled={loadingTypes || refreshing}
          />
          {recordMenuOpen && !loadingTypes && (
            <div id="metadata-record-type-options" className="record-menu" role="listbox">
              <button
                type="button"
                role="option"
                aria-selected={recordType === "__all__"}
                onClick={() => {
                  setRecordType("__all__");
                  setRecordSearch("All record types");
                  setRecordMenuOpen(false);
                }}
              >All record types</button>
              {filteredRecordTypes.length ? filteredRecordTypes.map((item) => (
                <button
                  type="button"
                  role="option"
                  aria-selected={recordType === item.id}
                  key={item.id}
                  onClick={() => {
                    setRecordType(item.id);
                    setRecordSearch(`${item.label} · ${item.id}`);
                    setRecordMenuOpen(false);
                  }}
                >
                  {item.label}<small>{item.id}</small>
                </button>
              )) : <p>No matching record types.</p>}
            </div>
          )}
        </div>
        <div className="metadata-submit-row">
          <span className="muted">
            {recordType === "__all__" ? `${recordTypes.length} available record types` : recordType ? `Selected: ${recordType}` : "Choose a matching record type"}
          </span>
          <button className="primary-button" type="submit" disabled={refreshing || loadingTypes || !recordType}>
            {refreshing ? <><i className="spinner" /> Updating…</> : "Update metadata"}
          </button>
        </div>
      </form>

      {error && <p className="message error-message" role="alert">{error}</p>}
      {result && (
        <div className={`message ${result.failed ? "error-message" : "success-message"}`} role="status">
          Updated {result.updated} of {result.total} record types; {result.failed} failed.
          {result.failures?.length > 0 && (
            <ul className="metadata-failures">
              {result.failures.map((failure) => (
                <li key={failure.recordType}>{failure.recordType}: {failure.message}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
