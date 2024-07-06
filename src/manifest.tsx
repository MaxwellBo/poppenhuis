import { loadArenaSearchResultAsUser } from "./arena";

type Manifest = User[];

export interface User {
  id: string;
  name: string;
  bio?: string | JSX.Element; // JSX.Elements cannot be used with 3rd party manifests
  collections: Collection[];
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  items: Item[];
}

export interface Item {
  // Existential details
  id: string;
  name: string;
  formalName?: string;
  manufacturer?: string;
  model: string;
  poster?: string;
  description?: string;
  material?: string[];
  // Dates
  releaseDate?: string;
  manufactureDate?: string;
  acquisitionDate?: string;
  captureDate?: string;
  // Locations
  manufactureLocation?: string;
  acquisitionLocation?: string;
  captureLocation?: string;
  captureLatLon?: string;
  // Capture details
  captureApp?: string;
  captureDevice?: string;
  captureMethod?: string;
  // Custom fields
  customFields?: {
    [key: string]: string | undefined;
  };
}
// KEEP THIS IN SYNC WITH THE TYPES ABOVE PLEASE
export const MANIFEST_SCHEMA = `
type Manifest = User[];

interface User {
  id: string;
  name: string;
  bio: string | JSX.Element; // JSX.Elements cannot be used with 3rd party manifests
  collections: Collection[];
}

interface Collection {
  id: string;
  name: string;
  description?: string | JSX.Element;
  items: Item[];
}

interface Item {
  // Existential details
  id: string;
  name: string;
  formalName?: string;
  manufacturer?: string;
  model: string;
  poster?: string;
  description?: string;
  material?: string[];
  // Dates
  releaseDate?: string;
  manufactureDate?: string;
  acquisitionDate?: string;
  captureDate?: string;
  // Locations
  manufactureLocation?: string;
  acquisitionLocation?: string;
  captureLocation?: string;
  captureLatLon?: string;
  // Capture details
  captureApp?: string;
  captureDevice?: string;
  captureMethod?: string;
  // Custom fields
  customFields?: {
    [key: string]: string | undefined;
  };
}
`;

