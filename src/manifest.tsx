type Manifest = User[];

export interface User {
  id: string;
  name: string;
  og?: string;
  bio?: string; 
  collections: Collection[];
}

export interface Collection {
  id: string;
  name: string;
  og?: string;
  description?: string;
  items: Item[];
}

export const ITEM_FIELD_DESCRIPTIONS = {
  formalName: "A more specific name (like a model number or a scientific name) than the general name.",
  model: "The path to the 3D model. Only glTF/GLB models are supported.",
  alt: "Custom text that will be used to describe the model to viewers who use a screen reader or otherwise depend on additional semantic context to understand what they are viewing.",
  poster: "The image to be displayed instead of the model it is loaded and ready to render.",
  releaseDate: `The release date and the manufacture date are subtly different. The release date is the date this item's specific variant was made available to the public. The manufacture date is the date the item was actually made.
      e.g. while the iPhone SE 1 was released in 2016, it was manufactured up until 2018.`,
  og: "This is the image that will be displayed when this item is shared on social media.",
};

export interface Item {
  // required fields
  id: string;
  name: string;
  // model-viewer fields
  model: string;
  usdzModel?: string;
  og?: string;
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
  // post-acquisition
  storageLocation?: string;
  // capture
  captureDate?: string;
  captureLocation?: string;
  captureLatLon?: string;
  captureDevice?: string;
  captureApp?: string;
  captureMethod?: string;
  // misc
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
  bio?: string;
  collections: Collection[];
}

interface Collection {
  id: string;
  name: string;
  description?: string;
  items: Item[];
}

