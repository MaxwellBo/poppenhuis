import React, { useState } from "react";
import { useRouter } from "next/router";
import Head from 'next/head';
import { FirebaseForm } from "../../../src/components/FirebaseForm";
import { ITEM_FIELD_SCHEMAS } from "../../../src/manifest";
import { useFirebaseForm } from "../../../src/hooks/useFirebaseForm";
import { useFirebaseSubmit } from "../../../src/hooks/useFirebaseSubmit";
import { QueryPreservingLink as NextQueryPreservingLink } from "../../../src/components/NextQueryPreservingLink";
import { PageHeader } from "../../../src/components/PageHeader";

export default function NewItemPage() {
  const router = useRouter();
  const { userId, collectionId } = router.query;
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
    await upsertItem(userId as string || '', collectionId as string || '', itemId, formData, modelFile, cleanFormData);
  };

  return (
    <article>
      <Head><title>create item - poppenhuis</title></Head>
      <PageHeader>
        {userId && collectionId ? <><NextQueryPreservingLink to={`/${userId}`}>{userId}</NextQueryPreservingLink> / <NextQueryPreservingLink to={`/${userId}/${collectionId}`}>{collectionId}</NextQueryPreservingLink> / create a new item</> : <>create a new item</>}
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
