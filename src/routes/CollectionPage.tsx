import { Helmet } from "react-helmet";
import { ItemCards, QueryPreservingLink } from "../utils";
import { useLoaderData } from "react-router";
import { loadCollection } from "../manifest";

export const loader = loadCollection;

export default function CollectionPage() {
  const { collection, user } = useLoaderData() as Awaited<ReturnType<typeof loader>>;

  return <article>
    <Helmet>
      <title>{collection.name} - poppenhuis</title>
      <meta name="description" content={`Collection of 3D models by ${user.name}`} />
    </Helmet>
    <header>
      <h1>
        <QueryPreservingLink to="/">poppenhuis</QueryPreservingLink> / <QueryPreservingLink to={`/${user.id}`}>{user.name}</QueryPreservingLink> / {collection.id} /
      </h1>
    </header>
    {collection.description && <p className='description'>{collection.description}</p>}
    <ItemCards collection={collection} user={user} />
  </article>
}