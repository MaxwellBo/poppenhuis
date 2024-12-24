// netlify/edge-functions/transform.ts
import { Context } from "@netlify/edge-functions";
import { FIRST_PARTY_MANIFEST, type User, type Collection, type Item } from "../../src/manifest";

const BASE_URL = "https://poppenhu.is";

interface MetaTags {
  title: string;
  description: string;
  image?: string;
  url: string;
}

function parseRoute(pathname: string): { userId?: string; collectionId?: string; itemId?: string } {
  const parts = pathname.split('/').filter(Boolean);
  
  if (parts[0] === 'users' && parts.length === 2) {
    return { userId: parts[1] };
  }
  
  if (parts[0] === 'users' && parts[2] === 'collections' && parts.length === 4) {
    return { userId: parts[1], collectionId: parts[3] };
  }
  
  if (parts[0] === 'users' && parts[2] === 'collections' && parts[4] === 'items' && parts.length === 6) {
    return { userId: parts[1], collectionId: parts[3], itemId: parts[5] };
  }
  
  return {};
}

function findUser(userId: string): User | undefined {
  return FIRST_PARTY_MANIFEST.find(user => user.id === userId);
}

function findCollection(user: User, collectionId: string): Collection | undefined {
  return user.collections.find(collection => collection.id === collectionId);
}

function findItem(collection: Collection, itemId: string): Item | undefined {
  return collection.items.find(item => item.id === itemId);
}

function generateMetaTags(pathname: string): MetaTags {
  const { userId, collectionId, itemId } = parseRoute(pathname);
  
  // Default tags
  const defaultTags: MetaTags = {
    title: "poppenhuis",
    description: "a digital dollhouse",
    image: `${BASE_URL}/og.png`,
    url: `${BASE_URL}${pathname}`
  };

  if (!userId) return defaultTags;
  
  const user = findUser(userId);
  if (!user) return defaultTags;
  
  if (!collectionId) {
    return {
      ...defaultTags,
      title: `${user.name}'s Collections | poppenhuis`,
      description: `View ${user.name}'s collections in the digital dollhouse`
    };
  }
  
  const collection = findCollection(user, collectionId);
  if (!collection) return defaultTags;
  
  if (!itemId) {
    return {
      ...defaultTags,
      title: `${collection.name} by ${user.name} | poppenhuis`,
      description: collection.description || defaultTags.description
    };
  }
  
  const item = findItem(collection, itemId);
  if (!item) return defaultTags;
  
  return {
    ...defaultTags,
    title: `${item.name} | ${collection.name} by ${user.name} | poppenhuis`,
    description: item.description || `View ${item.name} in ${user.name}'s ${collection.name} collection`,
    image: item.poster ? `${BASE_URL}${item.poster}` : defaultTags.image
  };
}

function generateMetaHTML(tags: MetaTags): string {
  return `
    <meta name="title" content="${tags.title}" />
    <meta name="description" content="${tags.description}" />
    
    <meta property="og:type" content="website" />
    <meta property="og:url" content="${tags.url}" />
    <meta property="og:title" content="${tags.title}" />
    <meta property="og:description" content="${tags.description}" />
    <meta property="og:image" content="${tags.image}" />
    
    <meta property="twitter:card" content="summary_large_image" />
    <meta property="twitter:url" content="${tags.url}" />
    <meta property="twitter:title" content="${tags.title}" />
    <meta property="twitter:description" content="${tags.description}" />
    <meta property="twitter:image" content="${tags.image}" />
  `;
}

export default async function handler(req: Request, context: Context) {
  // Only transform HTML requests
  if (!context.next().headers.get("content-type")?.includes("text/html")) {
    return context.next();
  }

  const url = new URL(req.url);
  const metaTags = generateMetaTags(url.pathname);
  const metaHTML = generateMetaHTML(metaTags);
  
  // Get the response from the origin
  const response = await context.next();
  const text = await response.text();
  
  // Replace the existing meta tags
  const modifiedHTML = text.replace(
    /<meta\s+(?:name|property)=["'](?:title|description|og:.*?|twitter:.*?)["']\s+content=["'].*?["']\s*\/?>/g,
    ""
  ).replace(
    /<\/head>/,
    `${metaHTML}\n</head>`
  );
  
  return new Response(modifiedHTML, {
    headers: response.headers
  });
}
