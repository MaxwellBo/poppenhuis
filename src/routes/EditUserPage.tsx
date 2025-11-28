import React, { useState, useEffect } from "react";
import { useParams } from "react-router";
import { rtdb } from "../firebase";
import { ref, get } from "firebase/database";
import { FirebaseForm } from "../components/FirebaseForm";
import { USER_FIELDS } from "../components/FirebaseFormFields";
import { useFirebaseForm } from "../hooks/useFirebaseForm";
import { useFirebaseSubmit } from "../hooks/useFirebaseSubmit";

export default function EditUserPage() {
  const { userId } = useParams<{ userId: string }>();
  const [isLoading, setIsLoading] = useState(true);
  
  const {
    formData,
    setFormData,
    handleInputChange,
    handleAddField,
    handleDeleteField,
  } = useFirebaseForm();

  const { isSubmitting, error, setError, updateUser } = useFirebaseSubmit();

  useEffect(() => {
    const loadUser = async () => {
      if (!userId) {
        setError("User ID is missing from URL");
        setIsLoading(false);
        return;
      }

      try {
        const userRef = ref(rtdb, `/${userId}`);
        const userSnapshot = await get(userRef);
        
        if (!userSnapshot.exists()) {
          setError(`User '${userId}' does not exist`);
          setIsLoading(false);
          return;
        }

        const userData = userSnapshot.val();
        setFormData({ ...userData });
        setIsLoading(false);
      } catch (err: any) {
        console.error("Failed to load user:", err);
        setError("Failed to load user: " + (err.message || err.toString()));
        setIsLoading(false);
      }
    };

    loadUser();
  }, [userId, setFormData, setError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateUser(userId || '', formData);
  };

  if (isLoading) {
    return (
      <article>
        <header>
          <h1>Loading...</h1>
        </header>
      </article>
    );
  }

  return (
    <FirebaseForm
      title={`Edit user: ${userId}`}
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
