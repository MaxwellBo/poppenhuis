import { loadArenaUser } from "./arena";

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
  description?: string | JSX.Element;
  items: Item[];
}

export const ITEM_FIELD_DESCRIPTIONS = {
  formalName: "A more specific name (like a model number or a scientific name) than the general name.",
  model: "The path to the 3D model. Only glTF/GLB models are supported.",
  alt: "Custom text that will be used to describe the model to viewers who use a screen reader or otherwise depend on additional semantic context to understand what they are viewing.",
  poster: "The image to be displayed instead of the model it is loaded and ready to render.",
  releaseDate: `The release date and the manufacture date are subtly different. The release date is the date this item's specific variant was made available to the public. The manufacture date is the date the item was actually made.
      e.g. while the iPhone SE 1 was relased in 2016, it was manufactured up until 2018.`
};

export interface Item {
  // required fields
  id: string;
  name: string;
  // model-viewer fields
  model: string;
  poster?: string;
  alt?: string;
  // abstract details
  formalName?: string;
  releaseDate?: string;
  description?: string;
  // material reality
  manufacturer?: string;
  manufactureDate?: string;
  manufactureLocation?: string;
  material?: string[];
  // acquisition
  acquisitionDate?: string;
  acquisitionLocation?: string;
  // capture
  captureDate?: string;
  captureLocation?: string;
  captureLatLon?: string;
  captureDevice?: string;
  captureApp?: string;
  captureMethod?: string;
  // misc
  customFields?: {
    [key: string]: string | JSX.Element | undefined;
  };
}
// KEEP THIS IN SYNC WITH THE TYPES ABOVE PLEASE
export const MANIFEST_SCHEMA = `
type Manifest = User[];

interface User {
  id: string;
  name: string;
  bio?: string | JSX.Element; // JSX.Elements cannot be used with 3rd party manifests
  collections: Collection[];
}

interface Collection {
  id: string;
  name: string;
  description?: string | JSX.Element;
  items: Item[];
}

export const ITEM_FIELD_DESCRIPTIONS = {
  formalName: "A more specific name (like a model number or a scientific name) than the general name.",
  model: "The path to the 3D model. Only glTF/GLB models are supported.",
  alt: "Custom text that will be used to describe the model to viewers who use a screen reader or otherwise depend on additional semantic context to understand what they are viewing.",
  poster: "The image to be displayed instead of the model it is loaded and ready to render.",
  releaseDate: \`The release date and the manufacture date are subtly different. The release date is the date this item's specific variant was made available to the public. The manufacture date is the date the item was actually made.
      e.g. while the iPhone SE 1 was relased in 2016, it was manufactured up until 2018.\`
};

export interface Item {
  // required fields
  id: string;
  name: string;
  // model-viewer fields
  model: string;
  poster?: string;
  alt?: string;
  // abstract details
  formalName?: string;
  releaseDate?: string;
  description?: string;
  // material reality
  manufacturer?: string;
  manufactureDate?: string;
  manufactureLocation?: string;
  material?: string[];
  // acquisition
  acquisitionDate?: string;
  acquisitionLocation?: string;
  // capture
  captureDate?: string;
  captureLocation?: string;
  captureLatLon?: string;
  captureDevice?: string;
  captureApp?: string;
  captureMethod?: string;
  // misc
  customFields?: {
    [key: string]: string | JSX.Element | undefined;
  };
}
`;

