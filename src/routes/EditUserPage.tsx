import React, { useEffect } from "react";
import { useLoaderData } from "react-router";
import { FirebaseForm } from "../components/FirebaseForm";
import { USER_FIELDS } from "../components/FirebaseFormFields";
import { useFirebaseForm } from "../hooks/useFirebaseForm";
import { useFirebaseSubmit } from "../hooks/useFirebaseSubmit";
import { loadUser } from "../manifest";

export const loader = loadUser;

export default function EditUserPage() {
  const { user } = useLoaderData() as Awaited<ReturnType<typeof loader>>;
  
  const {
    formData,
    setFormData,
    handleInputChange,
    handleAddField,
    handleDeleteField,
  } = useFirebaseForm();

  const { isSubmitting, error, updateUser } = useFirebaseSubmit();

  useEffect(() => {
    setFormData({ ...user });
  }, [user, setFormData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateUser(user.id, formData);
  };

  return (
    <FirebaseForm
      title={`Edit user: ${user.id}`}
      formData={formData}
      idField={{
        name: 'id',
        label: 'User ID',
        value: formData.id || '',
        onChange: () => {}, // ID is read-only
        readOnly: true,
      }}
      fields={USER_FIELDS}
      onInputChange={handleInputChange}
      onAddField={handleAddField}
      onDeleteField={handleDeleteField}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      error={error}
      submitButtonText={isSubmitting ? "Saving..." : "Save changes"}
    />
  );
}
