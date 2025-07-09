import { useLoaderData } from "react-router";
import { Size } from '../components/Size';
import { Collection, loadUser, User } from "../manifest";
import { metaForUser } from "../meta";
import { QueryPreservingLink } from "../components/QueryPreservingLink";
import { HelmetMeta } from "../components/HelmetMeta";
import { CollectionWithDescription } from "../components/CollectionWithDescription";
import { doc, setDoc } from "@firebase/firestore";
import { db } from "../firebase";
import { EditableMarkdown } from "../components/EditableMarkdown";

export const loader = loadUser;

export default function UserPage() {
  const { user } = useLoaderData() as Awaited<ReturnType<typeof loader>>;
  const userRef = doc(db, 'users2', user.id);

  return (
    <article>
      <HelmetMeta meta={metaForUser(user)} />
      <header>
        <h1>
          <QueryPreservingLink to="/">poppenhuis</QueryPreservingLink> / {user.name} / <Size ts={user.collections} t="collection" />
        </h1>
      </header>
      <div className="short description ugc">
        <EditableMarkdown value={user.bio} docRef={userRef} fieldName="bio" />
      </div>
      <div id="collection-rows">
        {user.collections.map((collection) =>
          <CollectionRow key={collection.id} collection={collection} user={user} />)}
      </div>
      <button onClick={async () => {
        const newCollectionId = prompt("Enter collection ID (you won't be able to change it later):");
        if (newCollectionId) {
          try {
            await setDoc(doc(db, 'users2', user.id, 'collections', newCollectionId), {
              name: newCollectionId,
            });
            window.location.reload();
          } catch (error) {
            alert('Failed to add collection: ' + JSON.stringify(error));
          }
        }
      }}>
        Add new collection
      </button>
    </article>
  );
}

function CollectionRow(props: { collection: Collection, user: User }) {
  const { collection, user } = props;
  return (
    <article className='collection-row'>
      <h3>
        <QueryPreservingLink to={`/${user.id}/${collection.id}`}>{collection.name}</QueryPreservingLink> <Size ts={collection.items} t="item" />
      </h3>
      <CollectionWithDescription collection={collection} user={user} />
    </article>
  );
}
