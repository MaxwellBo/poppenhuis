import React, { ReactNode } from "react";
import { FieldSchema } from "../manifest";

export interface FieldConfig extends FieldSchema {
  onFileChange?: (file: File | null) => void;
  selectedFileName?: string;
}

interface FirebaseFormProps {
  formData: Record<string, any>;
  idField?: {
    name: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
    readOnly?: boolean;
  };
  fields: FieldConfig[];
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
  formData,
  idField,
  fields,
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
    const { name, label, required = false, placeholder, type = 'text', accept, onFileChange, selectedFileName } = config;
    
    return (
      <div className="table-form-row" key={name}>
        <label htmlFor={name}>{label}</label>
        {formData.hasOwnProperty(name) && formData[name] !== undefined ? (
          type === 'file' ? (
            <>
              {selectedFileName ? (
                <span>{selectedFileName}</span>
              ) : (
                <a href={formData[name]} target="_blank" rel="noopener noreferrer">{formData[name]}</a>
              )}
              <button 
                type="button" 
                onClick={() => onDeleteField(name)} 
                style={{ fontSize: '0.8rem' }}
                disabled={isSubmitting}
              >
                ✕
              </button>
            </>
          ) : type === 'textarea' ? (
            <>
              <textarea
                id={name}
                value={formData[name] || ''}
                onChange={(e) => onInputChange(name, e.target.value)}
                rows={4}
                disabled={isSubmitting}
                required={required}
              />
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
            </>
          ) : (
            <>
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
            </>
          )
        ) : (
          type === 'file' ? (
            <input
              type="file"
              id={name}
              accept={accept}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  if (onFileChange) onFileChange(file);
                  onAddField(name);
                }
              }}
              disabled={isSubmitting}
            />
          ) : (
            <button type="button" onClick={() => onAddField(name)} disabled={isSubmitting}>
              + add {label.toLowerCase()}
            </button>
          )
        )}
      </div>
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    // Check for Command+Enter (Mac) or Ctrl+Enter (Windows/Linux)
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      const target = e.target as HTMLElement;
      // Only trigger from input fields and textareas, not from buttons
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        e.preventDefault();
        const form = e.currentTarget;
        // Trigger form submission with validation
        form.requestSubmit();
      }
    }
  };

  return (
    <form onSubmit={onSubmit} onKeyDown={handleKeyDown} className="table-form">
        {idField && (
          <div className="table-form-row">
            <label htmlFor={idField.name}>{idField.label}</label>
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
        
        {children}
        
        {error && (
          <p style={{ color: "red" }}>
            Error: {error}
          </p>
        )}
        
        <div className="table-form-row">
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "saving..." : submitButtonText}
          </button>
        </div>
      </form>
  );
}
