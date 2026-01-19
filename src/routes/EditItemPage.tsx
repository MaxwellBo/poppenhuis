import React, { useEffect, useState } from "react";
import { useLoaderData } from "react-router";
import { Helmet } from 'react-helmet';
import { FirebaseForm } from "../components/FirebaseForm";
import { ITEM_FIELD_SCHEMAS } from "../manifest";
import { useFirebaseForm } from "../hooks/useFirebaseForm";
import { useFirebaseSubmit } from "../hooks/useFirebaseSubmit";
import { loadItem } from "../manifest";
import { QueryPreservingLink } from "../components/QueryPreservingLink";
import { PageHeader } from "../components/PageHeader";
import { ModelViewerWrapper } from "../components/ModelViewerWrapper";

export const loader = loadItem;

export default function EditItemPage() {
  const { item, collection, user } = useLoaderData() as Awaited<ReturnType<typeof loader>>;
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [ogImageFile, setOgImageFile] = useState<File | null>(null);
  const modelViewerRef = React.useRef<HTMLElement>(null);
  
  const {
    formData,
    setFormData,
    handleInputChange,
    handleAddField,
    handleDeleteField,
  } = useFirebaseForm();

  const { isSubmitting, error, upsertItem } = useFirebaseSubmit();

  useEffect(() => {
    setFormData({ ...item });
  }, [item, setFormData]);

  const handleModelFileSelect = (file: File | null) => {
    setModelFile(file);
  };

  // Add file handler to the model field and filter out non-form fields
  const itemFieldsWithFileHandler = Object.values(ITEM_FIELD_SCHEMAS)
    .filter(field => !['usdzModel', 'poster', 'og'].includes(field.name))
    .map(field => 
      field.name === 'model' ? { 
        ...field, 
        onFileChange: handleModelFileSelect,
        selectedFileName: modelFile?.name 
      } : field
    );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await upsertItem(user.id, collection.id, item.id, formData, modelFile, undefined, ogImageFile);
  };

  const captureScreenshot = async () => {
    const modelViewer = modelViewerRef.current;
    if (!modelViewer) return;
    
    // Access the canvas from model-viewer's shadow root
    const canvas = modelViewer.shadowRoot?.querySelector('canvas');
    if (!canvas) return;
    
    // Convert canvas to blob and then to File
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `${item.id}-og.png`, { type: 'image/png' });
        setOgImageFile(file);
      }
    }, 'image/png');
  };

  const clearOgImage = () => {
    setOgImageFile(null);
  };

  return (
    <article>
      <Helmet><title>edit {item.id} - poppenhuis</title></Helmet>
      <PageHeader>
        <QueryPreservingLink to={`/${user.id}`}>{user.name}</QueryPreservingLink> / <QueryPreservingLink to={`/${user.id}/${collection.id}`}>{collection.name}</QueryPreservingLink> / <QueryPreservingLink to={`/${user.id}/${collection.id}/${item.id}`}>{item.name}</QueryPreservingLink> / edit
      </PageHeader>
      <FirebaseForm
        formData={formData}
      idField={{
        name: 'id',
        label: 'item ID',
        value: formData.id || '',
        onChange: () => {}, // ID is read-only
        readOnly: true,
      }}
      fields={itemFieldsWithFileHandler}
      onInputChange={handleInputChange}
      onAddField={handleAddField}
      onDeleteField={handleDeleteField}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      error={error}
      submitButtonText={isSubmitting ? "saving..." : "save changes"}
    >
      {formData.model && (
        <div className="table-form-row">
          <label>Model Preview</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <ModelViewerWrapper 
              modelViewerRef={modelViewerRef}
              item={{ 
                id: item.id,
                name: formData.name || item.name,
                model: modelFile ? URL.createObjectURL(modelFile) : formData.model
              }} 
              size='normal' 
            />
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button 
                type="button" 
                onClick={captureScreenshot}
                disabled={isSubmitting}
              >
                Capture OG Image
              </button>
              {ogImageFile && (
                <>
                  <span style={{ color: 'green' }}>✓ {ogImageFile.name}</span>
                  <button 
                    type="button" 
                    onClick={clearOgImage}
                    disabled={isSubmitting}
                    style={{ fontSize: '0.8rem' }}
                  >
                    ✕
                  </button>
                </>
              )}
              {!ogImageFile && formData.og && (
                <span style={{ color: '#666' }}>Current: <a href={formData.og} target="_blank" rel="noopener noreferrer">view</a></span>
              )}
            </div>
            {ogImageFile && (
              <div style={{ marginTop: '10px' }}>
                <img 
                  src={URL.createObjectURL(ogImageFile)} 
                  alt="OG preview" 
                  style={{ maxWidth: '200px', border: '1px solid #ccc' }}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </FirebaseForm>
    </article>
  );
}
