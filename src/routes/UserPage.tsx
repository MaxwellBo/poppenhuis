import { useLoaderData } from "react-router";
import { Size } from '../components/Size';
import { ItemCards } from '../components/ItemCards';
import { Collection, loadUser, User } from "../manifest";
import { metaForUser } from "../meta";
import Markdown from "react-markdown";
import { QueryPreservingLink } from "../components/QueryPreservingLink";
import { HelmetMeta } from "../components/HelmetMeta";

export const loader = loadUser;

export default function UserPage() {
  const { user } = useLoaderData() as Awaited<ReturnType<typeof loader>>;

  return (
    <article>
      <HelmetMeta meta={metaForUser(user)} />
      <header>
        <h1>
          <QueryPreservingLink to="/">poppenhuis</QueryPreservingLink> / {user.name} / <Size ts={user.collections} t="collection" />
        </h1>
      </header>
      {user.bio && <><Markdown>{user.bio}</Markdown><br /></>}
      {user.collections.map((collection) =>
        <CollectionRow key={collection.id} collection={collection} user={user} />)}
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
      {collection.description && <p className='short description'><Markdown>{collection.description}</Markdown></p>}
      <ItemCards {...props} limit={6} />
    </article>
  );
}
