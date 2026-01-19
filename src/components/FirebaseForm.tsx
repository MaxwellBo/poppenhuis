import React, { ReactNode } from "react";
import { FieldSchema } from "../manifest";

export interface FieldConfig extends FieldSchema {
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
  onInputChange: (field: string, value: string | File) => void;
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
    const { name, label, required = false, placeholder, type = 'text', accept, selectedFileName } = config;
    
    return (
      <div className="table-form-row" key={name}>
        <label htmlFor={name}>{label}</label>
        {formData.hasOwnProperty(name) && formData[name] !== undefined ? (
          type === 'file' ? (
            <>
              {formData[name] instanceof File ? (
                <span>{formData[name].name}</span>
              ) : selectedFileName ? (
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
                  onInputChange(name, file);
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

  return (
    <form onSubmit={onSubmit} className="table-form">
        {idField && (
          <div className="table-form-row">
            <label htmlFor={idField.name}>{idField.label}</label>
            <input
              type="text"
              id={idField.name}
              value={idField.value}
              onChange={(e) => idField.onChange(e.target.value)}
              placeholder={idField.label.toLowerCase()}
              pattern="^\S+$"
              title={`${idField.label} cannot contain whitespace`}
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