const FIRST_PARTY_MANIFEST: Manifest = [
  {
    id: "mbo",
    name: "Max Bo",
    bio: <p>
      <a href="https://maxbo.me">maxbo.me</a>, <a href="https://twitter.com/_max_bo_">twitter</a>
    </p>,
    collections: [
      {
        id: "guitars",
        name: "guitars",
        description: `I only have 3 at the moment, but peak collection size was 5. 
Sadly 2 were lost to the Queensland heat, when the glue of their bridges melted and sheared off.`,
        items: [
          {
            id: "requinto",
            description: `This requinto^ graciously gifted to me by my old guitar teacher. He found it in Paracho de Verduzco* (pop. 37000 in 2024), Mexico. He attempted to purchase it with a credit card but the store did not have a terminal, and the only bank in town was closed. The store owner said he could take it and send the money once he got back to Australia, which he did.

^ "The requinto [classical] guitar has six nylon strings with a scale length of 530 to 540 millimetres (20.9 to 21.3 in), which is about 18% smaller than a standard guitar scale. Requintos are tuned: A2-D3-G3-C4-E4-A4 (one fourth higher than the standard classical guitar)."

* "Paracho is well known throughout both Mexico and elsewhere in the world as a hub of lutherie [...] the town's craftsmen are reputed to make the best sounding guitars and vihuelas in all of Mexico."`,
            name: "a requinto",
            model: "/models/mbo/guitars/requinto.glb",
            manufacturer: "Jose Juan Granados",
            manufactureLocation: "Paracho de Verduzco, Mexico",
            manufactureDate: "2001 April",
            captureDate: "2024 May 31",
            captureMethod: "LiDAR",
            captureDevice: "Apple iPhone 13 Pro",
            captureApp: "Polycam",
            acquisitionDate: "2013",
            captureLocation: "West End, Brisbane",
          },
          {
            id: "yamaha",
            name: "Yamaha",
            model: "/models/mbo/guitars/yamaha.glb",
            material: ["cedar top", "rosewood back and sides"],
            formalName: "Yamaha CGX171CCA",
            manufacturer: "Yamaha",
            manufactureLocation: "Japan",
            captureDate: "2024 May 28",
            captureMethod: "LiDAR",
            captureDevice: "Apple iPhone 13 Pro",
            captureApp: "Polycam",
            acquisitionDate: "2010",
            captureLocation: "Darlinghurst, Sydney",
          },
          {
            id: "squire",
            name: "Stratocaster Squier",
            manufactureLocation: "China",
            manufacturer: "Fender",
            description: "The stickers came with the guitar when I got if off Facebook Marketplace for a whopping $50AUD.",
            model: "/models/mbo/guitars/squire.glb",
            captureDate: "2024 May 28",
            captureMethod: "LiDAR",
            captureDevice: "Apple iPhone 13 Pro",
            captureApp: "Polycam",
            acquisitionDate: "2022",
            captureLocation: "Darlinghurst, Sydney",
          },
          {
            id: "kohala",
            name: "Kohala ukelele",
            manufacturer: "Kohala",
            description: "Not quite a guitar.",
            model: "/models/mbo/guitars/kohala.glb",
            captureDate: "2024 May 28",
            captureMethod: "LiDAR",
            captureDevice: "Apple iPhone 13 Pro",
            captureApp: "Polycam",
            acquisitionDate: "2018",
            captureLocation: "Darlinghurst, Sydney",
          },
        ]
      },
      {
        id: "pedals",
        name: "pedals",
        description: `I have a small collection of guitar pedals from an era where I was trying to get into the electric guitar. 
My abject failure to use them properly convinced me to stick to the classical guitar.`,
        items: [
          {
            id: "plumes",
            name: "Plumes",
            model: "/models/mbo/pedals/plumes.glb",
            manufacturer: "EarthQuaker Devices",
            formalName: "EarthQuaker Devices Plumes Small Signal Shredder",
            releaseDate: "2019",
            manufactureDate: "2019",
            acquisitionDate: "2022?",
            captureDate: "2024 May 22",
            captureLocation: "Darlinghurst, Sydney",
            captureDevice: "Apple iPhone 13 Pro",
            captureMethod: "LiDAR",
            captureApp: "Polycam",
          },
          {
            id: "elcap",
            name: "El Capistan",
            manufacturer: "Strymon",
            model: "/models/mbo/pedals/elcap.glb",
            formalName: "Strymon El Capistan dTape Echo",
            acquisitionDate: "2022?",
            captureDate: "2024 May 22",
            captureLocation: "Darlinghurst, Sydney",
            captureDevice: "Apple iPhone 13 Pro",
            captureMethod: "LiDAR",
            captureApp: "Polycam",
          },
          {
            id: "multistomp",
            name: "MultiStomp",
            manufacturer: "Zoom",
            model: "/models/mbo/pedals/multistomp.glb",
            formalName: "Zoom MS-70CDR MultiStomp Chorus/Delay/Reverb Pedal",
            acquisitionDate: "2022?",
            captureDate: "2024 May 22",
            captureLocation: "Darlinghurst, Sydney",
            captureDevice: "Apple iPhone 13 Pro",
            captureMethod: "LiDAR",
            captureApp: "Polycam",
          },
          {
            id: "avrun",
            name: "Avalanche Run",
            manufacturer: "EarthQuaker Devices",
            model: "/models/mbo/pedals/avrun.glb",
            formalName: "EarthQuaker Devices Avalanche Run V2 Stereo Delay & Reverb",
            releaseDate: "2017",
            manufactureDate: "2017",
            acquisitionDate: "2022?",
            captureDate: "2024 May 22",
            captureLocation: "Darlinghurst, Sydney",
            captureDevice: "Apple iPhone 13 Pro",
            captureMethod: "LiDAR",
            captureApp: "Polycam",
          },
        ]
      },
      {
        id: "friends",
        name: "friends",
        description: "Always appreciated (all parties have agreed to be on the site)",
        items: [
          {
            id: "hamish",
            name: "Hamish",
            model: "/models/mbo/friends/Hamish.glb",
            captureApp: "Polycam",
            captureDate: "2023 August 26 4:43PM",
            captureMethod: "LiDAR",
            captureDevice: "Apple iPhone 13 Pro",
            acquisitionDate: "2021?"
          },
          {
            id: "dragan",
            description: "A man sitting and playing the accordion with partial surroundings included.",
            name: "Dragan",
            model: "/models/mbo/friends/Dragan.glb",
            captureApp: "Polycam",
            captureMethod: "Photo mode",
            captureDate: "2024 May 22, 10:22PM",
            captureDevice: "Apple iPhone 11 Pro Max",
            acquisitionDate: "2015?",
            customFields: {
              vertices: "25.4k",
            }
          },
          {
            id: "annaliese-riya",
            name: "Annaliese & Riya",
            model: "/models/mbo/friends/AnnalieseRiya.glb",
            captureApp: "Polycam",
            captureMethod: "LiDAR",
            captureDate: "2023 April 7 7:31PM",
            captureLocation: "Darlinghurst, Sydney",
            captureDevice: "Apple iPhone 13 Pro",
            acquisitionDate: "2019 & ???"
          },
          {
            id: "qualtrough",
            name: "Qualtrough collective",
            model: "/models/mbo/friends/Qualtrough.glb",
            captureApp: "Polycam",
            captureDate: "2024 June 29 9:17PM",
            captureLocation: "Woolloongabba, Brisbane",
            captureMethod: "LiDAR",
            captureDevice: "Apple iPhone 13 Pro",
            acquisitionDate: "2024"
          },
          {
            id: "issy",
            name: "Islwyn",
            description: "Look closer. He is holding a game of Boggle.",
            captureApp: "Polycam",
            model: "/models/mbo/friends/Issy.glb",
            captureMethod: "LiDAR",
            captureDevice: "Apple iPhone 13 Pro",
            captureLocation: "West End",
            captureLatLon: "27.48 S, 153.01 E",
            captureDate: "2023 April 26 9:00PM",
            acquisitionDate: "2012?"
          },
          {
            id: "lou-nathan",
            name: "Lou & Nathan",
            description: "We were at the park",
            captureApp: "Polycam",
            captureMethod: "LiDAR",
            model: "/models/mbo/friends/LouNathan.glb",
            captureDevice: "Apple iPhone 13 Pro",
            captureDate: "2023 April 9 3:55 PM",
            captureLatLon: "33.89 S, 151.18 E",
            captureLocation: "Newtown",
            acquisitionDate: "2022"
          },
          {
            id: "jack",
            name: "Jack",
            captureApp: "Polycam",
            captureMethod: "LiDAR",
            model: "/models/mbo/friends/Jack.glb",
            captureDevice: "Apple iPhone 13 Pro",
            captureDate: "2023 April 8 10:16 PM",
            acquisitionDate: "2022",
            captureLocation: "Sydney",
            captureLatLon: "33.88 S, 151.21 E"
          },
          {
            id: "sam",
            name: "Sam",
            captureApp: "Polycam",
            captureMethod: "LiDAR",
            model: "/models/mbo/friends/Sam.glb",
            captureDevice: "Apple iPhone 13 Pro",
            captureDate: "2024 May 24 12:27 PM",
            captureLocation: "Canva, Surry Hills, Sydney",
            releaseDate: "1999",
            manufactureDate: "1999",
            acquisitionDate: "2023"
          },
          {
            id: "tom",
            name: "Tom",
            captureMethod: "LiDAR",
            model: "/models/mbo/friends/Tom.glb",
            captureDevice: "Apple iPhone 13 Pro",
            captureDate: "2024 May 24 12:36 PM",
            captureLocation: "Canva, Surry Hills, Sydney",
            acquisitionDate: "2022"
          },
          {
            id: "liam",
            name: "Liam",
            captureMethod: "LiDAR",
            model: "/models/mbo/friends/Liam.glb",
            captureDevice: "Apple iPhone 13 Pro",
            acquisitionDate: "2022",
            captureLocation: "Redfern",
            captureLatLon: "33.89 S, 151.21 E",
            captureDate: "2023 Apr 22 at 10:40PM"
          },
          {
            id: "jackie",
            name: "Jackie",
            captureApp: "Polycam",
            captureMethod: "LiDAR",
            model: "/models/mbo/friends/Jackie.glb",
            captureDevice: "Apple iPhone 13 Pro",
            captureDate: "2024 May 21 8:00 PM",
            captureLocation: "Darlinghurst, Sydney",
            acquisitionDate: "2023"
          },
          {
            id: "casey",
            name: "Casey",
            captureApp: "Polycam",
            captureMethod: "LiDAR",
            model: "/models/mbo/friends/Casey.glb",
            captureDate: "2024 May 21",
            captureDevice: "Apple iPhone 13 Pro",
            captureLocation: "Canva, Surry Hills",
            acquisitionDate: "2022"
          },
          {
            id: "fran",
            name: "Fran",
            captureApp: "Polycam",
            captureMethod: "LiDAR",
            model: "/models/mbo/friends/Fran.glb",
            captureDevice: "Apple iPhone 13 Pro",
            captureLocation: "Chippendale, Sydney",
            captureDate: "2023 April 18 9:09 PM",
            acquisitionDate: "2015"
          },
          {
            id: "roman",
            name: "Roman",
            description: "The Thinker",
            captureApp: "Polycam",
            captureMethod: "LiDAR",
            model: "/models/mbo/friends/Roman.glb",
            captureDate: "2024 May 21",
            captureDevice: "Apple iPhone 13 Pro",
            captureLocation: "Canva, Surry Hills, Sydney",
            acquisitionDate: "2023"
          },
          { 
            id: "james",
            name: "James",
            captureApp: "Polycam",
            captureMethod: "LiDAR",
            model: "/models/mbo/friends/James.glb",
            captureDevice: "Apple iPhone 13 Pro",
            captureLocation: "Some boat in the middle of Sydney Harbour",
            captureLatLon: "33.86 S, 151.20 E",
            captureDate: "2024 May 24 4:58PM",
            acquisitionDate: "2015?"
          }
        ]
      }
    ]
  }
];