const FIRST_PARTY_MANIFEST: Manifest = [
  {
    id: "jackie",
    name: "Jackie",
    bio: <p>
      cakes rule everything around me
      <br />
      baker & baby cook
      <br />
      <a href="https://www.instagram.com/bb.flambe/">baking Instagram</a>
    </p>,
    collections: [
      {
        id: "cakes",
        name: "cakes",
        items: [
          {
            id: "brat",
            releaseDate: "2024 July 21",
            name: "<br/>at cake",
            description: "<𝓫𝓻/>𝓪𝓽 𝔀𝓲𝓷𝓽𝓮𝓻 ✮ choc sponge cake w layers of apple jam, caramel, whipped cream, swiss meringue bc ✮ for @max.bo_ HTML in hyde (i’m now a woman in STEM) ᯓ★ ~ https://www.instagram.com/p/C91qasNS9YI/",
            model: "/models/jackie/cakes/brat.glb",
            manufacturer: "Jackie",
            material: ["chocolate sponge cake", "caramel sauce",
              "apple jam", "whipped cream", "Swiss meringue buttercream"],
            manufactureLocation: "Darlinghurst, Sydney",
            manufactureDate: "2024 July 21",
            captureDate: "2024 July 21, 10:35AM",
            captureLocation: "Darlinghurst, Sydney",
            captureMethod: "LiDAR",
            captureDevice: "Apple iPhone 13 Pro",
            captureApp: "Polycam",
            acquisitionDate: "2024 July 21",
            acquisitionLocation: "Darlinghurst, Sydney",
            customFields: {
              instagram: <a href="https://www.instagram.com/p/C91qasNS9YI/">instagram.com/p/C91qasNS9YI/</a>
            }
          },
          {
            id: "meringue-stack",
            releaseDate: "2024 July 21",
            manufacturer: "Jackie",
            manufactureDate: "2024 July 21",
            manufactureLocation: "Darlinghurst, Sydney",
            captureDate: "2024 July 21",
            captureLocation: "Darlinghurst, Sydney",
            captureMethod: "LiDAR",
            acquisitionDate: "2024 July 21",
            acquisitionLocation: "Darlinghurst, Sydney",
            name: "meringue stack",
            model: "/models/jackie/cakes/meringue-stack.glb",
            material: [
              "pavlova",
              "matcha whipped cream",
              "strawberries"
            ],
            captureDevice: "Apple iPhone 15 Pro Max",
          },
          {
            id: "ube-cheesecake",
            description: "𝒷𝑒 𝒷𝓊𝓇𝓃𝓉 𝒷𝒶𝓈𝓆𝓊𝑒 𝒸𝒽𝑒𝑒𝓈𝑒𝒸𝒶𝓀𝑒 𝓁𝒶𝓎𝑒𝓇𝑒𝒹 𝓌𝒾𝓉𝒽 𝓂𝑜𝒸𝒽𝒾 & 𝒸𝒽𝑜𝒸 𝒷𝓇𝑜𝓌𝓃𝒾𝑒 • almost went up in flames but was too DELICIOUS and sexy to die so she ended up toasty like a roasty marshmallow!?? @allyzli put this idea in my head and i couldn’t continue breathing til i made it (+ sweet basque minis, who wants some? •ᴗ•)",
            releaseDate: "2024 July 8",
            name: "ube burnt basque cheesecake with mochi & brownie layers",
            material: [
              "ube", "cream cheese", "mochi", "choc brownie",
              "soy caramel"
            ],
            manufacturer: "Jackie",
            manufactureLocation: "Darlinghurst, Sydney",
            manufactureDate: "2024 July 8",
            captureDate: "2024 July 8",
            captureLocation: "Darlinghurst, Sydney",
            captureMethod: "LiDAR",
            captureDevice: "Apple iPhone 15 Pro Max",
            captureApp: "Polycam",
            acquisitionDate: "2024 July 8",
            acquisitionLocation: "Darlinghurst, Sydney",
            model: "/models/jackie/cakes/ube-cheesecake.glb",
            customFields: {
              instagram: <a href="https://www.instagram.com/p/C9J_99XySH7">instagram.com/p/C9J_99XySH7/</a>
            }
          },
          {
            id: "dark-forest-dragon",
            description: "𝖙𝖍𝖊 𝖉𝖆𝖗𝖐 𝖋𝖔𝖗𝖊𝖘𝖙 ꕤǂ⋆𓍼my sweet lil dragun cakescape from the very first to final slices of black sesame cake, black cocoa buttercream, cherry compote, meringue & snowskin mooncakes •••• i think creating the head was my fav part ✮",
            material: [
              "black sesame cake",
              "black cocoa buttercream", "cherry compote", "meringue", "snowskin mooncakes"
            ],
            releaseDate: "2024 May 28",
            name: "dark forest dragon",
            model: "/models/jackie/cakes/dark-forest-dragon.glb",
            manufacturer: "Jackie",
            manufactureLocation: "Darlinghurst, Sydney",
            manufactureDate: "2024 May 28",
            captureDate: "2024 May 28",
            captureLocation: "Darlinghurst, Sydney",
            captureMethod: "LiDAR",
            captureDevice: "Apple iPhone 15 Pro Max",
            captureApp: "Polycam",
            acquisitionDate: "2024 May 28",
            acquisitionLocation: "Darlinghurst, Sydney",
            customFields: {
              instagram: <a href="https://www.instagram.com/p/C7fZJYsyAMi">instagram.com/p/C7fZJYsyAMi/</a>
            }
          },
        ]
      }
    ]
  },
  {
    id: "mbo",
    name: "Max",
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
            id: "cory",
            acquisitionDate: "2015",
            name: "Cory",
            captureApp: "Polycam",
            captureMethod: "LiDAR",
            model: "/models/mbo/friends/Cory.glb",
            captureDevice: "Apple iPhone 13 Pro",
            captureLocation: "Darlinghurst, Sydney",
            captureLatLon: "33.88 S, 151.21 E",
            captureDate: "2024 July 13 12:45PM"
          },
          {
            id: "georgia",
            name: "Georgia",
            acquisitionDate: "2022",
            captureApp: "Polycam",
            captureMethod: "LiDAR",
            model: "/models/mbo/friends/Georgia.glb",
            captureDevice: "Apple iPhone 13 Pro",
            captureLocation: "Panania, Sydney",
            captureLatLon: "33.96S, 151.00E",
            captureDate: "2024 April 22, 8:22PM",
            acquisitionLocation: "Sydney",
            material: ["coffee", "void", "cat hair"],
            manufactureLocation: "Perth",
            manufacturer: "Christina",
            releaseDate: "1998 October",
            manufactureDate: "1998",
          },
          {
            id: "kriti",
            name: "Kriti",
            acquisitionDate: "2015",
            captureApp: "Polycam",
            captureMethod: "LiDAR",
            model: "/models/mbo/friends/Kriti.glb",
            captureDevice: "Apple iPhone 13 Pro",
            captureLocation: "Darlinghurst, Sydney",
            captureLatLon: "33.88 S, 151.21 E",
            captureDate: "2024 July 13 12:39PM"
          },
          {
            id: "bec",
            name: "Bec",
            acquisitionDate: "2024",
            captureApp: "Polycam",
            captureMethod: "LiDAR",
            model: "/models/mbo/friends/Bec.glb",
            captureDevice: "Apple iPhone 13 Pro",
            captureLocation: "Redfern, Sydney",
            captureLatLon: "33.89 S, 151.20 E",
            captureDate: "2024 July 13 9:57PM"
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
          },
          {
            id: "dragan",
            alt: "A man sitting and playing the accordion with partial surroundings included.",
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
            id: "hamish",
            name: "Hamish",
            manufacturer: "Catherine",
            manufactureLocation: "Mater Mothers' Hospital, Brisbane",
            manufactureDate: "1999",
            releaseDate: "2000 February",
            material: ["flesh", "blood", "bone"],
            model: "/models/mbo/friends/Hamish.glb",
            captureApp: "Polycam",
            captureDate: "2023 August 26 4:43PM",
            captureLocation: "Canva, Surry Hills, Sydney",
            captureMethod: "LiDAR",
            captureDevice: "Apple iPhone 13 Pro",
            acquisitionDate: "2021",
            acquisitionLocation: "The Burrow, West End, Brisbane"
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
            id: "sarah",
            name: "Sarah",
            captureApp: "Polycam",
            captureMethod: "LiDAR",
            acquisitionDate: "2023",
            model: "/models/mbo/friends/Sarah.glb",
            captureDevice: "Apple iPhone 13 Pro",
            captureLocation: "Chippendale, Sydney",
            captureDate: "2023 April 18 9:13 PM",
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
        ]
      }
    ]
  }, {
    id: "leaonie",
    name: "Leaonie",
    collections: [
      {
        id: "pottery",
        name: "pottery",
        items: [
          {
            id: "bear",
            name: "bear",
            alt: "A simplistic white bear with a green hat on a small snowy base.",
            model: "/models/leaonie/pottery/bear.glb",
            manufacturer: "Leaonie",
            captureDevice: "Apple iPhone 14 Pro Max",
            captureMethod: "LiDAR",
            captureApp: "Polycam",
            captureDate: "2024 July 23",
            customFields: {
              "vertices": "28.4k"
            }
          },
          {
            id: "mouse-bowl",
            name: "mouse bowl",
            alt: "A small, ceramic cup with a cute mouse design, featuring textured sides and a rounded handle.",
            model: "/models/leaonie/pottery/mouse-bowl.glb",
            manufacturer: "Leaonie",
            captureDevice: "Apple iPhone 14 Pro Max",
            captureMethod: "Photo mode",
            captureApp: "Polycam",
            captureDate: "2024 July 23",
            customFields: {
              "vertices": "120.4k"
            }
          },
          {
            id: "vase",
            alt: "A textured ceramic vase with a narrow opening, displayed on a simple white stand.",
            name: "vase",
            model: "/models/leaonie/pottery/vase.glb",
            manufacturer: "Leaonie",
            captureDevice: "Apple iPhone 14 Pro Max",
            captureMethod: "LiDAR",
            captureApp: "Polycam",
            captureDate: "2024 July 23",
            customFields: {
              "vertices": "49.4k"
            }
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

export const ARENA_PREFIX = 'arena:';

export async function loadUser({ params, request }: { params: { userId: User['id']; }; request: Request; }): Promise<User> {
  const hasArenaPrefix = params.userId.startsWith(ARENA_PREFIX);

  if (hasArenaPrefix) {
    const userSlug = params.userId.slice(ARENA_PREFIX.length);
    return loadArenaUser({ userSlug });
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
  return { collection, user };
}

export async function loadItem({ params, request }: { params: { userId: User['id']; collectionId: Collection['id']; itemId: Item['id']; }; request: Request; }) {
  const { collection, user } = await loadCollection({ params, request });
  const item = collection.items.find((item) => item.id === params.itemId);
  if (!item) throw new Error("Item not found");
  return { collection, user, item };
}
