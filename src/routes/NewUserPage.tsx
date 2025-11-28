import React, { useState } from "react";
import { FirebaseForm } from "../components/FirebaseForm";
import { USER_FIELDS } from "../components/FirebaseFormFields";
import { useFirebaseForm } from "../hooks/useFirebaseForm";
import { useFirebaseSubmit } from "../hooks/useFirebaseSubmit";

export default function NewUserPage() {
  const [userId, setUserId] = useState("");
  
  const {
    formData,
    handleInputChange,
    handleAddField,
    handleDeleteField,
    cleanFormData,
  } = useFirebaseForm({ initialData: { name: '' } });

  const { isSubmitting, error, createUser } = useFirebaseSubmit();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createUser(userId, formData, cleanFormData);
  };

  return (
    <FirebaseForm
      title="Create new user"
      formData={formData}
      idField={{
        name: 'userId',
        label: 'User ID',
        value: userId,
        onChange: setUserId,
      }}
      fields={USER_FIELDS}
      onInputChange={handleInputChange}
      onAddField={handleAddField}
      onDeleteField={handleDeleteField}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      error={error}
      submitButtonText={isSubmitting ? "Creating..." : "Create user"}
    />
  );
}
