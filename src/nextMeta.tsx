import Head from 'next/head';
import type { Collection, Item, User } from './manifest';

const BASE_URL = "https://poppenhu.is";

export interface NextMeta {
  title: string;
  description: string;
  image: string;
  url: string;
}

export const DEFAULT_META = {
  title: "poppenhuis",
  description: "a digital dollhouse",
  image: `${BASE_URL}/og.jpeg`,
  url: BASE_URL,
};

export function metaForItem(item: Item, collection: Collection, user: User): NextMeta {
  return {
    title: `${item.name} - poppenhuis`,
    description: item.description ?? `3D model in the collection ${collection.name} by ${user.name}`,
    image: item.og ? `${BASE_URL}${item.og}` : `${BASE_URL}/og.jpeg`,
    url: `${BASE_URL}/${user.id}/${collection.id}/${item.id}`,
  };
}

export function metaForCollection(collection: Collection, user: User): NextMeta {
  return {
    title: `${collection.name} - poppenhuis`,
    description: `Collection of 3D models by ${user.name}`,
    image: collection.og ? `${BASE_URL}${collection.og}` : `${BASE_URL}/og.jpeg`,
    url: `${BASE_URL}/${user.id}/${collection.id}`,
  };
}

export function metaForUser(user: User): NextMeta {
  return {
    title: `${user.name} - poppenhuis`,
    description: user.bio ?? `Collection of 3D models by ${user.name}`,
    image: user.og ? `${BASE_URL}${user.og}` : `${BASE_URL}/og.jpeg`,
    url: `${BASE_URL}/${user.id}`,
  };
}

export function NextMetaHead({ meta }: { meta: NextMeta }) {
  return (
    <Head>
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      <meta property="og:title" content={meta.title} />
      <meta property="og:description" content={meta.description} />
      <meta property="og:image" content={meta.image} />
      <meta property="og:url" content={meta.url} />
      <meta property="twitter:title" content={meta.title} />
      <meta property="twitter:description" content={meta.description} />
      <meta property="twitter:image" content={meta.image} />
      <meta property="twitter:url" content={meta.url} />
    </Head>
  );
}
