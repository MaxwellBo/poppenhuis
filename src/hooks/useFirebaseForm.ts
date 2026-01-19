import { useState } from "react";

export interface UseFirebaseFormOptions {
  initialData?: Record<string, any>;
  requiredFields?: string[];
}

export function useFirebaseForm({ initialData = {}, requiredFields = ['name'] }: UseFirebaseFormOptions = {}) {
  const [formData, setFormData] = useState<Record<string, any>>(initialData);

  const handleInputChange = (field: string, value: string | File) => {
    setFormData(prev => ({ ...prev, [field]: value || undefined }));
  };

  const handleAddField = (field: string) => {
    setFormData(prev => ({ ...prev, [field]: '' }));
  };

  const handleDeleteField = (field: string) => {
    setFormData(prev => {
      const newData = { ...prev };
      delete newData[field];
      return newData;
    });
  };

  const validateRequired = (): boolean => {
    return requiredFields.every(field => formData[field]?.trim());
  };

  const cleanFormData = (): Record<string, any> => {
    const cleaned: Record<string, any> = {};
    
    Object.entries(formData).forEach(([key, value]) => {
      // Skip File objects and empty values
      if (value instanceof File) {
        return;
      }
      
      if (value !== undefined && value !== '') {
        // Handle material field - convert to array
        if (key === 'material' && typeof value === 'string') {
          cleaned[key] = value.split(",").map((m: string) => m.trim()).filter(Boolean);
        } else {
          cleaned[key] = value;
        }
      }
    });
    
    return cleaned;
  };

  return {
    formData,
    setFormData,
    handleInputChange,
    handleAddField,
    handleDeleteField,
    validateRequired,
    cleanFormData,
  };
}
