import { ItemCards, MetaBlock, QueryPreservingLink } from "../utils";
import { useLoaderData } from "react-router";
import { loadCollection } from "../manifest";
import { fromUser } from "../meta";
import Markdown from "react-markdown";

export const loader = loadCollection;

export default function CollectionPage() {
  const { collection, user } = useLoaderData() as Awaited<ReturnType<typeof loader>>;

  return <article>
    <MetaBlock meta={fromUser(user)} />
    <header>
      <h1>
        <QueryPreservingLink to="/">poppenhuis</QueryPreservingLink> / <QueryPreservingLink to={`/${user.id}`}>{user.name}</QueryPreservingLink> / {collection.id} /
      </h1>
    </header>
    {collection.description && <p className='description'><Markdown>{collection.description}</Markdown></p>}
    <ItemCards collection={collection} user={user} />
  </article>
}