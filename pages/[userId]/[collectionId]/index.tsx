import { GetServerSideProps } from "next";
import { Size } from '../../../src/components/Size';
import { ItemCards } from '../../../src/components/NextItemCards';
import { loadCollection } from "../../../src/manifest-extras";
import { metaForCollection } from "../../../src/nextMeta";
import Markdown from "react-markdown";
import { NextMetaHead } from '../../../src/nextMeta';
import { QueryPreservingLink as NextQueryPreservingLink } from '../../../src/components/NextQueryPreservingLink';
import { PageHeader } from '../../../src/components/PageHeader';
import * as yaml from 'js-yaml';
import type { Collection, User } from "../../../src/manifest";

interface CollectionPageProps {
  collection: Collection;
  user: User;
}

export const getServerSideProps: GetServerSideProps<CollectionPageProps> = async (context) => {
  const { userId, collectionId } = context.params as { userId: string; collectionId: string };
  const request = new Request(`http://localhost${context.resolvedUrl}`);
  
  try {
    const { collection, user } = await loadCollection({ params: { userId, collectionId }, request });
    return {
      props: {
        collection,
        user,
      },
    };
  } catch (error) {
    return {
      notFound: true,
    };
  }
};

export default function CollectionPage({ collection, user }: CollectionPageProps) {
  const collectionYaml = yaml.dump(collection);

  return <article>
    <NextMetaHead meta={metaForCollection(collection, user)} />
    <PageHeader>
      <NextQueryPreservingLink to={`/${user.id}`}>{user.name}</NextQueryPreservingLink> / {collection.name} / <Size ts={collection.items} t="item" />
    </PageHeader>
    {collection.description && <div className='short description ugc'><Markdown>{collection.description}</Markdown></div>}
    {user.source === undefined && <div className="short">
      <a href={`https://github.com/MaxwellBo/poppenhuis/issues/new?template=put-item.yml&user-id=${user.id}&collection-id=${collection.id}`}>+ add item</a>
      , <a href={`https://github.com/MaxwellBo/poppenhuis/issues/new?template=put-collection.yml&user-id=${user.id}&yaml-template=${encodeURIComponent(collectionYaml)}`}>edit</a>
    </div>}
    {user.source === 'firebase' && <div className="short">
      <NextQueryPreservingLink to={`/${user.id}/${collection.id}/new`}>+ new item</NextQueryPreservingLink>
      , <NextQueryPreservingLink to={`/${user.id}/${collection.id}/edit`}>edit?</NextQueryPreservingLink>
    </div>}
    <ItemCards collection={collection} user={user} />
  </article>
}
