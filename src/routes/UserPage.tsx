import { useLoaderData, useSearchParams } from "react-router";
import { Size } from '../components/Size';
import { ItemCards } from '../components/ItemCards';
import { Collection, User, Item } from "../manifest";
import { loadUser } from "../manifest";
import { metaForUser } from "../meta";
import Markdown from "react-markdown";
import { QueryPreservingLink } from "../components/QueryPreservingLink";
import { HelmetMeta } from "../components/HelmetMeta";
import { PageHeader } from "../components/PageHeader";
import { RenderPage } from "../components/RenderPage";
import * as yaml from 'js-yaml';

export const loader = loadUser;

export default function UserPage() {
  const { user } = useLoaderData() as Awaited<ReturnType<typeof loader>>;
  const [searchParams] = useSearchParams();
  const renderMode = searchParams.get("render") === "true";

  const userYaml = yaml.dump(user);

  if (renderMode) {
    // Collect all items across all collections
    const allItems: Item[] = [];
    for (const collection of user.collections) {
      allItems.push(...collection.items);
    }
    
    return <RenderPage items={allItems} />;
  }

  return (
    <article>
      <HelmetMeta meta={metaForUser(user)} />
      <PageHeader>
        {user.name} / <Size ts={user.collections} t="collection" />
      </PageHeader>
      {user.bio && <div className="short description ugc"><Markdown>{user.bio}</Markdown><br /></div>}
      {user.source === undefined && <div className="short">
        <a href={`https://github.com/MaxwellBo/poppenhuis/issues/new?template=put-collection.yml&user-id=${user.id}`}>+ add collection</a>
        , <a href={`https://github.com/MaxwellBo/poppenhuis/issues/new?template=put-user.yml&yaml-template=${encodeURIComponent(userYaml)}`}>edit?</a>
      </div>}
      {user.source === 'firebase' && <div className="short">
        <QueryPreservingLink to={`/${user.id}/new`}>+ new collection</QueryPreservingLink>
        , <QueryPreservingLink to={`/${user.id}/edit`}>edit?</QueryPreservingLink>
      </div>}
      <div id="collection-rows">
        {user.collections.map((collection) =>
          <CollectionRow key={collection.id} collection={collection} user={user} />)}
      </div>
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
      {collection.description && <div className='short description ugc'><Markdown>{collection.description}</Markdown></div>}
      <ItemCards {...props} limit={6} />
    </article>
  );
}
