import React, { useEffect } from "react";
import { GetServerSideProps } from "next";
import Head from 'next/head';
import { FirebaseForm } from "../../src/components/FirebaseForm";
import { USER_FIELD_SCHEMAS } from "../../src/manifest";
import { useFirebaseForm } from "../../src/hooks/useFirebaseForm";
import { useFirebaseSubmit } from "../../src/hooks/useFirebaseSubmit";
import { loadUser } from "../../src/manifest-extras";
import { QueryPreservingLink as NextQueryPreservingLink } from "../../src/components/NextQueryPreservingLink";
import { PageHeader } from "../../src/components/PageHeader";
import type { User } from "../../src/manifest";

interface EditUserPageProps {
  user: User;
}

export const getServerSideProps: GetServerSideProps<EditUserPageProps> = async (context) => {
  const { userId } = context.params as { userId: string };
  const request = new Request(`http://localhost${context.resolvedUrl}`);
  
  try {
    const { user } = await loadUser({ params: { userId }, request });
    return {
      props: {
        user,
      },
    };
  } catch (error) {
    return {
      notFound: true,
    };
  }
};

export default function EditUserPage({ user }: EditUserPageProps) {
  const {
    formData,
    setFormData,
    handleInputChange,
    handleAddField,
    handleDeleteField,
  } = useFirebaseForm();

  const { isSubmitting, error, upsertUser } = useFirebaseSubmit();

  useEffect(() => {
    setFormData({ ...user });
  }, [user, setFormData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await upsertUser(user.id, formData);
  };

  return (
    <article>
      <Head><title>edit {user.id} - poppenhuis</title></Head>
      <PageHeader>
        <NextQueryPreservingLink to={`/${user.id}`}>{user.name}</NextQueryPreservingLink> / edit
      </PageHeader>
      <FirebaseForm
        formData={formData}
      idField={{
        name: 'id',
        label: 'user ID',
        value: formData.id || '',
        onChange: () => {}, // ID is read-only
        readOnly: true,
      }}
      fields={Object.values(USER_FIELD_SCHEMAS)}
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
