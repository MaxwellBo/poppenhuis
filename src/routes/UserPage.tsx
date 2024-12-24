import { Helmet } from "react-helmet";
import { useLoaderData } from "react-router";
import { ItemCards, QueryPreservingLink, Size } from "../utils";
import { Collection, loadUser, User } from "../manifest";

export const loader = loadUser;

export default function UserPage() {
  const user = useLoaderData() as User;

  return (
    <article>
      <Helmet>
        <title>{user.name} - poppenhuis</title>
        {/* we can't put the bio in here because the bio could be a React tree */}
        <meta name="description" content={`Collections of 3D models by ${user.name}`} />
      </Helmet>
      <header>
        <h1>
          <QueryPreservingLink to="/">poppenhuis</QueryPreservingLink> / {user.name} /
        </h1>
      </header>
      {user.bio && <>{user.bio}<br /></>}
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
      {collection.description && <p className='short description'>{collection.description}</p>}
      <ItemCards {...props} limit={6} />
    </article>
  );
}
