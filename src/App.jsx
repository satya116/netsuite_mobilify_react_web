import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiRequest } from "./services/api.js";
import MetadataCacheRefresh from "./components/MetadataCacheRefresh.jsx";
import "./App.css";

const FUNCTION_TYPES = [
  { id: "view", title: "View", subtitle: "Single record screen", icon: "◉" },
  { id: "create", title: "Create", subtitle: "New record form", icon: "+" },
  { id: "list", title: "List", subtitle: "Search result layout", icon: "▤" },
  { id: "edit", title: "Edit", subtitle: "Update record fields", icon: "✎" },
];

function App() {
  const [activeTab, setActiveTab] = useState("Home");
  const [page, setPage] = useState({ type: "home" });
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("mobilify-theme") === "dark" ? "dark" : "light";
    } catch {
      return "light";
    }
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("mobilify-theme", theme);
    } catch {
      // Theme remains active for this session when storage is unavailable.
    }
  }, [theme]);

  const openBuilder = (functionType) =>
    setPage({ type: "builder", functionType });
  const openFunctions = (functionType) =>
    setPage({ type: "functions", functionType });
  const returnHome = () => setPage({ type: "home" });

  const tabPages = {
    Home:
      page.type === "home" ? (
        <HomeScreen openBuilder={openBuilder} openFunctions={openFunctions} />
      ) : null,
    Search: (
      <SimpleScreen
        title="Search"
        description="Search your NetSuite records."
        icon="⌕"
      />
    ),
    Scan: (
      <SimpleScreen
        title="Scan"
        description="Scan a code to find a NetSuite record."
        icon="▦"
      />
    ),
    Sync: (
      <SimpleScreen
        title="Sync"
        description="Review synchronization status."
        icon="↻"
      />
    ),
    Profile: (
      <SimpleScreen
        title="Profile"
        description="Your Suite Mobilify account."
        icon="●"
      />
    ),
  };

  let content = tabPages[activeTab];
  if (page.type === "builder") {
    content = (
      <FunctionBuilder
        key={page.functionType}
        functionType={page.functionType}
        onBack={returnHome}
      />
    );
  } else if (page.type === "functions") {
    content = (
      <SavedFunctions
        key={page.functionType}
        functionType={page.functionType}
        onBack={returnHome}
      />
    );
  }

  return (
    <div className="app-shell" data-theme={theme}>
      <header className="topbar">
        <button
          className="brand"
          onClick={() => {
            setActiveTab("Home");
            returnHome();
          }}
          aria-label="Suite Mobilify home"
        >
          <span className="brand-mark">M</span>
          <span className="brand-copy">
            <strong>Suite Mobilify</strong>
            <small>NetSuite workspace</small>
          </span>
        </button>
        <div className="topbar-actions">
          <span className="connection-status">
            <i /> API workspace
          </span>
          <button
            className="theme-toggle"
            onClick={() => setTheme((current) => current === "light" ? "dark" : "light")}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            {theme === "light" ? "☾" : "☀"}
          </button>
          <button
            className="avatar"
            aria-label="Profile"
            onClick={() => setActiveTab("Profile")}
          >
            S
          </button>
        </div>
      </header>

      <main className="main-content">{content}</main>

      {page.type === "home" && (
        <nav className="bottom-nav" aria-label="Main navigation">
          {[
            ["Home", "⌂"],
            ["Search", "⌕"],
            ["Scan", "▦"],
            ["Sync", "↻"],
            ["Profile", "●"],
          ].map(([label, icon]) => (
            <button
              key={label}
              className={`nav-item ${activeTab === label ? "active" : ""}`}
              onClick={() => setActiveTab(label)}
            >
              <span className="nav-icon">{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}

function HomeScreen({ openBuilder, openFunctions }) {
  const [query, setQuery] = useState("");
  return (
    <div className="home-view">
      <div className="welcome-row">
        <div>
          <p className="eyebrow">WORKSPACE</p>
          <h1>Good to see you</h1>
          <p className="muted">Build and use your NetSuite mobile functions.</p>
        </div>
        <MetadataCacheRefresh />
      </div>

      <label className="search-box">
        <span aria-hidden="true">⌕</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Find a function or record type"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </label>

      <FunctionGroup
        title="Create Functions"
        subtitle="Configure a new function for a NetSuite record."
        items={FUNCTION_TYPES}
        query={query}
        onSelect={openBuilder}
        mode="create"
      />
      <FunctionGroup
        title="Created Functions"
        subtitle="Open saved configurations stored in MongoDB."
        items={FUNCTION_TYPES}
        query={query}
        onSelect={openFunctions}
        mode="saved"
      />
      <p className="home-footnote">
        Record types and field details load from the Node service cache.
      </p>
    </div>
  );
}

function FunctionGroup({ title, subtitle, items, query, onSelect, mode }) {
  const shown = items.filter((item) =>
    `${item.title} ${item.subtitle}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  if (!shown.length) return null;
  return (
    <section className="function-section">
      <div className="section-heading">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <span className="section-count">{shown.length}</span>
      </div>
      <div className="function-grid">
        {shown.map((item) => (
          <button
            className="function-tile"
            key={item.id}
            onClick={() => onSelect(item.id)}
          >
            <span className={`tile-icon icon-${item.id}`}>{item.icon}</span>
            <span className="tile-text">
              <strong>{item.title}</strong>
              <small>
                {mode === "create"
                  ? item.subtitle
                  : `Saved ${item.title.toLowerCase()} configurations`}
              </small>
            </span>
            <span className="tile-arrow" aria-hidden="true">
              ›
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function FunctionBuilder({ functionType, onBack }) {
  const typeInfo =
    FUNCTION_TYPES.find((item) => item.id === functionType) ||
    FUNCTION_TYPES[0];
  const [functionName, setFunctionName] = useState("");
  const [recordTypes, setRecordTypes] = useState([]);
  const [recordType, setRecordType] = useState(null);
  const [recordSearch, setRecordSearch] = useState("");
  const [recordMenuOpen, setRecordMenuOpen] = useState(false);
  const [fields, setFields] = useState([]);
  const selectedIds = useRef(new Set());
  const fieldRequestId = useRef(0);
  const [filteredBy, setFilteredBy] = useState("");
  const [fieldQuery, setFieldQuery] = useState("");
  const [loadingTypes, setLoadingTypes] = useState(true);
  const [loadingFields, setLoadingFields] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selectedCount, setSelectedCount] = useState(0);
  const [selectionRevision, setSelectionRevision] = useState(0);
  const recordMenuRef = useRef(null);

  useEffect(() => {
    let mounted = true;
    apiRequest("/function-builder/record-types")
      .then((data) => {
        const records = Array.isArray(data) ? data : data?.recordTypes || [];
        if (mounted)
          setRecordTypes(
            records
              .map((record) => ({
                id: String(
                  record.id ??
                    record.value ??
                    record.recordType ??
                    record.name ??
                    "",
                ),
                label: String(
                  record.label ?? record.text ?? record.name ?? record.id ?? "",
                ),
              }))
              .filter((record) => record.id),
          );
      })
      .catch((requestError) => {
        if (mounted)
          setError(`Unable to load record types: ${requestError.message}`);
      })
      .finally(() => {
        if (mounted) setLoadingTypes(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const closeMenu = (event) => {
      if (!recordMenuRef.current?.contains(event.target))
        setRecordMenuOpen(false);
    };
    document.addEventListener("mousedown", closeMenu);
    return () => document.removeEventListener("mousedown", closeMenu);
  }, []);

  const loadFields = async (selectedRecord) => {
    const requestId = ++fieldRequestId.current;
    setRecordType(selectedRecord);
    setRecordSearch(selectedRecord.label);
    setRecordMenuOpen(false);
    setFilteredBy("");
    selectedIds.current.clear();
    setSelectedCount(0);
    setSelectionRevision((revision) => revision + 1);
    setFields([]);
    setError("");
    setLoadingFields(true);
    try {
      const data = await apiRequest(
        `/function-builder/record-types/${encodeURIComponent(selectedRecord.id)}/fields`,
      );
      if (requestId !== fieldRequestId.current) return;
      const nextFields = Array.isArray(data?.fields)
        ? data.fields
            .map((field) => ({
              id: String(field.id ?? ""),
              label: String(field.label ?? field.title ?? field.id ?? ""),
              type: String(field.type ?? field.fieldValueType ?? ""),
              isMandatory: field.isMandatory === true,
            }))
            .filter((field) => field.id)
        : [];
      setFields(nextFields);
      nextFields.forEach((field) => selectedIds.current.add(field.id));
      setSelectedCount(nextFields.length);
    } catch (requestError) {
      if (requestId === fieldRequestId.current)
        setError(`Unable to load fields: ${requestError.message}`);
    } finally {
      if (requestId === fieldRequestId.current) setLoadingFields(false);
    }
  };

  const filteredRecords = useMemo(
    () =>
      recordTypes.filter((record) =>
        record.label.toLowerCase().includes(recordSearch.toLowerCase()),
      ),
    [recordTypes, recordSearch],
  );
  const filteredFields = useMemo(
    () =>
      fields.filter((field) =>
        `${field.label} ${field.id} ${field.type}`
          .toLowerCase()
          .includes(fieldQuery.toLowerCase()),
      ),
    [fields, fieldQuery],
  );
  const useFilteredBy = functionType !== "create";

  const toggleField = (id, checked) => {
    if (checked) selectedIds.current.add(id);
    else selectedIds.current.delete(id);
    setSelectedCount(selectedIds.current.size);
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");
    if (!functionName.trim()) return setError("Enter a function name.");
    if (!recordType) return setError("Select a record type.");
    setSaving(true);
    try {
      const selectedFields = fields
        .filter((field) => selectedIds.current.has(field.id))
        .map(({ id, label, type, isMandatory }) => ({
          id,
          label,
          type,
          isMandatory,
        }));
      await apiRequest("/function-builder/functions", {
        method: "POST",
        body: JSON.stringify({
          functionName: functionName.trim(),
          functionType,
          recordType: recordType.id,
          filteredBy: useFilteredBy ? filteredBy || null : null,
          fields: selectedFields,
        }),
      });
      setNotice(`${typeInfo.title} function configuration saved.`);
      setFunctionName("");
    } catch (requestError) {
      setError(`Unable to save function: ${requestError.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-view">
      <button className="back-button" onClick={onBack}>
        <span>‹</span> Home
      </button>
      <div className="page-title-row">
        <div>
          <p className="eyebrow">FUNCTION CONFIGURATION</p>
          <h1>Create {typeInfo.title} Function</h1>
          <p className="muted">
            Choose the record fields this function will use.
          </p>
        </div>
        <span className={`large-type-icon icon-${functionType}`}>
          {typeInfo.icon}
        </span>
      </div>

      <form className="builder-layout" onSubmit={submit}>
        <section className="form-panel">
          <div className="panel-heading">
            <span className="step-number">01</span>
            <div>
              <h2>Function details</h2>
              <p>Name and select the NetSuite record type.</p>
            </div>
          </div>
          <label className="form-label">
            Function name <b>*</b>
            <input
              className="text-input"
              value={functionName}
              onChange={(event) => setFunctionName(event.target.value)}
              placeholder={`e.g. ${recordType?.label || "Customer"} ${typeInfo.title}`}
              maxLength={100}
            />
          </label>
          <div className="form-label record-picker" ref={recordMenuRef}>
            <span>
              Record type <b>*</b>
            </span>
            <input
              className="text-input"
              value={recordSearch}
              onFocus={() => setRecordMenuOpen(true)}
              onChange={(event) => {
                fieldRequestId.current += 1;
                setLoadingFields(false);
                setRecordSearch(event.target.value);
                setRecordType(null);
                setFields([]);
                setFilteredBy("");
                selectedIds.current.clear();
                setSelectedCount(0);
                setSelectionRevision((revision) => revision + 1);
                setRecordMenuOpen(true);
              }}
              placeholder={
                loadingTypes ? "Loading record types…" : "Search record types"
              }
              disabled={loadingTypes}
              role="combobox"
              aria-expanded={recordMenuOpen}
              aria-autocomplete="list"
            />
            {recordMenuOpen && !loadingTypes && (
              <div className="record-menu" role="listbox">
                {filteredRecords.length ? (
                  filteredRecords.map((record) => (
                    <button
                      type="button"
                      key={record.id}
                      role="option"
                      aria-selected={recordType?.id === record.id}
                      onClick={() => loadFields(record)}
                    >
                      {record.label}
                      <small>{record.id}</small>
                    </button>
                  ))
                ) : (
                  <p>No matching record types.</p>
                )}
              </div>
            )}
          </div>

          {useFilteredBy && (
            <label className="form-label">
              Filtered by
              <select
                className="text-input"
                value={filteredBy}
                onChange={(event) => setFilteredBy(event.target.value)}
                disabled={!fields.length}
              >
                <option value="">Choose a field (optional)</option>
                {fields.map((field) => (
                  <option key={field.id} value={field.id}>
                    {field.label} · {field.id}
                  </option>
                ))}
              </select>
            </label>
          )}
          <div className="save-row">
            <span className="muted">
              Function type{" "}
              <strong className="type-value">{typeInfo.title}</strong>
            </span>
            <button
              className="primary-button"
              type="submit"
              disabled={saving || loadingFields}
            >
              {saving ? (
                <>
                  <i className="spinner" /> Saving…
                </>
              ) : (
                <>
                  Save {typeInfo.title} function <span>→</span>
                </>
              )}
            </button>
          </div>
          {error && (
            <div className="message error-message" role="alert">
              {error}
            </div>
          )}
          {notice && (
            <div className="message success-message" role="status">
              {notice}
            </div>
          )}
        </section>

        <section className="form-panel field-panel">
          <div className="panel-heading">
            <span className="step-number">02</span>
            <div>
              <h2>Form configuration</h2>
              <p>Choose fields included in this function.</p>
            </div>
            <span className="selected-count">{selectedCount} selected</span>
          </div>
          {fields.length > 0 && (
            <div className="field-toolbar">
              <label className="field-search">
                <span>⌕</span>
                <input
                  value={fieldQuery}
                  onChange={(event) => setFieldQuery(event.target.value)}
                  placeholder="Search fields"
                />
              </label>
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  fields.forEach((field) => selectedIds.current.add(field.id));
                  setSelectedCount(fields.length);
                  setSelectionRevision((revision) => revision + 1);
                }}
              >
                Select all
              </button>
              <button
                type="button"
                className="text-button"
                onClick={() => {
                  selectedIds.current.clear();
                  setSelectedCount(0);
                  setSelectionRevision((revision) => revision + 1);
                }}
              >
                Clear
              </button>
            </div>
          )}
          {loadingFields ? (
            <div className="empty-state">
              <i className="spinner" /> Loading cached fields…
            </div>
          ) : !recordType ? (
            <div className="empty-state">
              <span className="empty-icon">▤</span>
              <strong>Select a record type</strong>
              <span>Cached fields will appear here.</span>
            </div>
          ) : !fields.length ? (
            <div className="empty-state">
              <strong>No fields found</strong>
              <span>This record type has no cached field details.</span>
            </div>
          ) : filteredFields.length ? (
            <div className="fields-list">
              {filteredFields.map((field) => (
                <FieldRow
                  key={`${recordType.id}:${field.id}:${selectionRevision}`}
                  field={field}
                  checked={selectedIds.current.has(field.id)}
                  onChange={toggleField}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state compact">
              No fields match “{fieldQuery}”.
            </div>
          )}
        </section>
      </form>
    </div>
  );
}

function FieldRow({ field, checked, onChange }) {
  const [selected, setSelected] = useState(checked);
  return (
    <label className={`field-row ${selected ? "is-selected" : ""}`}>
      <input
        type="checkbox"
        checked={selected}
        onChange={(event) => {
          setSelected(event.target.checked);
          onChange(field.id, event.target.checked);
        }}
      />
      <span className="field-check" aria-hidden="true">
        {selected ? "✓" : ""}
      </span>
      <span className="field-info">
        <strong>
          {field.label}
          {field.isMandatory && <b className="required-mark"> *</b>}
        </strong>
        <small>{field.id}</small>
      </span>
      <span className="field-type">{field.type || "field"}</span>
    </label>
  );
}

function SavedFunctions({ functionType, onBack }) {
  const typeInfo =
    FUNCTION_TYPES.find((item) => item.id === functionType) ||
    FUNCTION_TYPES[0];
  const [functions, setFunctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [selectedFunction, setSelectedFunction] = useState(null);
  const loadFunctions = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiRequest(
        `/function-builder/functions?functionType=${encodeURIComponent(functionType)}`,
      );
      setFunctions(Array.isArray(data) ? data : []);
    } catch (requestError) {
      setError(
        `Unable to load ${typeInfo.title.toLowerCase()} functions: ${requestError.message}`,
      );
    } finally {
      setLoading(false);
    }
  }, [functionType, typeInfo.title]);

  useEffect(() => {
    loadFunctions();
  }, [loadFunctions]);
  const filtered = functions.filter((item) =>
    `${item.functionName} ${item.recordType}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  );

  return (
    <div className="page-view">
      <button className="back-button" onClick={onBack}>
        <span>‹</span> Home
      </button>
      <div className="page-title-row">
        <div>
          <p className="eyebrow">SAVED CONFIGURATIONS</p>
          <h1>{typeInfo.title} Functions</h1>
          <p className="muted">Function configurations stored in MongoDB.</p>
        </div>
        <button
          className="icon-button"
          onClick={loadFunctions}
          title="Refresh functions"
          aria-label="Refresh functions"
        >
          ↻
        </button>
      </div>
      <div className="saved-toolbar">
        <label className="field-search">
          <span>⌕</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name or record type"
          />
        </label>
        <span className="muted">
          {functions.length} {functions.length === 1 ? "function" : "functions"}
        </span>
      </div>
      {loading ? (
        <div className="loading-state">
          <i className="spinner" /> Loading functions…
        </div>
      ) : error ? (
        <div className="message error-message">{error}</div>
      ) : !filtered.length ? (
        <div className="empty-state list-empty">
          <span className="empty-icon">▤</span>
          <strong>
            {query
              ? "No matching functions"
              : `No ${typeInfo.title.toLowerCase()} functions yet`}
          </strong>
          <span>
            {query
              ? "Try a different search."
              : "Create a function configuration to see it here."}
          </span>
        </div>
      ) : (
        <div className="saved-list">
          {filtered.map((item) => (
            <button
              className="saved-item"
              key={item._id}
              onClick={() => setSelectedFunction(item)}
            >
              <span className={`tile-icon icon-${functionType}`}>
                {typeInfo.icon}
              </span>
              <span className="saved-main">
                <strong>{item.functionName}</strong>
                <small>
                  {item.recordType} · {(item.fields || []).length} fields
                  {item.filteredBy ? ` · filtered by ${item.filteredBy}` : ""}
                </small>
              </span>
              <span className="tile-arrow">›</span>
            </button>
          ))}
        </div>
      )}
      {selectedFunction && (
        <FunctionDetail
          config={selectedFunction}
          onBack={() => setSelectedFunction(null)}
          inline
        />
      )}
    </div>
  );
}

function FunctionDetail({ config, onBack, inline = false }) {
  if (!config) return null;
  const fields = Array.isArray(config.fields) ? config.fields : [];
  return (
    <div className={`detail-panel ${inline ? "inline-detail" : ""}`}>
      <div className="detail-heading">
        <div>
          <p className="eyebrow">{config.recordType}</p>
          <h2>{config.functionName}</h2>
        </div>
        <button
          className="icon-button"
          onClick={onBack}
          aria-label="Close details"
        >
          ×
        </button>
      </div>
      {config.filteredBy && (
        <p className="filter-summary">
          Filtered by <strong>{config.filteredBy}</strong>
        </p>
      )}
      <h3>
        Configured fields <span>{fields.length}</span>
      </h3>
      {fields.length ? (
        <div className="detail-fields">
          {fields.map((field) => (
            <div className="detail-field" key={field.id}>
              <span>
                <strong>{field.label}</strong>
                <small>{field.id}</small>
              </span>
              <em>{field.type || "field"}</em>
            </div>
          ))}
        </div>
      ) : (
        <p className="muted">No fields configured.</p>
      )}
      <p className="detail-note">
        This screen shows the saved configuration. Record execution is handled
        by the NetSuite RESTlet.
      </p>
    </div>
  );
}

function SimpleScreen({ title, description, icon }) {
  return (
    <section className="simple-screen">
      <span className="simple-icon">{icon}</span>
      <p className="eyebrow">SUITE MOBILIFY</p>
      <h1>{title}</h1>
      <p className="muted">{description}</p>
    </section>
  );
}

export default App;
