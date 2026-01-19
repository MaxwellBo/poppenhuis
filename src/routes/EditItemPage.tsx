import React, { useEffect, useRef } from "react";
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
import { useModelSnapshot } from "../hooks/useModelSnapshot";

export const loader = loadItem;

export default function EditItemPage() {
  const { item, collection, user } = useLoaderData() as Awaited<ReturnType<typeof loader>>;
  const modelViewerRef = useRef<HTMLElement>(null);
  
  const {
    formData,
    setFormData,
    handleInputChange,
    handleAddField,
    handleDeleteField,
  } = useFirebaseForm();

  const { isSubmitting, error, upsertItem } = useFirebaseSubmit();
  const { imageUrl, isUploading, uploadError, snapshotModel, uploadSnapshot, setImageUrl } = useModelSnapshot(item.og);

  useEffect(() => {
    setFormData({ ...item });
    // Reset imageUrl when item changes
    if (item.og) {
      setImageUrl(item.og);
    }
  }, [item, setFormData, setImageUrl]);

  // Filter out non-form fields
  const itemFields = Object.values(ITEM_FIELD_SCHEMAS)
    .filter(field => !['usdzModel', 'poster', 'og'].includes(field.name));

  const handleSnapshot = () => {
    snapshotModel(modelViewerRef);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Upload the snapshot to Firebase Storage if available and it's a new snapshot (data URL)
    let ogUrl = imageUrl;
    if (imageUrl && imageUrl.startsWith('data:')) {
      ogUrl = await uploadSnapshot(user.id, collection.id, item.id);
      if (!ogUrl && uploadError) {
        // If upload failed, show error and don't proceed
        return;
      }
    }
    
    // Include the uploaded og image URL if available
    const dataToSubmit = ogUrl ? { ...formData, og: ogUrl } : formData;
    
    await upsertItem(user.id, collection.id, item.id, dataToSubmit);
  };

  return (
    <article>
      <Helmet><title>edit {item.id} - poppenhuis</title></Helmet>
      <PageHeader>
        <QueryPreservingLink to={`/${user.id}`}>{user.name}</QueryPreservingLink> / <QueryPreservingLink to={`/${user.id}/${collection.id}`}>{collection.name}</QueryPreservingLink> / <QueryPreservingLink to={`/${user.id}/${collection.id}/${item.id}`}>{item.name}</QueryPreservingLink> / edit
      </PageHeader>
      
      {formData.model && (
        <div style={{ marginBottom: '20px' }}>
          <ModelViewerWrapper 
            modelViewerRef={modelViewerRef}
            item={{ ...formData, id: item.id } as any} 
            size='normal' 
          />
          <div style={{ marginTop: '10px' }}>
            <button onClick={handleSnapshot} type="button">
              snapshot model for og image
            </button>
            {imageUrl && (
              <div style={{ marginTop: '10px' }}>
                <p>Preview of snapshotted image:</p>
                <img src={imageUrl} alt="Snapshot preview" style={{ width: '200px', height: 'auto' }} />
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
        name: 'id',
        label: 'item ID',
        value: formData.id || '',
        onChange: () => {}, // ID is read-only
        readOnly: true,
      }}
      fields={itemFields}
      onInputChange={handleInputChange}
      onAddField={handleAddField}
      onDeleteField={handleDeleteField}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting || isUploading}
      error={error}
      submitButtonText={isSubmitting || isUploading ? "saving..." : "save changes"}
    />
    </article>
  );
}
