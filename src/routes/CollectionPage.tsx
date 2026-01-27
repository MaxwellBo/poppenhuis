import { Size } from '../components/Size';
import { ItemCards } from '../components/ItemCards';
import { useLoaderData } from "react-router";
import { loadCollection } from "../manifest";
import { metaForCollection } from "../meta";
import Markdown from "react-markdown";
import { HelmetMeta } from '../components/HelmetMeta';
import { QueryPreservingLink } from '../components/QueryPreservingLink';
import { PageHeader } from '../components/PageHeader';
import * as yaml from 'js-yaml';

export const loader = loadCollection;

export default function CollectionPage() {
  const { collection, user } = useLoaderData() as Awaited<ReturnType<typeof loader>>;
  const collectionYaml = yaml.dump(collection);
  const meta = metaForCollection(collection, user);

  return <article>
    <HelmetMeta meta={meta} />
    <PageHeader>
      <QueryPreservingLink to="/">poppenhuis</QueryPreservingLink> / <QueryPreservingLink to={`/${user.id}`}>{user.name}</QueryPreservingLink> / {collection.name} / <Size ts={collection.items} t="item" />
    </PageHeader>
    <div className="header-content">
      {(user.source === undefined || user.source === 'firebase') && (
        <div className="header-actions">
          {user.source === undefined && (
            <>
              <a href={`https://github.com/MaxwellBo/poppenhuis/issues/new?template=put-item.yml&user-id=${user.id}&collection-id=${collection.id}`}>+ add item</a>
              <a href={`https://github.com/MaxwellBo/poppenhuis/issues/new?template=put-collection.yml&user-id=${user.id}&yaml-template=${encodeURIComponent(collectionYaml)}`}>edit?</a>
              <a href={meta.image}>og image</a>
            </>
          )}
          {user.source === 'firebase' && (
            <>
              <QueryPreservingLink to={`/${user.id}/${collection.id}/new`}>+ new item</QueryPreservingLink>
              <QueryPreservingLink to={`/${user.id}/${collection.id}/edit`}>edit?</QueryPreservingLink>
              <a href={meta.image}>og image</a>
            </>
            )}
          </div>
        )}
      {collection.description && <div className='short description ugc'><Markdown>{collection.description}</Markdown></div>}
    </div>
    <ItemCards collection={collection} user={user} />
  </article>
}