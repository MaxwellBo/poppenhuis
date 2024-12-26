// @ts-nocheck

// netlify/edge-functions/transform.ts
import { Context } from "@netlify/edge-functions";
import { FIRST_PARTY_MANIFEST } from "../../src/manifest.tsx";

const BASE_URL = "https://poppenhu.is";

interface MetaTags {
  title: string;
  description: string;
  image?: string;
  url: string;
}

const FIRST_PARTY_MANIFEST = [
  {
    id: "jackie",
    name: "Jackie",
    collections: [
      {
        id: "cakes",
        name: "cakes",
        items: [
          {
            id: "brat",
            name: "brat cake",
            description: "brat winter - choc sponge cake with layers of apple jam, caramel, whipped cream, swiss meringue bc"
          },
          {
            id: "meringue-stack",
            name: "meringue stack"
          },
          {
            id: "ube-cheesecake",
            name: "ube burnt basque cheesecake with mochi & brownie layers",
            description: "be burnt basque cheesecake layered with mochi & choc brownie - almost went up in flames but was too delicious and sexy to die so she ended up toasty like a roasty marshmallow"
          },
          {
            id: "dark-forest-dragon",
            name: "dark forest dragon",
            description: "the dark forest - sweet dragon cakescape with black sesame cake, black cocoa buttercream, cherry compote, meringue & snowskin mooncakes"
          }
        ]
      }
    ]
  },
  {
    id: "mbo",
    name: "Max",
    collections: [
      {
        id: "guitars",
        name: "guitars",
        description: "I only have 3 at the moment, but peak collection size was 5. Sadly 2 were lost to the Queensland heat, when the glue of their bridges melted and sheared off.",
        items: [
          {
            id: "requinto",
            name: "a requinto",
            description: "A requinto guitar found in Paracho de Verduzco, Mexico. A requinto guitar has six nylon strings with a shorter scale length than a standard guitar."
          },
          {
            id: "yamaha",
            name: "Yamaha"
          },
          {
            id: "squire",
            name: "Stratocaster Squier",
            description: "The stickers came with the guitar when I got if off Facebook Marketplace for a whopping $50AUD."
          },
          {
            id: "kohala",
            name: "Kohala ukelele",
            description: "Not quite a guitar."
          }
        ]
      },
      {
        id: "pedals",
        name: "pedals",
        description: "I have a small collection of guitar pedals from an era where I was trying to get into the electric guitar. My abject failure to use them properly convinced me to stick to the classical guitar.",
        items: [
          {
            id: "plumes",
            name: "Plumes"
          },
          {
            id: "elcap",
            name: "El Capistan"
          },
          {
            id: "multistomp",
            name: "MultiStomp"
          },
          {
            id: "avrun",
            name: "Avalanche Run"
          }
        ]
      },
      {
        id: "friends",
        name: "friends",
        description: "Always appreciated (all parties have agreed to be on the site)",
        items: [
          {
            id: "cory",
            name: "Cory"
          },
          {
            id: "georgia",
            name: "Georgia"
          },
          {
            id: "kriti",
            name: "Kriti"
          },
          {
            id: "bec",
            name: "Bec"
          },
          {
            id: "qualtrough",
            name: "Qualtrough collective"
          },
          {
            id: "james",
            name: "James"
          },
          {
            id: "dragan",
            name: "Dragan"
          },
          {
            id: "jackie",
            name: "Jackie"
          },
          {
            id: "roman",
            name: "Roman",
            description: "The Thinker"
          },
          {
            id: "hamish",
            name: "Hamish"
          },
          {
            id: "sam",
            name: "Sam"
          },
          {
            id: "tom",
            name: "Tom"
          },
          {
            id: "casey",
            name: "Casey"
          },
          {
            id: "issy",
            name: "Islwyn",
            description: "Look closer. He is holding a game of Boggle."
          },
          {
            id: "fran",
            name: "Fran"
          },
          {
            id: "sarah",
            name: "Sarah"
          },
          {
            id: "liam",
            name: "Liam"
          },
          {
            id: "lou-nathan",
            name: "Lou & Nathan",
            description: "We were at the park"
          },
          {
            id: "jack",
            name: "Jack"
          },
          {
            id: "annaliese-riya",
            name: "Annaliese & Riya"
          }
        ]
      }
    ]
  },
  {
    id: "leaonie",
    name: "Leaonie",
    collections: [
      {
        id: "pottery",
        name: "pottery",
        items: [
          {
            id: "bear",
            name: "bear"
          },
          {
            id: "mouse-bowl",
            name: "mouse bowl"
          },
          {
            id: "vase",
            name: "vase"
          }
        ]
      }
    ]
  }
];


function parseRoute(pathname: string): { userId?: string; collectionId?: string; itemId?: string } {
  const parts = pathname.split('/').filter(Boolean);
  
  if (parts.length === 1) {
    return { userId: parts[0] };
  }
  
  if (parts.length === 2) {
    return { userId: parts[0], collectionId: parts[1] };
  }
  
  if (parts.length === 3) {
    return { userId: parts[0], collectionId: parts[1], itemId: parts[2] };
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
    <title>${tags.title}</title>
    <meta name="title" content="${tags.title}" />
    <meta property="twitter:title" content="${tags.title}" />
    <meta property="og:title" content="${tags.title}" />

    <meta name="description" content="${tags.description}" />
    <meta property="og:description" content="${tags.description}" />
    <meta property="twitter:description" content="${tags.description}" />

    <meta property="og:image" content="${tags.image}" />
    <meta property="twitter:image" content="${tags.image}" />

    <meta property="og:url" content="${tags.url}" />
    <meta property="twitter:url" content="${tags.url}" />
  `;
}

export default async function handler(req: Request, context: Context) {
  // Only transform HTML requests
  if (!req.headers.get("accept")?.includes("text/html")) {
    return context.next();
  }

  const url = new URL(req.url);
  const metaTags = generateMetaTags(url.pathname);
  const metaHTML = generateMetaHTML(metaTags);
  
  // Get the response from the origin
  const response = await context.next();
  const text = await response.text();
  
  // Replace everything between the meta markers
  const modifiedHTML = text.replace(
    /<!-- OPEN META -->[\s\S]*?<!-- CLOSE META -->/,
    `<!-- OPEN META -->\n${metaHTML}\n  <!-- CLOSE META -->`
  );
  
  return new Response(modifiedHTML, {
    headers: response.headers
  });
}
