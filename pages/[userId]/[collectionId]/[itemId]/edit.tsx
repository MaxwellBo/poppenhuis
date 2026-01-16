import React, { useEffect, useState } from "react";
import { GetServerSideProps } from "next";
import Head from 'next/head';
import { FirebaseForm } from "../../../../src/components/FirebaseForm";
import { ITEM_FIELD_SCHEMAS } from "../../../../src/manifest";
import { useFirebaseForm } from "../../../../src/hooks/useFirebaseForm";
import { useFirebaseSubmit } from "../../../../src/hooks/useFirebaseSubmit";
import { loadItem } from "../../../../src/manifest-extras";
import { QueryPreservingLink as NextQueryPreservingLink } from "../../../../src/components/NextQueryPreservingLink";
import { PageHeader } from "../../../../src/components/PageHeader";
import type { Item, Collection, User } from "../../../../src/manifest";

interface EditItemPageProps {
  item: Item;
  collection: Collection;
  user: User;
}

export const getServerSideProps: GetServerSideProps<EditItemPageProps> = async (context) => {
  const { userId, collectionId, itemId } = context.params as { userId: string; collectionId: string; itemId: string };
  const request = new Request(`http://localhost${context.resolvedUrl}`);
  
  try {
    const { item, collection, user } = await loadItem({ params: { userId, collectionId, itemId }, request });
    return {
      props: {
        item,
        collection,
        user,
      },
    };
  } catch (error) {
    return {
      notFound: true,
    };
  }
};

export default function EditItemPage({ item, collection, user }: EditItemPageProps) {
  const [modelFile, setModelFile] = useState<File | null>(null);
  
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
    await upsertItem(user.id, collection.id, item.id, formData, modelFile);
  };

  return (
    <article>
      <Head><title>edit {item.id} - poppenhuis</title></Head>
      <PageHeader>
        <NextQueryPreservingLink to={`/${user.id}`}>{user.name}</NextQueryPreservingLink> / <NextQueryPreservingLink to={`/${user.id}/${collection.id}`}>{collection.name}</NextQueryPreservingLink> / <NextQueryPreservingLink to={`/${user.id}/${collection.id}/${item.id}`}>{item.name}</NextQueryPreservingLink> / edit
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
    />
    </article>
  );
}
