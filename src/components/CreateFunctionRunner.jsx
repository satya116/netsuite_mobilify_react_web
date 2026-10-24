import { useState } from "react";
import { apiRequest } from "../services/api.js";

function inputType(fieldType) {
  const type = String(fieldType || "").toLowerCase();
  if (["integer", "number", "currency", "float", "percent"].includes(type)) return "number";
  if (type === "date") return "date";
  if (type === "email") return "email";
  if (["phone", "phonenumber"].includes(type)) return "tel";
  return "text";
}

export default function CreateFunctionRunner({ config }) {
  const fields = Array.isArray(config.fields) ? config.fields : [];
  const [values, setValues] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");
    const submittedValues = { ...values };
    fields.forEach((field) => {
      if (["checkbox", "boolean"].includes(String(field.type).toLowerCase())) {
        submittedValues[field.id] = Boolean(values[field.id]);
      }
    });

    try {
      const result = await apiRequest(
        `/function-builder/functions/${encodeURIComponent(config._id)}/execute-create`,
        {
          method: "POST",
          body: JSON.stringify({ values: submittedValues }),
        },
      );
      setNotice(`Record created successfully. Internal ID: ${result.recordId}`);
      setValues({});
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="create-runner" aria-label="Create NetSuite record">
      <h3>New {config.recordType} record</h3>
      {!fields.length ? (
        <p className="muted">This function has no fields configured.</p>
      ) : (
        <form className="create-record-form" onSubmit={submit}>
          {fields.map((field) => {
            const type = String(field.type || "").toLowerCase();
            const isCheckbox = ["checkbox", "boolean"].includes(type);
            const isLongText = ["textarea", "longtext", "richtext"].includes(type);
            return (
              <label className={`form-label ${isCheckbox ? "checkbox-field" : ""}`} key={field.id}>
                {isCheckbox ? (
                  <>
                    <input
                      type="checkbox"
                      checked={Boolean(values[field.id])}
                      onChange={(event) =>
                        setValues((current) => ({ ...current, [field.id]: event.target.checked }))
                      }
                    />
                    <span>{field.label || field.id}{field.isMandatory ? " *" : ""}</span>
                  </>
                ) : isLongText ? (
                  <>
                    {field.label || field.id}{field.isMandatory ? " *" : ""}
                    <textarea
                      className="text-input"
                      value={values[field.id] ?? ""}
                      required={field.isMandatory}
                      onChange={(event) =>
                        setValues((current) => ({ ...current, [field.id]: event.target.value }))
                      }
                    />
                  </>
                ) : (
                  <>
                    {field.label || field.id}{field.isMandatory ? " *" : ""}
                    <input
                      className="text-input"
                      type={inputType(field.type)}
                      step={type === "integer" ? "1" : ["number", "float", "currency", "percent"].includes(type) ? "any" : undefined}
                      placeholder={type === "select" ? "Enter NetSuite internal ID" : ""}
                      value={values[field.id] ?? ""}
                      required={field.isMandatory}
                      onChange={(event) =>
                        setValues((current) => ({ ...current, [field.id]: event.target.value }))
                      }
                    />
                  </>
                )}
                <small className="create-field-id">{field.id}</small>
              </label>
            );
          })}
          <div className="create-submit-row">
            <button className="primary-button" type="submit" disabled={loading}>
              {loading ? <><i className="spinner" /> Creating…</> : "Create record"}
            </button>
          </div>
        </form>
      )}
      {error && <p className="message error-message" role="alert">{error}</p>}
      {notice && <p className="message success-message" role="status">{notice}</p>}
    </section>
  );
}
