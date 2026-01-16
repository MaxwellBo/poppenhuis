import { GetServerSideProps } from 'next';
import React, { useState } from "react";
import Head from 'next/head';
import { FirebaseForm } from "../src/components/FirebaseForm";
import { USER_FIELD_SCHEMAS } from "../src/manifest";
import { useFirebaseForm } from "../src/hooks/useFirebaseForm";
import { useNextFirebaseSubmit } from "../src/hooks/useNextFirebaseSubmit";
import { PageHeader } from "../src/components/PageHeader";

export const getServerSideProps: GetServerSideProps = async () => {
  return { props: {} };
};

export default function NewUserPage() {
  const [userId, setUserId] = useState("");
  
  const {
    formData,
    handleInputChange,
    handleAddField,
    handleDeleteField,
    cleanFormData,
  } = useFirebaseForm({ initialData: { name: '' } });

  const { isSubmitting, error, upsertUser } = useNextFirebaseSubmit();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await upsertUser(userId, formData, cleanFormData);
  };

  return (
    <article>
      <Head><title>create user - poppenhuis</title></Head>
      <PageHeader>create a new user</PageHeader>
      <FirebaseForm
        formData={formData}
        idField={{
          name: 'userId',
          label: 'user ID',
          value: userId,
          onChange: setUserId,
        }}
        fields={Object.values(USER_FIELD_SCHEMAS)}
        onInputChange={handleInputChange}
        onAddField={handleAddField}
        onDeleteField={handleDeleteField}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        error={error}
        submitButtonText={isSubmitting ? "creating..." : "create user"}
      />
    </article>
  );
}
