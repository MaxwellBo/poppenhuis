type Manifest = User[];

export interface User {
  id: string;
  name: string;
  bio: string | JSX.Element; // JSX.Elements cannot be used with 3rd party manifests
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
  model: string;
  poster?: string;
  description?: string;
  // Dates
  releaseDate?: string;
  manufactureDate?: string;
  acquisitionDate?: string;
  captureDate?: string;
  // Capture details
  captureApp?: string;
  captureDevice?: string;
  captureMethod?: string;
  captureLatLong?: string;
  captureLocation?: string;
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
  description?: string;
  items: Item[];
}

interface Item {
  // Existential details
  id: string;
  name: string;
  model: string;
  poster?: string;
  description?: string;
  // Dates
  releaseDate?: string;
  manufactureDate?: string;
  acquisitionDate?: string;
  captureDate?: string;
  // Capture details
  captureApp?: string;
  captureDevice?: string;
  captureMethod?: string;
  captureLatLong?: string;
  captureLocation?: string;
  // Custom fields
  customFields?: {
    [key: string]: string | undefined;
  }
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
        id: "pedals",
        name: "Pedals",
        description: `I have a small collection of guitar pedals from an era where I was trying to get into the electric guitar. 
My abject failure to use them properly convinced me to stick to the classical guitar`,
        items: [
          {
            id: "plumes",
            name: "Plumes",
            model: "/models/plumes.glb",
            description: "EarthQuaker Devices Plumes Small Signal Shredder",
            releaseDate: "2019",
            manufactureDate: "2019",
            acquisitionDate: "2022",
            captureDate: "2024 May 22",
            captureLocation: "Darlinghurst",
            captureDevice: "Apple iPhone 13 Pro",
            captureMethod: "LiDAR",
            captureApp: "Polycam",
          },
          {
            id: "elcap",
            name: "El Capistan",
            model: "/models/elcap.glb",
            description: "Strymon El Capistan dTape Echo",
            acquisitionDate: "2022",
            captureDate: "2024 May 22",
            captureLocation: "Darlinghurst",
            captureDevice: "Apple iPhone 13 Pro",
            captureMethod: "LiDAR",
            captureApp: "Polycam",
          },
          {
            id: "multistomp",
            name: "MS-70CDR",
            model: "/models/multistomp.glb",
            description: "Zoom MS-70CDR MultiStomp",
            acquisitionDate: "2022",
            captureDate: "2024 May 22",
            captureLocation: "Darlinghurst",
            captureDevice: "Apple iPhone 13 Pro",
            captureMethod: "LiDAR",
            captureApp: "Polycam",
          },
          {
            id: "avrun",
            name: "Avalanche Run",
            model: "/models/avrun.glb",
            description: "EarthQuaker Devices Avalanche Run V2 Stereo Delay & Reverb",
            releaseDate: "2017",
            manufactureDate: "2017",
            acquisitionDate: "2022",
            captureDate: "2024 May 22",
            captureLocation: "Darlinghurst",
            captureDevice: "Apple iPhone 13 Pro",
            captureMethod: "LiDAR",
            captureApp: "Polycam",
          },
        ]
      },
      {
        id: "friends",
        name: "Friends",
        description: "always appreciated",
        items: [
          {
            id: "hamish",
            name: "Hamish",
            model: "/models/Hamish.glb",
            captureApp: "Polycam",
            captureDate: "2023 August 26 4:43PM",
            captureMethod: "LiDAR",
            captureDevice: "Apple iPhone 13 Pro"
          },
          {
            id: "dragan",
            description: "A man sitting and playing the accordion with partial surroundings included.",
            name: "Dragan",
            model: "/models/Dragan.glb",
            captureApp: "Polycam",
            captureMethod: "Photo mode",
            captureDate: "2024 May 22, 10:22PM",
            captureDevice: "Apple iPhone 11 Pro Max",
            customFields: {
              vertices: "25.4k",
            }
          },
          {
            id: "issy",
            name: "Islwyn",
            captureApp: "Polycam",
            model: "/models/Issy.glb",
            captureMethod: "LiDAR",
            captureDevice: "Apple iPhone 13 Pro",
            captureLocation: "West End",
            captureLatLong: "27.48 S, 153.01 E",
            captureDate: "2023 April 26 9:00PM"
          },
          {
            id: "lou-nathan",
            name: "Lou & Nathan",
            description: "We were at the park",
            captureApp: "Polycam",
            captureMethod: "LiDAR",
            model: "/models/LouNathan.glb",
            captureDevice: "Apple iPhone 13 Pro",
            captureDate: "2023 April 9 3:55 PM",
            captureLatLong: "33.89 S, 151.18 E",
            captureLocation: "Newtown"
          },
          {
            id: "jack",
            name: "Jack",
            captureApp: "Polycam",
            captureMethod: "LiDAR",
            model: "/models/Jack.glb",
            captureDevice: "Apple iPhone 13 Pro",
            captureDate: "2023 April 8 10:16 PM",
            captureLocation: "Sydney",
            captureLatLong: "33.88 S, 151.21 E"
          },
          {
            id: "sam",
            name: "Sam",
            captureApp: "Polycam",
            captureMethod: "LiDAR",
            model: "/models/Sam.glb",
            captureDevice: "Apple iPhone 13 Pro",
            captureDate: "2024 May 24 12:27 PM",
            captureLocation: "Canva, Surry Hills",
            releaseDate: "1999",
            manufactureDate: "1999"
          },
          {
            id: "tom",
            name: "Tom",
            captureMethod: "LiDAR",
            model: "/models/Tom.glb",
            captureDevice: "Apple iPhone 13 Pro",
            captureDate: "2024 May 24 12:36 PM",
            captureLocation: "Canva, Surry Hills",
          },
          {
            id: "jackie",
            name: "Jackie",
            captureApp: "Polycam",
            captureMethod: "LiDAR",
            model: "/models/Jackie.glb",
            captureDevice: "Apple iPhone 13 Pro",
            captureDate: "2024 May 21 8:00 PM",
            captureLocation: "Darlinghurst",
          },
          {
            id: "casey",
            name: "Casey",
            captureApp: "Polycam",
            captureMethod: "LiDAR",
            model: "/models/Casey.glb",
            captureDate: "2024 May 21",
            captureDevice: "Apple iPhone 13 Pro",
            captureLocation: "Canva, Surry Hills"
          },
          {
            id: "fran",
            name: "Fran",
            captureApp: "Polycam",
            captureMethod: "LiDAR",
            model: "/models/Fran.glb",
            captureDevice: "Apple iPhone 13 Pro",
            captureLocation: "Chippendale",
            captureDate: "2023 April 18 9:09 PM"
          },
          {
            id: "roman",
            name: "Roman",
            description: "The Thinker",
            captureApp: "Polycam",
            captureMethod: "LiDAR",
            model: "/models/Roman.glb",
            captureDate: "2024 May 21",
            captureDevice: "Apple iPhone 13 Pro",
            captureLocation: "Canva, Surry Hills"
          },
          { 
            id: "james",
            name: "James",
            captureApp: "Polycam",
            captureMethod: "LiDAR",
            model: "/models/James.glb",
            captureDevice: "Apple iPhone 13 Pro",
            captureLocation: "Some boat in the middle of Sydney Harbour",
            captureLatLong: "33.86 S, 151.20 E",
            captureDate: "2024 May 24 4:58PM"
          }
        ]
      }
    ]
  }
];

export async function loadUsers({ request }: { request: Request; }) {
  let thirdPartyManifest: Manifest = [];

  const manfiestUrl = new URL(request.url).searchParams.get('manifest');
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

export async function loadUser({ params, request }: { params: { userId: User['id']; }; request: Request; }) {
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
