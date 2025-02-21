import type { Collection, Item, User } from "./manifest";

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

export function metaForItem(item: Item, collection: Collection, user: User): Meta {
  return {
    title: `${item.name} - poppenhuis`,
    description: item.description ?? `3D model in the collection ${collection.name} by ${user.name}`,
    image: item.og ? `${BASE_URL}${item.og}` : `${BASE_URL}/og.png`,
    url: `${BASE_URL}/${user.id}/${collection.id}/${item.id}`,
  };
}

export function metaForCollection(collection: Collection, user: User): Meta {
  return {
    title: `${collection.name} - poppenhuis`,
    description: `Collection of 3D models by ${user.name}`,
    image: collection.og ? `${BASE_URL}${collection.og}` : `${BASE_URL}/og.png`,
    url: `${BASE_URL}/${user.id}/${collection.id}`,
  };
}

export function metaForUser(user: User): Meta {
  return {
    title: `${user.name} - poppenhuis`,
    description: user.bio ?? `Collection of 3D models by ${user.name}`,
    image: user.og ? `${BASE_URL}${user.og}` : `${BASE_URL}/og.png`,
    url: `${BASE_URL}/${user.id}`,
  };
}

export function metaToHtml(meta: Meta) {
  let { title, description, image, url } = meta;
  // sanitize the values so they're safe to interpolate into the HTML
  title = title.replace(/"/g, '&quot;');
  description = description.replace(/"/g, '&quot;');
  image = image.replace(/"/g, '&quot;');
  url = url.replace(/"/g, '&quot;');

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
