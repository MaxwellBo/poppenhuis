import React, { useState } from "react";
import { useLoaderData } from "react-router";
import { Helmet } from 'react-helmet';
import { FirebaseForm } from "../components/FirebaseForm";
import { ITEM_FIELD_SCHEMAS, loadCollection } from "../manifest";
import { useFirebaseForm } from "../hooks/useFirebaseForm";
import { useFirebaseSubmit } from "../hooks/useFirebaseSubmit";
import { QueryPreservingLink } from "../components/QueryPreservingLink";
import { PageHeader } from "../components/PageHeader";
import { ModelViewerWrapper } from "../components/ModelViewerWrapper";

export const loader = loadCollection;

export default function NewItemPage() {
  const { user, collection } = useLoaderData() as Awaited<ReturnType<typeof loader>>;
  const [itemId, setItemId] = useState("");
  const [modelFile, setModelFile] = useState<File | null>(null);
  const [ogImageFile, setOgImageFile] = useState<File | null>(null);
  const modelViewerRef = React.useRef<HTMLElement>(null);
  
  const {
    formData,
    handleInputChange,
    handleAddField,
    handleDeleteField,
    cleanFormData,
  } = useFirebaseForm({ initialData: { name: '' } });

  const { isSubmitting, error, upsertItem } = useFirebaseSubmit();

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
    await upsertItem(user.id, collection.id, itemId, formData, modelFile, cleanFormData, ogImageFile);
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
        const file = new File([blob], `${itemId || 'model'}-og.png`, { type: 'image/png' });
        setOgImageFile(file);
      }
    }, 'image/png');
  };

  const clearOgImage = () => {
    setOgImageFile(null);
  };

  return (
    <article>
      <Helmet><title>create item - poppenhuis</title></Helmet>
      <PageHeader>
        <QueryPreservingLink to={`/${user.id}`}>{user.name}</QueryPreservingLink> / <QueryPreservingLink to={`/${user.id}/${collection.id}`}>{collection.name}</QueryPreservingLink> / create a new item
      </PageHeader>
      <FirebaseForm
        formData={formData}
      idField={{
        name: 'itemId',
        label: 'item ID',
        value: itemId,
        onChange: setItemId,
      }}
      fields={itemFieldsWithFileHandler}
      onInputChange={handleInputChange}
      onAddField={handleAddField}
      onDeleteField={handleDeleteField}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      error={error}
      submitButtonText={isSubmitting ? "creating..." : "create item"}
    >
      {modelFile && formData.model && (
        <div className="table-form-row">
          <label>Model Preview</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <ModelViewerWrapper 
              modelViewerRef={modelViewerRef}
              item={{ 
                id: itemId || 'preview',
                name: formData.name || 'Preview',
                model: URL.createObjectURL(modelFile)
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
