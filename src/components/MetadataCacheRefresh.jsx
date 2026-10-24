import { useState } from "react";
import { apiRequest } from "../services/api.js";

export default function MetadataCacheRefresh() {
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function refreshCache() {
    setRefreshing(true);
    setMessage("");
    setError("");

    try {
      const result = await apiRequest(
        "/function-builder/record-details-cache/refresh",
        { method: "POST", body: JSON.stringify({}) },
      );
      setMessage(
        `Cached ${result.updated} of ${result.total} record types${
          result.failed ? `; ${result.failed} failed` : ""
        }.`,
      );
    } catch (requestError) {
      setError(`Cache refresh failed: ${requestError.message}`);
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <div className="metadata-cache-refresh">
      <button
        className="cache-refresh-button"
        onClick={refreshCache}
        disabled={refreshing}
      >
        {refreshing ? (
          <i className="spinner" />
        ) : (
          <span aria-hidden="true">↻</span>
        )}
        {refreshing ? "Refreshing cache…" : "Refresh NetSuite metadata"}
      </button>
      {(message || error) && (
        <p
          className={`cache-refresh-message ${error ? "is-error" : ""}`}
          role="status"
        >
          {error || message}
        </p>
      )}
    </div>
  );
}