export const MANIFEST_URL_QUERY_PARAM = 'manifest';

export async function loadUsers({ request }: { request: Request; }) {
  let thirdPartyManifest: Manifest = [];

  const manfiestUrl = new URL(request.url).searchParams.get(MANIFEST_URL_QUERY_PARAM);

  if (manfiestUrl) {
    try {
      const response = await fetch(manfiestUrl);
      if (response.ok) {
        thirdPartyManifest = await response.json();
      }
    } catch (e) {
      console.error(e);
    }
  }

  return [...FIRST_PARTY_MANIFEST, ...thirdPartyManifest];
}

export const ARENA_QUERY_PARAM = 'arena';

export async function loadUser({ params, request }: { params: { userId: User['id']; }; request: Request; }): Promise<User> {
  const arenaParam = new URL(request.url).searchParams.get(ARENA_QUERY_PARAM);
  if (arenaParam) {
    return loadArenaSearchResultAsUser({ userSlug: params.userId });
  }

  const users = await loadUsers({ request });
  const user = users.find((user) => user.id === params.userId);
  if (!user) throw new Error("User not found");
  return user;
}

export async function loadCollection({ params, request }: { params: { userId: User['id']; collectionId: Collection['id']; }; request: Request; }) {
  const user = await loadUser({ params, request });
  const collection = user.collections.find((collection) => collection.id === params.collectionId);
  if (!collection) throw new Error("Collection not found");

  // sort by capture date lexiographically
  collection.items.sort((a, b) => {
    if (a.captureDate && b.captureDate) {
      // reverse
      return -a.captureDate.localeCompare(b.captureDate);
    }
    return 0;
  });

  return { collection, user };
}

export async function loadItem({ params, request }: { params: { userId: User['id']; collectionId: Collection['id']; itemId: Item['id']; }; request: Request; }) {
  const { collection, user } = await loadCollection({ params, request });
  const item = collection.items.find((item) => item.id === params.itemId);
  if (!item) throw new Error("Item not found");
  return { collection, user, item };
}
