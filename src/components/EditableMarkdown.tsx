import { DatabaseReference, set, remove } from "firebase/database";
import { useState, useRef } from "react";
import Markdown from "react-markdown";

interface EditableMarkdownProps {
  value: string | undefined;
  dbRef: DatabaseReference;
  fieldName: string;
}

export function EditableMarkdown({ value, dbRef, fieldName }: EditableMarkdownProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(value || "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSave = async () => {
    try {
      await set(dbRef, content);
      window.location.reload();
    } catch (error) {
      console.error("Error saving:", error);
      alert("Error saving: " + error);
    }
  };

  const handleDelete = async () => {
    try {
      await remove(dbRef);
      window.location.reload();
    } catch (error) {
      console.error("Error deleting:", error);
      alert("Error deleting: " + error);
    }
  };

  const handleCancel = () => {
    setContent(value || "");
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="editable-markdown editing">
        <textarea
          ref={textareaRef}
          value={content}
          style={{ width: '100%', minWidth: '600px' }}
          placeholder="This text area supports Markdown syntax. You can use **bold**, *italic*, # headers, - lists, etc."
          onChange={(e) => setContent(e.target.value)}
          className="markdown-textarea"
        />
        <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          <button type="submit">Save</button>
          <button type="button" onClick={handleCancel}>Cancel</button>
        </form>
      </div>
    );
  }

  if (value === undefined) {
    return (
      <div className="editable-markdown">
        <button onClick={() => setIsEditing(true)} className="create-button">
          Create {fieldName}
        </button>
      </div>
    );
  }

  return (
    <div className="editable-markdown">
      <Markdown>{value}</Markdown>
      <button onClick={() => setIsEditing(true)} className="edit-button">
        Edit {fieldName}
      </button>
      <button type="button" onClick={handleDelete}>Delete {fieldName}</button>
    </div>
  );
}