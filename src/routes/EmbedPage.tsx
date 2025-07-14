import { useLoaderData } from "react-router";
import { loadItem } from "../manifest";
import { QueryPreservingLink } from "../components/QueryPreservingLink";
import { ModelViewerWrapper } from "../components/ModelViewerWrapper";

export const loader = loadItem;

export default function EmbedPage() {
  const { item, user, collection } = useLoaderData() as Awaited<ReturnType<typeof loader>>;

  return (
    <main id='embed-page'>
      <div className='breadcrumb'>
        <QueryPreservingLink to="/">poppenhuis</QueryPreservingLink> / <QueryPreservingLink to={`/${user.id}`}>{user.name}</QueryPreservingLink> / <QueryPreservingLink to={`/${user.id}/${collection.id}`}>{collection.id}</QueryPreservingLink> / <QueryPreservingLink to={`/${user.id}/${collection.id}/${item.id}`}>{item.name}</QueryPreservingLink>
      </div>
      <ModelViewerWrapper item={item} size='normal' />
    </main>
  );
}