export const ITEM_FIELD_DESCRIPTIONS = {
  formalName: "A more specific name (like a model number or a scientific name) than the general name.",
  model: "The path to the 3D model. Only glTF/GLB models are supported.",
  alt: "Custom text that will be used to describe the model to viewers who use a screen reader or otherwise depend on additional semantic context to understand what they are viewing.",
  poster: "The image to be displayed instead of the model it is loaded and ready to render.",
  releaseDate: \`The release date and the manufacture date are subtly different. The release date is the date this item's specific variant was made available to the public. The manufacture date is the date the item was actually made.
      e.g. while the iPhone SE 1 was released in 2016, it was manufactured up until 2018.\`
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
  // post-acquisition
  storageLocation?: string;
  // capture
  captureDate?: string;
  captureLocation?: string;
  captureLatLon?: string;
  captureDevice?: string;
  captureApp?: string;
  captureMethod?: string;
  // misc
  customFields?: {
    [key: string]: string | undefined;
  };
}
`;

export const FIRST_PARTY_MANIFEST: Manifest = [
  // {
  //   id: "joey",
  //   name: "Joey",
  //   bio: "Living, laughing loving",
  //   og: "/models/joey/og.jpeg",
  //   collections: [
  //     {
  //       id: "stolen",
  //       name: "stolen from others",
  //       og: "/models/joey/stolen/og.jpeg",
  //       description: "i don't own these items but i took them from someone's house",
  //       items: [
  //         // {
  //         //   id: "mug",
  //         //   name: "mug",
  //         //   description: "a mug with writing on it",
  //         //   model: "/models/joey/stolen/mug.glb",
  //         // },
  //         {
  //           id: "film-camera",
  //           name: "film camera",
  //           model: "/models/joey/stolen/film-camera.glb",
  //         }
  //       ]
  //     }
  //   ]
  // },
  {
    id: "jackie",
    name: "Jackie",
    og: "/models/jackie/og.jpeg",
    bio: `cakes rule everything around me  
baker & baby cook  
[baking Instagram](https://www.instagram.com/bb.flambe/)`,
    collections: [
      {
        id: "cakes",
        name: "cakes",
        og: "/models/jackie/cakes/og.jpeg",
        items: [
          {
            id: "brat",
            releaseDate: "2024 July 21",
            name: "<br/>at cake",
            description: "<𝓫𝓻/>𝓪𝓽 𝔀𝓲𝓷𝓽𝓮𝓻 ✮ choc sponge cake w layers of apple jam, caramel, whipped cream, swiss meringue bc ✮ for @max.bo_ HTML in hyde (i'm now a woman in STEM) ᯓ★ ~ https://www.instagram.com/p/C91qasNS9YI/",
            model: "/models/jackie/cakes/brat.glb",
            og: "/models/jackie/cakes/brat.jpeg",
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
              instagram: "[instagram.com/p/C91qasNS9YI/](https://www.instagram.com/p/C91qasNS9YI/)"
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
            og: "/models/jackie/cakes/meringue-stack.jpeg",
            material: [
              "pavlova",
              "matcha whipped cream",
              "strawberries"
            ],
            captureDevice: "Apple iPhone 15 Pro Max",
          },
          {
            id: "ube-cheesecake",
            description: "𝒷𝑒 𝒷𝓊𝓇𝓃𝓉 𝒷𝒶𝓈𝓆𝓊𝑒 𝒸𝒽𝑒𝑒𝓈𝑒𝒸𝒶𝓀𝑒 𝓁𝒶𝓎𝑒𝓇𝑒𝒹 𝓌𝒾𝓉𝒽 𝓂𝑜𝒸𝒽𝒾 & 𝒸𝒽𝑜𝒸 𝒷𝓇𝑜𝓌𝓃𝒾𝑒 • almost went up in flames but was too DELICIOUS and sexy to die so she ended up toasty like a roasty marshmallow!?? @allyzli put this idea in my head and i couldn't continue breathing til i made it (+ sweet basque minis, who wants some? •ᴗ•)",
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
            og: "/models/jackie/cakes/ube-cheesecake.jpeg",
            customFields: {
              instagram: "[instagram.com/p/C9J_99XySH7](https://www.instagram.com/p/C9J_99XySH7)"
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
            og: "/models/jackie/cakes/dark-forest-dragon.jpeg",
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
              instagram: "[instagram.com/p/C7fZJYsyAMi/](https://www.instagram.com/p/C7fZJYsyAMi)"
            }
          },
        ]
      }
    ]
  },
  {
    id: "mbo",
    og: "/models/mbo/og.jpeg",
    name: "Max",
    bio: "[maxbo.me](https://maxbo.me), [twitter](https://twitter.com/_max_bo_)",
    collections: [
      {
        id: "plucked-instruments",
        name: "plucked instruments",
        og: "/models/mbo/plucked-instruments/og.jpeg",
        description: `Not listed: 2 classical guitars that were lost to the Queensland heat, when the glue of their bridges melted and sheared off.`,
        items: [
          {
            id: "requinto",
            description: `This requinto^ graciously gifted to me by my old guitar teacher. He found it in Paracho de Verduzco* (pop. 37000 in 2024), Mexico. He attempted to purchase it with a credit card but the store did not have a terminal, and the only bank in town was closed. The store owner said he could take it and send the money once he got back to Australia, which he did.

^"The requinto [classical] guitar has six nylon strings with a scale length of 530 to 540 millimetres (20.9 to 21.3 in), which is about 18% smaller than a standard guitar scale. Requintos are tuned: A2-D3-G3-C4-E4-A4 (one fourth higher than the standard classical guitar)."

*"Paracho is well known throughout both Mexico and elsewhere in the world as a hub of lutherie [...] the town's craftsmen are reputed to make the best sounding guitars and vihuelas in all of Mexico."`,
            name: "a requinto",
            model: "/models/mbo/plucked-instruments/requinto.glb",
            og: "/models/mbo/plucked-instruments/requinto.jpeg",
            manufacturer: "Jose Juan Granados",
            manufactureLocation: "Paracho de Verduzco, Mexico",
            manufactureDate: "2001 April",
            captureDate: "2024 May 31",
            captureMethod: "LiDAR",
            captureDevice: "Apple iPhone 13 Pro",
            captureApp: "Polycam",
            acquisitionDate: "2013",
            acquisitionLocation: "East Brisbane, Brisbane",
            captureLocation: "West End, Brisbane",
            storageLocation: "Kangaroo Point, Brisbane",
          },
          {
            id: "yamaha",
            name: "Yamaha",
            model: "/models/mbo/plucked-instruments/yamaha.glb",
            og: "/models/mbo/plucked-instruments/yamaha.jpeg",
            material: ["cedar top", "rosewood back and sides", "ebony fretboard"],
            formalName: "Yamaha CGX171CCA",
            manufacturer: "Yamaha",
            manufactureLocation: "Japan",
            captureDate: "2024 May 28",
            captureMethod: "LiDAR",
            captureDevice: "Apple iPhone 13 Pro",
            captureApp: "Polycam",
            acquisitionDate: "2010",
            acquisitionLocation: "Tokyo",
            captureLocation: "Darlinghurst, Sydney",
            storageLocation: "New York City",
          },
          {
            id: "cordoba",
            name: "Cordoba C9 Parlor",
            manufactureLocation: "China",
            material: ["western red cedar top", "African mahogany back and sides"],
            description: "[Product page](https://cordobaguitars.com/product/c9-parlor/)",
            model: "/models/mbo/plucked-instruments/cordoba.glb",
            og: "/models/mbo/plucked-instruments/cordoba.jpeg",
            manufacturer: "Cordoba",
            captureDate: "2025 October 2 8:21PM",
            acquisitionDate: "2025 October 1",
            acquisitionLocation: "New York City",
            captureMethod: "Guided Object Mode",
            captureDevice: "Apple iPhone 13 Pro",
            captureLatLon: "40.75 N, 74.00 W",
            captureLocation: "New York City",
            storageLocation: "New York City"
          },
          {
            id: "squire",
            name: "Stratocaster Squier",
            manufactureLocation: "China",
            manufacturer: "Fender",
            description: "The stickers came with the guitar when I got if off Facebook Marketplace for a whopping $50AUD.",
            model: "/models/mbo/plucked-instruments/squire.glb",
            og: "/models/mbo/plucked-instruments/squire.jpeg",
            captureDate: "2024 May 28",
            captureMethod: "LiDAR",
            captureDevice: "Apple iPhone 13 Pro",
            captureApp: "Polycam",
            acquisitionDate: "2022",
            acquisitionLocation: "Sydney",
            captureLocation: "Darlinghurst, Sydney",
            storageLocation: "Darlinghurst, Sydney",
          },
          {
            id: "kohala",
            name: "Kohala ukelele",
            manufacturer: "Kohala",
            description: "A gift from my mum.",
            model: "/models/mbo/plucked-instruments/kohala.glb",
            og: "/models/mbo/plucked-instruments/kohala.jpeg",
            captureDate: "2024 May 28",
            captureMethod: "LiDAR",
            captureDevice: "Apple iPhone 13 Pro",
            captureApp: "Polycam",
            acquisitionDate: "2018",
            acquisitionLocation: "Honolulu",
            captureLocation: "Darlinghurst, Sydney",
            storageLocation: "New York City",
          },
          {
            id: "kalimba",
            name: "Moozica Kalimba",
            formalName: "Moozica K17K",
            model: "/models/mbo/plucked-instruments/moozica.glb",
            manufacturer: "Moozica",
            og: "/models/mbo/plucked-instruments/moozica.jpeg",
            captureDate: "2024 August 19 9:30PM",
            captureMethod: "LiDAR",
            captureDevice: "Apple iPhone 13 Pro",
            captureApp: "Polycam",
            acquisitionDate: "2022",
            acquisitionLocation: "Sydney",
            captureLocation: "Darlinghurst, Sydney",
            storageLocation: "New York City",
          },
        ]
      },
      {
        id: "pedals",
        name: "pedals",
        og: "/models/mbo/pedals/og.jpeg",
        description: `I have a small collection of guitar pedals from an era where I was trying to get into the electric guitar. 
My abject failure to use them properly convinced me to stick to the classical guitar.`,
        items: [
          {
            id: "plumes",
            name: "Plumes",
            model: "/models/mbo/pedals/plumes.glb",
            usdzModel: "/models/mbo/pedals/plumes.usdz",
            og: "/models/mbo/pedals/plumes.jpeg",
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
            storageLocation: "Darlinghurst, Sydney",
          },
          {
            id: "elcap",
            name: "El Capistan",
            manufacturer: "Strymon",
            model: "/models/mbo/pedals/elcap.glb",
            usdzModel: "/models/mbo/pedals/elcap.usdz",
            og: "/models/mbo/pedals/elcap.jpeg",
            formalName: "Strymon El Capistan dTape Echo",
            acquisitionDate: "2022?",
            acquisitionLocation: "Pedal Empire, Moorooka, Brisbane",
            captureDate: "2024 May 22",
            captureLocation: "Darlinghurst, Sydney",
            captureDevice: "Apple iPhone 13 Pro",
            captureMethod: "LiDAR",
            captureApp: "Polycam",
            storageLocation: "Darlinghurst, Sydney",
          },
          {
            id: "multistomp",
            name: "MultiStomp",
            manufacturer: "Zoom",
            model: "/models/mbo/pedals/multistomp.glb",
            usdzModel: "/models/mbo/pedals/multistomp.usdz",
            og: "/models/mbo/pedals/multistomp.jpeg",
            formalName: "Zoom MS-70CDR MultiStomp Chorus/Delay/Reverb Pedal",
            acquisitionDate: "2022?",
            captureDate: "2024 May 22",
            captureLocation: "Darlinghurst, Sydney",
            captureDevice: "Apple iPhone 13 Pro",
            captureMethod: "LiDAR",
            captureApp: "Polycam",
            storageLocation: "Darlinghurst, Sydney",
          },
          {
            id: "avrun",
            name: "Avalanche Run",
            manufacturer: "EarthQuaker Devices",
            model: "/models/mbo/pedals/avrun.glb",
            usdzModel: "/models/mbo/pedals/avrun.usdz",
            og: "/models/mbo/pedals/avrun.jpeg",
            formalName: "EarthQuaker Devices Avalanche Run V2 Stereo Delay & Reverb",
            acquisitionLocation: "Pedal Empire, Moorooka, Brisbane",
            releaseDate: "2017",
            manufactureDate: "2017",
            acquisitionDate: "2022?",
            captureDate: "2024 May 22",
            captureLocation: "Darlinghurst, Sydney",
            captureDevice: "Apple iPhone 13 Pro",
            captureMethod: "LiDAR",
            captureApp: "Polycam",
            storageLocation: "Darlinghurst, Sydney",
          },
        ]
      },
      {
        id: "badminton-racquets",
        name: "badminton racquets",
        items: [
          {
            id: "hello-kitty",
            name: "Hello Kitty",
            model: "/models/mbo/badminton-racquets/hello-kitty.glb",
            manufacturer: "Victor",
            formalName: "Victor X Hello Kitty DriveX DX-KT Badminton Racquet 4U(83g)G5",
            acquisitionDate: "2023 October 28",
            acquisitionLocation: "Sydney",
            captureDate: "2025 Jul 27",
            captureLocation: "Darlinghurst, Sydney",
            captureDevice: "Apple iPhone 13 Pro",
            captureMethod: "Photo mode",
            captureApp: "Polycam",
            storageLocation: "Darlinghurst, Sydney",
          },
          {
            id: "jetspeed",
            name: "Jetspeed",
            model: "/models/mbo/badminton-racquets/jetspeed.glb",
            manufacturer: "Victor",
            formalName: "Victor Jetspeed S T1 Badminton Racquet 4U(83g)G5",
            acquisitionDate: "2022",
            acquisitionLocation: "Sydney",
            captureDate: "2025 Jul 27",
            captureLocation: "Darlinghurst, Sydney",
            captureDevice: "Apple iPhone 13 Pro",
            captureMethod: "Photo mode",
            captureApp: "Polycam",
            storageLocation: "Darlinghurst, Sydney",
          }
        ]
      },
      {
        id: "friends",
        name: "friends",
        og: "/models/mbo/friends/og.jpeg",
        description: "Always appreciated (all parties have agreed to be on the site)",
        items: [
          {
            id: "cory",
            acquisitionDate: "2015",
            name: "Cory",
            captureApp: "Polycam",
            captureMethod: "LiDAR",
            model: "/models/mbo/friends/Cory.glb",
            og: "/models/mbo/friends/Cory.jpeg",
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
            og: "/models/mbo/friends/Georgia.jpeg",
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
            og: "/models/mbo/friends/Kriti.jpeg",
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
            og: "/models/mbo/friends/Bec.jpeg",
            captureDevice: "Apple iPhone 13 Pro",
            captureLocation: "Redfern, Sydney",
            captureLatLon: "33.89 S, 151.20 E",
            captureDate: "2024 July 13 9:57PM"
          },
          {
            id: "lucia",
            name: "Lucia",
            acquisitionDate: "2025 Jul 3",
            captureApp: "Polycam",
            captureMethod: "LiDAR",
            captureDevice: "Apple iPhone 13 Pro",
            captureLocation: "Enmore, Sydney",
            captureLatLon: "33.90 S, 151.17 E",
            captureDate: "2025 Jul 3 8:30PM",
            model: "/models/mbo/friends/Lucia.glb",
            og: "/models/mbo/friends/Lucia.jpeg",
          },
          {
            id: "qualtrough",
            name: "Qualtrough collective",
            model: "/models/mbo/friends/Qualtrough.glb",
            og: "/models/mbo/friends/Qualtrough.jpeg",
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
            og: "/models/mbo/friends/James.jpeg",
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
            og: "/models/mbo/friends/Dragan.jpeg",
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
            og: "/models/mbo/friends/Jackie.jpeg",
            captureDevice: "Apple iPhone 13 Pro",
            captureDate: "2024 May 21 8:00 PM",
            captureLocation: "Darlinghurst, Sydney",
            acquisitionDate: "2023"
          },
          {
            id: "matchamonday",
            name: "Matcha Monday",
            description: "[matcha.sydney](https://matcha.sydney/)",
            captureApp: "Polycam",
            captureMethod: "LiDAR",
            model: "/models/mbo/friends/MatchaMonday.glb",
            og: "/models/mbo/friends/MatchaMonday.jpeg",
            captureDevice: "Apple iPhone 13 Pro",
            captureDate: "2025 Jun 9",
            captureLocation: "Parami, Sydney",
          },
          {
            id: "peter",
            name: "Peter",
            model: "/models/mbo/friends/Peter.glb",
            captureLocation: "Atlassian, Sydney",
            captureApp: "Polycam",
            captureMethod: "LiDAR",
            og: "/models/mbo/friends/Peter.jpeg",
            captureDevice: "Apple iPhone 13 Pro",
            captureDate: "2024 November 22 7:03PM",
            captureLatLon: "33.87 S, 151.21 E",
            releaseDate: "1991",
            manufactureDate: "1990",
            manufacturer: "Helen",
            acquisitionDate: "2019",
            acquisitionLocation: "Atlassian, Sydney, Australia",
            storageLocation: "Melbourne, Australia",
            manufactureLocation: "Plymouth, UK",
          },
          {
            id: "roman",
            name: "Roman",
            description: "The Thinker",
            captureApp: "Polycam",
            captureMethod: "LiDAR",
            model: "/models/mbo/friends/Roman.glb",
            og: "/models/mbo/friends/Roman.jpeg",
            captureDate: "2024 May 21",
            captureDevice: "Apple iPhone 13 Pro",
            captureLocation: "Canva, Surry Hills, Sydney",
            acquisitionDate: "2023"
          },
          {
            id: "hamish",
            name: "Hamish",
            manufacturer: "Catherine",
            manufactureDate: "1999",
            releaseDate: "2000 February",
            material: ["flesh", "blood", "bone"],
            model: "/models/mbo/friends/Hamish.glb",
            og: "/models/mbo/friends/Hamish.jpeg",
            captureApp: "Polycam",
            captureDate: "2023 August 26 4:43PM",
            captureLocation: "Canva, Surry Hills, Sydney",
            captureMethod: "LiDAR",
            captureDevice: "Apple iPhone 13 Pro",
            acquisitionDate: "2021",
            acquisitionLocation: "The Burrow, West End, Brisbane"
          },
          {
            id: "claudia",
            name: "Claudia",
            manufacturer: "Leona",
            manufactureLocation: "Jakarta",
            manufactureDate: "1997 July",
            releaseDate: "1998 April",
            // material: ["gold", "denim", "crepe net", "Garmin smart watch"],
            model: "/models/mbo/friends/Claudia.glb",
            og: "/models/mbo/friends/Claudia.jpeg",
            captureApp: "Polycam",
            captureDate: "2025 April 12 11:45PM",
            captureLocation: "Paddington, Sydney",
            captureMethod: "LiDAR",
            captureDevice: "Apple iPhone 13 Pro",
            acquisitionDate: "2024 September",
            acquisitionLocation: "Surry Hills, Sydney",
          },
          {
            id: "sugg",
            name: "Sugg",
            material: ["gold", "denim", "crepe net", "Garmin smart watch"],
            captureApp: "Polycam",
            captureDate: "2025 April 12 11:50PM",
            captureLocation: "Paddington, Sydney",
            captureMethod: "LiDAR",
            captureDevice: "Apple iPhone 13 Pro",
            acquisitionDate: "2025 April 12",
            manufactureDate: "1998 April",
            releaseDate: "1999 January",
            acquisitionLocation: "Surry Hills, Sydney",
            model: "/models/mbo/friends/Sugg.glb",
            og: "/models/mbo/friends/Sugg.jpeg",
          },
          {
            id: "sam",
            name: "Sam",
            captureApp: "Polycam",
            captureMethod: "LiDAR",
            model: "/models/mbo/friends/Sam.glb",
            og: "/models/mbo/friends/Sam.jpeg",
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
            captureApp: "Polycam",
            model: "/models/mbo/friends/Tom.glb",
            og: "/models/mbo/friends/Tom.jpeg",
            captureDevice: "Apple iPhone 13 Pro",
            captureDate: "2024 May 24 12:36 PM",
            captureLocation: "Canva, Surry Hills, Sydney",
            acquisitionDate: "2022"
          },
          {
            id: "uyen",
            name: "Uyen",
            captureMethod: "LiDAR",
            captureApp: "Polycam",
            model: "/models/mbo/friends/UyenLidar.glb",
            og: "/models/mbo/friends/UyenLidar.jpeg",
            acquisitionDate: "2025 April 28",
            acquisitionLocation: "Sydney, Australia",
            captureDate: "2025 July 21",
            captureLocation: "Canva, Surry Hills, Sydney",
            captureDevice: "Apple iPhone 13 Pro"
          },
          {
            id: "casey",
            name: "Casey",
            captureApp: "Polycam",
            captureMethod: "LiDAR",
            model: "/models/mbo/friends/Casey.glb",
            og: "/models/mbo/friends/Casey.jpeg",
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
            og: "/models/mbo/friends/Issy.jpeg",
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
            og: "/models/mbo/friends/Fran.jpeg",
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
            og: "/models/mbo/friends/Sarah.jpeg",
            captureDevice: "Apple iPhone 13 Pro",
            captureLocation: "Chippendale, Sydney",
            captureDate: "2023 April 18 9:13 PM",
          },
          {
            id: "liam",
            name: "Liam",
            captureMethod: "LiDAR",
            model: "/models/mbo/friends/Liam.glb",
            og: "/models/mbo/friends/Liam.jpeg",
            captureDevice: "Apple iPhone 13 Pro",
            acquisitionDate: "2022",
            captureLocation: "Redfern",
            captureApp: "Polycam",
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
            og: "/models/mbo/friends/LouNathan.jpeg",
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
            og: "/models/mbo/friends/Jack.jpeg",
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
            og: "/models/mbo/friends/AnnalieseRiya.jpeg",
            captureApp: "Polycam",
            captureMethod: "LiDAR",
            captureDate: "2023 April 7 7:31PM",
            captureLocation: "Darlinghurst, Sydney",
            captureDevice: "Apple iPhone 13 Pro",
            acquisitionDate: "2019 & ???"
          },
          {
            id: "anna",
            name: "Anna",
            model: "/models/mbo/friends/Anna.glb",
            og: "/models/mbo/friends/Anna.jpeg",
            captureApp: "Polycam",
            captureMethod: "LiDAR",
            captureDate: "2024 July 15 9:09AM",
            captureLocation: "Darlinghurst, Sydney",
            captureDevice: "Apple iPhone 13 Pro",
            acquisitionDate: "2022",
            acquisitionLocation: "Surry Hills, Sydney"
          }
        ]
      }
    ]
  }, {
    id: "leaonie",
    name: "Leaonie",
    og: "/models/leaonie/og.jpeg",
    collections: [
      {
        id: "pottery",
        name: "pottery",
        og: "/models/leaonie/pottery/og.jpeg",
        items: [
          {
            id: "bear",
            name: "bear",
            alt: "A simplistic white bear with a green hat on a small snowy base.",
            model: "/models/leaonie/pottery/bear.glb",
            og: "/models/leaonie/pottery/bear.jpeg",
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
            og: "/models/leaonie/pottery/mouse-bowl.jpeg",
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
            og: "/models/leaonie/pottery/vase.jpeg",
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

export async function loadUser({ params, request }: { params: { userId: User['id']; }; request: Request; }): Promise<{
  user: User,
  users: User[]
}> {
  const hasArenaPrefix = params.userId.startsWith(ARENA_PREFIX);

  if (hasArenaPrefix) {
    const userSlug = params.userId.slice(ARENA_PREFIX.length);
    const user = await loadArenaUser({ userSlug })
    return { user, users: [user] }
  }

  const users = await loadUsers({ request });
  const user = users.find((user) => user.id === params.userId);
  if (!user) throw new Error("User not found");
  return { user, users };
}

export async function loadCollection({ params, request }: { params: { userId: User['id']; collectionId: Collection['id']; }; request: Request; }) {
  const { user, users } = await loadUser({ params, request });
  const collection = user.collections.find((collection) => collection.id === params.collectionId);
  if (!collection) throw new Error("Collection not found");
  return { collection, user, users };
}

export async function loadItem({ params, request }: { params: { userId: User['id']; collectionId: Collection['id']; itemId: Item['id']; }; request: Request; }) {
  const { collection, user, users } = await loadCollection({ params, request });
  const item = collection.items.find((item) => item.id === params.itemId);
  if (!item) throw new Error("Item not found");
  return { collection, user, item, users };
}

const ARENA_USER_CACHE = new Map<string, User>();

export async function loadArenaUser({ userSlug }: { userSlug: string }): Promise<User> {
  const cached = ARENA_USER_CACHE.get(userSlug);
  if (cached) {
    return cached;
  }

  const user: ArenaUser = await fetch(`https://api.are.na/v2/users/${userSlug}`).then((res) => res.json());

  const resultChannels: ArenaChannel[] = []

  let page = 1;
  do {
    const searchResult: ArenaSearchResult = await fetch(`https://api.are.na/v2/search/users/${userSlug}?page=${page}&per=100`).then((res) => res.json());
    resultChannels.push(...searchResult.channels);

    if (searchResult.current_page === searchResult.total_pages) {
      break;
    }
  } while (page++ < 100);

  const channels: ArenaChannel[] = await Promise.all(resultChannels.map(channel => fetch(`https://api.are.na/v2/channels/${channel.id}`).then((res) => res.json())));

  const collections: Collection[] = [];
  for (const channel of channels) {
    const items: Item[] = []

    for (const content of channel.contents) {
      if (!content.source?.url?.endsWith('.glb')) {
        continue
      }

      items.push({
        id: content.id.toString(),
        name: content.title,
        model: content.source.url,
        description: content.description,
        customFields: {
          "are.na block": `[https://www.are.na/block/${content.id}](https://www.are.na/block/${content.id})`
        },
        og: content.image?.display?.url,
      })
    }

    if (items.length === 0) {
      continue
    }

    collections.push({
      id: channel.slug.toString(),
      name: channel.title,
      description: `${channel.metadata.description} 

[Are.na channel](https://www.are.na/${userSlug}/${channel.slug})`,
      items,
    })
  }

  const result: User = {
    id: ARENA_PREFIX + user.slug,
    name: user.full_name,
    bio: `[Are.na user](https://www.are.na/${user.slug})`,
    collections
  };

  ARENA_USER_CACHE.set(userSlug, result);

  return result;
}

/**
 * https://dev.are.na/documentation/channels#Block43472
 */
interface ArenaChannel {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
  added_to_at: string;
  published: boolean;
  open: boolean;
  collaboration: boolean;
  collaborator_count: number;
  slug: string;
  length: number;
  kind: string;
  status: string;
  user_id: number;
  manifest: ArenaManifest;
  contents: ArenaContent[];
  base_class: string;
  page: number;
  per: number;
  collaborators: any[];
  follower_count: number;
  share_link: string | null;
  metadata: ArenaMetadata;
  class_name: string;
  can_index: boolean;
  nsfw: boolean;
  owner: ArenaUser;
  user: ArenaUser;
}

interface ArenaMetadata {
  description: string;
}

interface ArenaManifest {
  key: string;
  AWSAccessKeyId: string;
  bucket: string;
  success_action_status: string;
  policy: string;
  acl: string;
  signature: string;
  expires: string;
}

interface Provider {
  name: string;
  url: string;
}

interface Source {
  url: string;
  title: string;
  provider: Provider;
}

interface ImageVariant {
  url: string;
}

interface ArenaImage {
  filename: string;
  content_type: string;
  updated_at: string;
  thumb: ImageVariant;
  square: ImageVariant;
  display: ImageVariant;
  large: ImageVariant;
  original: {
    url: string;
    file_size: number;
    file_size_display: string;
  };
}

interface ArenaUser {
  created_at: string;
  slug: string;
  username: string;
  first_name: string;
  last_name: string;
  full_name: string;
  avatar: string;
  avatar_image: {
    thumb: string;
    display: string;
  };
  channel_count: number;
  following_count: number;
  profile_id: number;
  follower_count: number;
  initials: string;
  can_index: boolean;
  metadata: {
    description: string | null;
  };
  is_premium: boolean;
  is_lifetime_premium: boolean;
  is_supporter: boolean;
  is_exceeding_connections_limit: boolean;
  is_confirmed: boolean;
  is_pending_reconfirmation: boolean;
  is_pending_confirmation: boolean;
  badge: string;
  id: number;
  base_class: string;
  class: string;
}

interface ArenaContent {
  title: string;
  updated_at: string;
  created_at: string;
  state: string;
  comment_count: number;
  generated_title: string;
  content_html: string;
  description_html: string;
  visibility: string;
  content: string;
  description: string;
  source: Source | null;
  image: ArenaImage;
  embed: any;
  attachment: any;
  metadata: any;
  id: number;
  base_class: string;
  class: string;
  user: ArenaUser;
  position: number;
  selected: boolean;
  connection_id: number;
  connected_at: string;
  connected_by_user_id: number;
  connected_by_username: string;
  connected_by_user_slug: string;
}

interface ArenaSearchResult {
  term: string;
  per: number;
  current_page: number;
  total_pages: number;
  length: number;
  authenticated: boolean;
  channels: ArenaChannel[];
  blocks: ArenaContent[];
  users: any[];
}
