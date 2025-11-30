import React, { useState } from "react";
import { useParams } from "react-router";
import { Helmet } from 'react-helmet';
import { FirebaseForm } from "../components/FirebaseForm";
import { ITEM_FIELD_SCHEMAS } from "../manifest";
import { useFirebaseForm } from "../hooks/useFirebaseForm";
import { useFirebaseSubmit } from "../hooks/useFirebaseSubmit";
import { QueryPreservingLink } from "../components/QueryPreservingLink";
import { PageHeader } from "../components/PageHeader";

export default function NewItemPage() {
  const { userId, collectionId } = useParams<{ userId: string; collectionId: string }>();
  const [itemId, setItemId] = useState("");
  const [modelFile, setModelFile] = useState<File | null>(null);
  
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
    await upsertItem(userId || '', collectionId || '', itemId, formData, modelFile, cleanFormData);
  };

  return (
    <article>
      <Helmet><title>create item - poppenhuis</title></Helmet>
      <PageHeader>
        {userId && collectionId ? <><QueryPreservingLink to={`/${userId}`}>{userId}</QueryPreservingLink> / <QueryPreservingLink to={`/${userId}/${collectionId}`}>{collectionId}</QueryPreservingLink> / create a new item</> : <>create a new item</>}
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
    />
    </article>
  );
}
