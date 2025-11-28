import React, { ReactNode } from "react";

export interface FieldConfig {
  name: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  type?: 'text' | 'textarea' | 'file';
  accept?: string;
}

interface FirebaseFormProps {
  title: string;
  formData: Record<string, any>;
  idField?: {
    name: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    readOnly?: boolean;
  };
  fields: FieldConfig[];
  fileField?: {
    label: string;
    onChange: (file: File | null) => void;
    accept: string;
    required?: boolean;
  };
  onInputChange: (field: string, value: string) => void;
  onAddField: (field: string) => void;
  onDeleteField: (field: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  error: string;
  submitButtonText?: string;
  children?: ReactNode;
}

export function FirebaseForm({
  title,
  formData,
  idField,
  fields,
  fileField,
  onInputChange,
  onAddField,
  onDeleteField,
  onSubmit,
  isSubmitting,
  error,
  submitButtonText = "Submit",
  children,
}: FirebaseFormProps) {
  const renderField = (config: FieldConfig) => {
    const { name, label, required = false, placeholder, type = 'text' } = config;
    
    return (
      <div className="table-form-row" key={name}>
        <label htmlFor={name}>{label}:</label>
        {formData.hasOwnProperty(name) && formData[name] !== undefined ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {type === 'textarea' ? (
              <textarea
                id={name}
                value={formData[name] || ''}
                onChange={(e) => onInputChange(name, e.target.value)}
                rows={4}
                disabled={isSubmitting}
                required={required}
              />
            ) : (
              <input
                type="text"
                id={name}
                value={Array.isArray(formData[name]) ? formData[name].join(', ') : (formData[name] || '')}
                onChange={(e) => onInputChange(name, e.target.value)}
                placeholder={placeholder}
                pattern={required ? ".*\\S.*" : undefined}
                title={required ? `${label} cannot be empty or contain only whitespace` : undefined}
                disabled={isSubmitting}
                required={required}
              />
            )}
            {!required && (
              <button 
                type="button" 
                onClick={() => onDeleteField(name)} 
                style={{ fontSize: '0.8rem' }}
                disabled={isSubmitting}
              >
                ✕
              </button>
            )}
          </div>
        ) : (
          <button type="button" onClick={() => onAddField(name)} disabled={isSubmitting}>
            + Add {label.toLowerCase()}
          </button>
        )}
      </div>
    );
  };

  return (
    <article>
      <header>
        <h1>{title}</h1>
      </header>
      <form onSubmit={onSubmit} className="table-form">
        {idField && (
          <div className="table-form-row">
            <label htmlFor={idField.name}>{idField.label}:</label>
            <input
              type="text"
              id={idField.name}
              value={idField.value}
              onChange={(e) => idField.onChange(e.target.value)}
              placeholder={idField.label.toLowerCase()}
              pattern=".*\S.*"
              title={`${idField.label} cannot be empty or contain only whitespace`}
              required
              disabled={isSubmitting || idField.readOnly}
              readOnly={idField.readOnly}
            />
          </div>
        )}
        
        {fields.map(field => renderField(field))}
        
        {fileField && (
          <div className="table-form-row">
            <label htmlFor="fileUpload">{fileField.label}:</label>
            <input
              type="file"
              id="fileUpload"
              accept={fileField.accept}
              onChange={(e) => fileField.onChange(e.target.files?.[0] || null)}
              required={fileField.required}
              disabled={isSubmitting}
            />
          </div>
        )}
        
        {children}
        
        {error && (
          <p style={{ color: "red" }}>
            Error: {error}
          </p>
        )}
        
        <div className="table-form-row">
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : submitButtonText}
          </button>
        </div>
      </form>
    </article>
  );
}
