import Markdown from "react-markdown";
import { ItemCards } from "./ItemCards";
import { Collection, User } from "../manifest";
import { EditableMarkdown } from "./EditableMarkdown";
import { doc, setDoc } from "@firebase/firestore";
import { db } from "../firebase";

export function CollectionWithDescription(props: { collection: Collection, user: User }) {
  const { collection, user } = props;
  const collectionRef = doc(db, 'users2', user.id, 'collections', collection.id);

  return <>
    <div className='short description ugc'>
      <EditableMarkdown
        value={collection.description}
        docRef={collectionRef}
        fieldName="description"
      />
    </div>
    <ItemCards collection={collection} user={user} limit={6} />
    <button onClick={async () => {
      const newItemId = prompt("Enter item ID (you won't be able to change it later):");
      if (newItemId) {
      try {
        await setDoc(doc(db, 'users2', user.id, 'collections', collection.id, 'items', newItemId), {
        name: newItemId,
        });
        window.location.reload();
      } catch (error) {
        alert('Failed to add item: ' + JSON.stringify(error));
      }
      }
    }}>
      Add new item
    </button>
    
  </>
}