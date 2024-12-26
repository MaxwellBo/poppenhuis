import { Collection, Item, User } from "./manifest";

const BASE_URL = "https://poppenhu.is";

export interface Meta {
  title: string;
  description: string;
  image: string;
  url: string;
}

export const DEFAULT_META = {
  title: "poppenhuis",
  description: "a digital dollhouse",
  image: `${BASE_URL}/og.png`,
  url: BASE_URL,
};

export function fromCollection(collection: Collection, user: User): Meta {
  return {
    title: `${collection.name} - poppenhuis`,
    description: `Collection of 3D models by ${user.name}`,
    image: `${BASE_URL}/og.png`,
    url: `${BASE_URL}/${user.id}/${collection.id}`,
  };
}

export function fromItem(item: Item, collection: Collection, user: User): Meta {
  return {
    title: `${item.name} - poppenhuis`,
    description: item.description ?? "a digital dollhouse",
    image: `${BASE_URL}/og.png`,
    url: `${BASE_URL}/${user.id}/${collection.id}/${item.id}`,
  };
}

export function fromUser(user: User): Meta {
  return {
    title: `${user.name} - poppenhuis`,
    description: `Collection of 3D models by ${user.name}`,
    image: `${BASE_URL}/og.png`,
    url: `${BASE_URL}/${user.id}`,
  };
}

export function metaToHtml(meta: Meta) {
  return `
    <title>${meta.title}</title>
    <meta name="description" content="${meta.description}" />
    <meta property="og:title" content="${meta.title}" />
    <meta property="og:description" content="${meta.description}" />
    <meta property="og:image" content="${meta.image}" />
    <meta property="og:url" content="${meta.url}" />
    <meta property="twitter:title" content="${meta.title}" />
    <meta property="twitter:description" content="${meta.description}" />
    <meta property="twitter:image" content="${meta.image}" />
    <meta property="twitter:url" content="${meta.url}" />
  `;
}
