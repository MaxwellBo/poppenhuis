import { Size } from '../components/Size';
import { ItemCards } from '../components/ItemCards';
import { useLoaderData } from "react-router";
import { loadCollection } from "../manifest";
import { metaForCollection } from "../meta";
import Markdown from "react-markdown";
import { HelmetMeta } from '../components/HelmetMeta';
import { QueryPreservingLink } from '../components/QueryPreservingLink';
import * as yaml from 'js-yaml';

export const loader = loadCollection;

export default function CollectionPage() {
  const { collection, user } = useLoaderData() as Awaited<ReturnType<typeof loader>>;
  const collectionYaml = yaml.dump(collection);

  return <article>
    <HelmetMeta meta={metaForCollection(collection, user)} />
    <header>
      <h1>
        <QueryPreservingLink to="/">poppenhuis</QueryPreservingLink> / <QueryPreservingLink to={`/${user.id}`}>{user.name}</QueryPreservingLink> / {collection.name} / <Size ts={collection.items} t="item" />
      </h1>
    </header>
    {collection.description && <div className='short description ugc'><Markdown>{collection.description}</Markdown></div>}
    {user.source !== 'firebase' && <div className="short">
      <a href={`https://github.com/MaxwellBo/poppenhuis/issues/new?template=put-item.yml&user-id=${user.id}&collection-id=${collection.id}`}>+ put item</a>
      , <a href={`https://github.com/MaxwellBo/poppenhuis/issues/new?template=put-collection.yml&user-id=${user.id}&yaml-template=${encodeURIComponent(collectionYaml)}`}>edit</a>
    </div>}
    <ItemCards collection={collection} user={user} />
  </article>
}