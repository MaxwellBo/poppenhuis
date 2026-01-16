import { GetServerSideProps } from "next";
import dynamic from "next/dynamic";
import { loadItem } from "../../../../src/manifest-extras";
import { QueryPreservingLink as NextQueryPreservingLink } from "../../../../src/components/NextQueryPreservingLink";
import type { Item, Collection, User } from "../../../../src/manifest";

const ModelViewerWrapper = dynamic(
  () => import("../../../../src/components/ModelViewerWrapper").then(mod => mod.ModelViewerWrapper),
  { ssr: false }
);

interface EmbedPageProps {
  item: Item;
  user: User;
  collection: Collection;
}

export const getServerSideProps: GetServerSideProps<EmbedPageProps> = async (context) => {
  const { userId, collectionId, itemId } = context.params as { userId: string; collectionId: string; itemId: string };
  const request = new Request(`http://localhost${context.resolvedUrl}`);
  
  try {
    const { item, user, collection } = await loadItem({ params: { userId, collectionId, itemId }, request });
    return {
      props: {
        item,
        user,
        collection,
      },
    };
  } catch (error) {
    return {
      notFound: true,
    };
  }
};

export default function EmbedPage({ item, user, collection }: EmbedPageProps) {
  return (
    <main id='embed-page'>
      <div className='breadcrumb'>
        <NextQueryPreservingLink to="/">poppenhuis</NextQueryPreservingLink> / <NextQueryPreservingLink to={`/${user.id}`}>{user.name}</NextQueryPreservingLink> / <NextQueryPreservingLink to={`/${user.id}/${collection.id}`}>{collection.name}</NextQueryPreservingLink> / <NextQueryPreservingLink to={`/${user.id}/${collection.id}/${item.id}`}>{item.name}</NextQueryPreservingLink>
      </div>
      <ModelViewerWrapper item={item} size='normal' />
    </main>
  );
}
