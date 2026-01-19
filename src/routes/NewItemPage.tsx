import React, { useState, useRef, useMemo } from "react";
import { useLoaderData } from "react-router";
import { Helmet } from 'react-helmet';
import { FirebaseForm } from "../components/FirebaseForm";
import { ITEM_FIELD_SCHEMAS, loadCollection } from "../manifest";
import { useFirebaseForm } from "../hooks/useFirebaseForm";
import { useFirebaseSubmit } from "../hooks/useFirebaseSubmit";
import { QueryPreservingLink } from "../components/QueryPreservingLink";
import { PageHeader } from "../components/PageHeader";
import { ModelViewerWrapper } from "../components/ModelViewerWrapper";
import { useModelSnapshot } from "../hooks/useModelSnapshot";

export const loader = loadCollection;

export default function NewItemPage() {
  const { user, collection } = useLoaderData() as Awaited<ReturnType<typeof loader>>;
  const [itemId, setItemId] = useState("");
  const modelViewerRef = useRef<HTMLElement>(null);
  
  const {
    formData,
    handleInputChange,
    handleAddField,
    handleDeleteField,
    cleanFormData,
  } = useFirebaseForm({ initialData: { name: '' } });

  const { isSubmitting, error, upsertItem } = useFirebaseSubmit();
  const { imageUrl, isUploading, uploadError, snapshotModel, uploadSnapshot } = useModelSnapshot();

  // Create a temporary URL for the model file if it's a File object
  const modelUrl = useMemo(() => {
    if (!formData.model) return null;
    
    // If it's already a string URL, use it
    if (typeof formData.model === 'string') {
      return formData.model;
    }
    
    // If it's a File object, create a temporary blob URL
    if (formData.model instanceof File) {
      return URL.createObjectURL(formData.model);
    }
    
    return null;
  }, [formData.model]);

  // Filter out non-form fields
  const itemFields = Object.values(ITEM_FIELD_SCHEMAS)
    .filter(field => !['usdzModel', 'poster', 'og'].includes(field.name));

  const handleSnapshot = () => {
    snapshotModel(modelViewerRef);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Upload the snapshot to Firebase Storage if available
    let ogUrl = null;
    if (imageUrl) {
      ogUrl = await uploadSnapshot(user.id, collection.id, itemId);
      if (!ogUrl && uploadError) {
        // If upload failed, show error and don't proceed
        return;
      }
    }
    
    // Clean the form data and include the uploaded og image URL if available
    const cleanedData = cleanFormData();
    const dataToSubmit = ogUrl ? { ...cleanedData, og: ogUrl } : cleanedData;
    
    await upsertItem(user.id, collection.id, itemId, dataToSubmit);
  };

  return (
    <article>
      <Helmet><title>create item - poppenhuis</title></Helmet>
      <PageHeader>
        <QueryPreservingLink to={`/${user.id}`}>{user.name}</QueryPreservingLink> / <QueryPreservingLink to={`/${user.id}/${collection.id}`}>{collection.name}</QueryPreservingLink> / create a new item
      </PageHeader>
      
      {modelUrl && (
        <div style={{ marginBottom: '20px' }}>
          <ModelViewerWrapper 
            modelViewerRef={modelViewerRef}
            item={{ ...formData, model: modelUrl, id: itemId || 'preview' } as any} 
            size='normal' 
          />
          <div style={{ marginTop: '10px' }}>
            <button onClick={handleSnapshot} type="button">
              snapshot model for og image
            </button>
            {imageUrl && (
              <div style={{ marginTop: '10px' }}>
                <p>Preview of snapshotted image:</p>
                <img key={imageUrl} src={imageUrl} alt="Snapshot preview" style={{ width: '200px', height: 'auto' }} />
                <p style={{ fontSize: '0.875rem', color: '#666' }}>
                  {imageUrl.startsWith('data:') ? '(will be uploaded to storage on submit)' : '(uploaded)'}
                </p>
              </div>
            )}
            {uploadError && (
              <div style={{ color: 'red', marginTop: '10px' }}>
                Upload error: {uploadError}
              </div>
            )}
          </div>
        </div>
      )}
      
      <FirebaseForm
        formData={formData}
      idField={{
        name: 'itemId',
        label: 'item ID',
        value: itemId,
        onChange: setItemId,
      }}
      fields={itemFields}
      onInputChange={handleInputChange}
      onAddField={handleAddField}
      onDeleteField={handleDeleteField}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting || isUploading}
      error={error}
      submitButtonText={isSubmitting || isUploading ? "creating..." : "create item"}
    />
    </article>
  );
}
