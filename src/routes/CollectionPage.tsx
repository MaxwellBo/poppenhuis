import { Size } from '../components/Size';
import { useLoaderData } from "react-router";
import { loadCollection } from "../manifest";
import { metaForCollection } from "../meta";
import { HelmetMeta } from '../components/HelmetMeta';
import { QueryPreservingLink } from '../components/QueryPreservingLink';
import { CollectionWithDescription } from '../components/CollectionWithDescription';

export const loader = loadCollection;

export default function CollectionPage() {
  const { collection, user } = useLoaderData() as Awaited<ReturnType<typeof loader>>;

  return <article>
    <HelmetMeta meta={metaForCollection(collection, user)} />
    <header>
      <h1>
        <QueryPreservingLink to="/">poppenhuis</QueryPreservingLink> / <QueryPreservingLink to={`/${user.id}`}>{user.name}</QueryPreservingLink> / {collection.name} / <Size ts={collection.items} t="item" />
      </h1>
    </header>
    <CollectionWithDescription collection={collection} user={user} />
  </article>
}