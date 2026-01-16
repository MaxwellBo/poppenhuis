import { GetServerSideProps } from "next";
import { Size } from '../../src/components/Size';
import { ItemCards } from '../../src/components/ItemCards';
import { Collection, User } from "../../src/manifest";
import { loadUser } from "../../src/manifest-extras";
import { metaForUser } from "../../src/meta";
import Markdown from "react-markdown";
import { QueryPreservingLink as NextQueryPreservingLink } from "../../src/components/NextQueryPreservingLink";
import { NextMetaHead } from "../../src/nextMeta";
import { PageHeader } from "../../src/components/PageHeader";
import * as yaml from 'js-yaml';

interface UserPageProps {
  user: User;
}

export const getServerSideProps: GetServerSideProps<UserPageProps> = async (context) => {
  const { userId } = context.params as { userId: string };
  const request = new Request(`http://localhost${context.resolvedUrl}`);
  
  try {
    const { user } = await loadUser({ params: { userId }, request });
    return {
      props: {
        user,
      },
    };
  } catch (error) {
    return {
      notFound: true,
    };
  }
};

export default function UserPage({ user }: UserPageProps) {
  const userYaml = yaml.dump(user);

  return (
    <article>
      <NextMetaHead meta={metaForUser(user)} />
      <PageHeader>
        {user.name} / <Size ts={user.collections} t="collection" />
      </PageHeader>
      {user.bio && <div className="short description ugc"><Markdown>{user.bio}</Markdown><br /></div>}
      {user.source === undefined && <div className="short">
        <a href={`https://github.com/MaxwellBo/poppenhuis/issues/new?template=put-collection.yml&user-id=${user.id}`}>+ add collection</a>
        , <a href={`https://github.com/MaxwellBo/poppenhuis/issues/new?template=put-user.yml&yaml-template=${encodeURIComponent(userYaml)}`}>edit?</a>
      </div>}
      {user.source === 'firebase' && <div className="short">
        <NextQueryPreservingLink to={`/${user.id}/new`}>+ new collection</NextQueryPreservingLink>
        , <NextQueryPreservingLink to={`/${user.id}/edit`}>edit?</NextQueryPreservingLink>
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
        <NextQueryPreservingLink to={`/${user.id}/${collection.id}`}>{collection.name}</NextQueryPreservingLink> <Size ts={collection.items} t="item" />
      </h3>
      {collection.description && <div className='short description ugc'><Markdown>{collection.description}</Markdown></div>}
      <ItemCards {...props} limit={6} />
    </article>
  );
}
