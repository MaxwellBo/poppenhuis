import { useLoaderData } from "react-router";
import { Size } from '../components/Size';
import { ItemCards } from '../components/ItemCards';
import { Collection, User } from "../manifest";
import { loadUser } from "../manifest";
import { metaForUser } from "../meta";
import Markdown from "react-markdown";
import { QueryPreservingLink } from "../components/QueryPreservingLink";
import { HelmetMeta } from "../components/HelmetMeta";
import { PageHeader } from "../components/PageHeader";
import * as yaml from '../yaml.ts';

export const loader = loadUser;

/** Items shown in each collection row. Later items are behind "see all". */
export const USER_PAGE_PREVIEW_LIMIT = 6;

export default function UserPage() {
  const { user } = useLoaderData() as Awaited<ReturnType<typeof loader>>;

  const userYaml = yaml.dump(user);
  const meta = metaForUser(user);

  return (
    <article>
      <HelmetMeta meta={meta} />
      <PageHeader>
        <QueryPreservingLink to="/">poppenhuis</QueryPreservingLink> / {user.name} / <Size ts={user.collections} t="collection" />
      </PageHeader>
      <div className="header-content">
        {(user.source === undefined || user.source === 'firebase') && (
          <div className="header-actions">
            {user.source === undefined && (
              <>
                <a href={`https://github.com/MaxwellBo/poppenhuis/issues/new?template=put-collection.yml&user-id=${user.id}`}>+ add collection</a>
                <a href={`https://github.com/MaxwellBo/poppenhuis/issues/new?template=put-user.yml&yaml-template=${encodeURIComponent(userYaml)}`}>edit?</a>
                <a href={meta.image}>og image</a>
              </>
            )}
            {user.source === 'firebase' && (
              <>
                <QueryPreservingLink to={`/${user.id}/new`}>+ new collection</QueryPreservingLink>
                <QueryPreservingLink to={`/${user.id}/edit`}>edit?</QueryPreservingLink>
                <a href={meta.image}>og image</a>
              </>
            )}
          </div>
        )}
        {user.bio && <div className="short description ugc"><Markdown>{user.bio}</Markdown><br /></div>}
      </div>
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
        <QueryPreservingLink to={`/${user.id}/${collection.id}`} viewTransition={collection.items.length > 0}>{collection.name}</QueryPreservingLink> <Size ts={collection.items} t="item" />
      </h3>
      {collection.description && <div className='short description ugc'><Markdown>{collection.description}</Markdown></div>}
      <div id="item-cards-wrapper">
        <ItemCards collection={collection} user={user} limit={USER_PAGE_PREVIEW_LIMIT} modelTransition userRowLimit={USER_PAGE_PREVIEW_LIMIT} />
      </div>
    </article>
  );
}
