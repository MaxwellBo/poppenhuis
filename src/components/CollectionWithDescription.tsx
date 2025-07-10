import { ItemCards } from "./ItemCards";
import { Collection, User } from "../manifest";
import { EditableMarkdown } from "./EditableMarkdown";
import { ref, set } from "firebase/database";
import { rtdb } from "../firebase";

export function CollectionWithDescription(props: { collection: Collection, user: User }) {
  const { collection, user } = props;
  const collectionRef = ref(rtdb, `users2/${user.id}/collections/${collection.id}`);

  return <>
    <div className='short description ugc'>
      <EditableMarkdown
        value={collection.description}
        dbRef={collectionRef}
        fieldName="description"
      />
    </div>
    <ItemCards collection={collection} user={user} limit={6} />
    <button onClick={async () => {
      const newItemId = prompt("Enter item ID (you won't be able to change it later):");
      if (newItemId) {
      try {
        await set(ref(rtdb, `users2/${user.id}/collections/${collection.id}/items/${newItemId}`), {
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