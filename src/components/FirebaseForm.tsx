import React, { ReactNode, useRef, useState, useEffect } from "react";
import { FieldSchema } from "../manifest";
import { ModelViewerWrapper } from "./ModelViewerWrapper";
import { useModelSnapshot } from "../hooks/useModelSnapshot";
import JSZip from 'jszip';

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
  // Props for snapshot upload to storage
  snapshotUploadProps?: {
    userId: string;
    collectionId: string;
    itemId: string;
  };
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
  snapshotUploadProps,
}: FirebaseFormProps) {
  const modelViewerRef = useRef<HTMLElement>(null);
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const { snapshotImageUrl, isUploading, uploadError, snapshotModel } = useModelSnapshot();
  const imageUrl = snapshotImageUrl ?? formData.og ?? null;

  // Extract model URL from file or use existing URL
  useEffect(() => {
    if (!formData.model) {
      setModelUrl(null);
      return;
    }
    
    // If it's already a string URL, use it
    if (typeof formData.model === 'string') {
      setModelUrl(formData.model);
      return;
    }
    
    // If it's a File object, handle it based on type
    if (formData.model instanceof File) {
      const file = formData.model;
      
      // If it's a zip file, extract the .glb
      if (file.name.toLowerCase().endsWith('.zip')) {
        const extractGlbFromZip = async () => {
          try {
            const zip = new JSZip();
            const contents = await zip.loadAsync(file);
            
            const glbFiles = Object.keys(contents.files).filter(filename => 
              filename.toLowerCase().endsWith('.glb') && !contents.files[filename].dir
            );
            
            if (glbFiles.length === 0) {
              console.error('No .glb file found in the zip archive');
              setModelUrl(null);
              return;
            }
            
            if (glbFiles.length > 1) {
              console.error(`Zip archive contains multiple .glb files (${glbFiles.length}). Using the first one.`);
            }
            
            const glbFileName = glbFiles[0];
            const glbBlob = await contents.files[glbFileName].async('blob');
            const url = URL.createObjectURL(glbBlob);
            setModelUrl(url);
          } catch (err) {
            console.error('Failed to extract .glb from zip:', err);
            setModelUrl(null);
          }
        };
        
        extractGlbFromZip();
      } else {
        // For non-zip files, create a blob URL directly
        const url = URL.createObjectURL(file);
        setModelUrl(url);
      }
    }
    
    // Cleanup function to revoke object URLs
    return () => {
      if (modelUrl && modelUrl.startsWith('blob:')) {
        URL.revokeObjectURL(modelUrl);
      }
    };
  }, [formData.model]);

  // When snapshot is taken, also store the data URL in formData
  const handleSnapshotModel = () => {
    snapshotModel(modelViewerRef);
    // After snapshot is captured, the imageUrl will be set via useEffect below
  };

  // Sync imageUrl to formData.og when it changes (for data URLs)
  useEffect(() => {
    if (imageUrl && imageUrl.startsWith('data:')) {
      onInputChange('og', imageUrl);
    }
  }, [imageUrl]);

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(e);
  };

  const renderField = (config: FieldConfig) => {
    const { name, label, required = false, placeholder, type = 'text', accept, selectedFileName } = config;
    
    // Model field: show preview above file input
    if (name === 'model' && snapshotUploadProps) {
      return (
        <React.Fragment key={name}>
          {modelUrl && (
            <div style={{ marginBottom: '10px' }}>
              <ModelViewerWrapper 
                modelViewerRef={modelViewerRef}
                item={{ ...formData, model: modelUrl, id: idField?.value || 'preview' } as any} 
                size='normal' 
              />
            </div>
          )}
          <div className="table-form-row">
            <label htmlFor={name}>{label}</label>
            {formData.hasOwnProperty(name) && formData[name] !== undefined ? (
              <>
                {formData[name] instanceof File ? (
                  <span>{formData[name].name}</span>
                ) : selectedFileName ? (
                  <span>{selectedFileName}</span>
                ) : (
                  <a href={formData[name]} target="_blank" rel="noopener noreferrer">{formData[name]}</a>
                )}
                <button type="button" onClick={() => onDeleteField(name)} style={{ fontSize: '0.8rem' }} disabled={isSubmitting}>✕</button>
              </>
            ) : (
              <input
                type="file"
                id={name}
                accept={accept}
                onChange={(e) => { const file = e.target.files?.[0]; if (file) onInputChange(name, file); }}
                disabled={isSubmitting}
              />
            )}
          </div>
        </React.Fragment>
      );
    }
    
    // OG field: show preview and snapshot button above
    if (name === 'og' && snapshotUploadProps) {
      return (
        <React.Fragment key={name}>
          {(imageUrl || (formData.og && typeof formData.og === 'string')) && (
            <div style={{ marginBottom: '10px' }}>
              <img 
                src={imageUrl || formData.og} 
                alt="OG preview" 
                style={{ width: '200px', height: 'auto' }} 
              />
            </div>
          )}
          <div className="table-form-row">
            <label htmlFor={name}>{label}</label>
            {modelUrl ? (
              <button 
                onClick={handleSnapshotModel} 
                type="button"
                disabled={isSubmitting || isUploading}
              >
                snapshot model for og image
              </button>
            ) : (
              <span style={{ color: '#999' }}>upload model first</span>
            )}
            {formData.og && (
              <button type="button" onClick={() => onDeleteField(name)} style={{ fontSize: '0.8rem' }} disabled={isSubmitting}>✕</button>
            )}
          </div>
          {uploadError && <p style={{ color: 'red' }}>Upload error: {uploadError}</p>}
        </React.Fragment>
      );
    }
    
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
                placeholder={placeholder}
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
    <form onSubmit={handleFormSubmit} className="table-form">
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
        <button type="submit" disabled={isSubmitting || isUploading}>
          {isSubmitting || isUploading ? "saving..." : submitButtonText}
        </button>
      </div>
    </form>
  );
}
