import React, { useEffect } from "react";
import { useLoaderData } from "react-router";
import { Helmet } from 'react-helmet';
import { FirebaseForm } from "../components/FirebaseForm";
import { ITEM_FIELD_SCHEMAS } from "../manifest";
import { useFirebaseForm } from "../hooks/useFirebaseForm";
import { useFirebaseSubmit } from "../hooks/useFirebaseSubmit";
import { loadItem } from "../manifest";
import { QueryPreservingLink } from "../components/QueryPreservingLink";
import { CrumbSep, PageHeader } from "../components/PageHeader";

export const loader = loadItem;

export default function EditItemPage() {
  const { item, collection, user } = useLoaderData() as Awaited<ReturnType<typeof loader>>;
  
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

  // Filter out non-form fields
  const itemFields = Object.values(ITEM_FIELD_SCHEMAS)
    .filter(field => !['uszdModel', 'poster'].includes(field.name));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await upsertItem(user.id, collection.id, item.id, formData);
  };

  return (
    <article>
      <Helmet><title>edit {item.id} - poppenhuis</title></Helmet>
      <PageHeader>
        <QueryPreservingLink to="/">poppenhuis</QueryPreservingLink><CrumbSep /><QueryPreservingLink to={`/${user.id}`}>{user.name}</QueryPreservingLink><CrumbSep /><QueryPreservingLink to={`/${user.id}/${collection.id}`}>{collection.name}</QueryPreservingLink><CrumbSep /><QueryPreservingLink to={`/${user.id}/${collection.id}/${item.id}`}>{item.name}</QueryPreservingLink><CrumbSep />edit
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
        fields={itemFields}
        onInputChange={handleInputChange}
        onAddField={handleAddField}
        onDeleteField={handleDeleteField}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        error={error}
        submitButtonText={isSubmitting ? "saving..." : "save changes"}
        snapshotUploadProps={{
          userId: user.id,
          collectionId: collection.id,
          itemId: item.id,
        }}
      />
    </article>
  );
}
