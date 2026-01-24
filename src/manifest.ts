import * as yaml from 'js-yaml';

// Firebase REST API configuration
const FIREBASE_PROJECT_ID = 'poppenhu-is';
const FIREBASE_DATABASE_URL = `https://${FIREBASE_PROJECT_ID}-default-rtdb.firebaseio.com`;

export type Manifest = User[];

export interface User {
  id: string;
  name: string;
  og?: string;
  bio?: string;
  collections: Collection[];
  source?: string;
}

export interface Collection {
  id: string;
  name: string;
  og?: string;
  description?: string;
  items: Item[];
}

// Firebase-specific types
export interface FirebaseUser extends Omit<User, 'collections'> {
  collections: Record<FirebaseCollection['id'], FirebaseCollection>;
  source: 'firebase';
  creatorUid: string; // Firebase Auth UID for write permissions
}

export interface FirebaseCollection extends Omit<Collection, 'items'> {
  items: Record<Item['id'], Item>;
}

export type FirebaseManifest = Record<FirebaseUser['id'], FirebaseUser>;

export interface FieldSchema {
  name: string;
  label: string;
  description?: string;
  required?: boolean;
  placeholder?: string;
  type?: 'text' | 'textarea' | 'file';
  accept?: string;
}

// User field schemas as object mapping
export const USER_FIELD_SCHEMAS: Record<string, FieldSchema> = {
  name: { name: 'name', label: 'name', required: true, placeholder: 'John Doe' },
  bio: { name: 'bio', label: 'bio', type: 'textarea' },
};

// Collection field schemas as object mapping
export const COLLECTION_FIELD_SCHEMAS: Record<string, FieldSchema> = {
  name: { name: 'name', label: 'name', required: true, placeholder: 'my collection' },
  description: { name: 'description', label: 'description', type: 'textarea' },
};

// Item field schemas as object mapping
export const ITEM_FIELD_SCHEMAS: Record<string, FieldSchema> = {
  name: { name: 'name', label: 'name', required: true, placeholder: 'my item' },
  alt: { 
    name: 'alt', 
    label: 'alt text', 
    placeholder: 'A ceramic vase with textured sides',
    description: "Custom text that will be used to describe the model to viewers who use a screen reader or otherwise depend on additional semantic context to understand what they are viewing."
  },
  description: { name: 'description', label: 'description', type: 'textarea' },
  formalName: { 
    name: 'formalName', 
    label: 'formal name', 
    placeholder: 'Yamaha CGX171CCA',
    description: "A more specific name (like a model number or a scientific name) than the general name."
  },
  releaseDate: { 
    name: 'releaseDate', 
    label: 'release date', 
    placeholder: '2024 July 21',
    description: `The release date and the manufacture date are subtly different. The release date is the date this item's specific variant was made available to the public. The manufacture date is the date the item was actually made. e.g. while the iPhone SE 1 was released in 2016, it was manufactured up until 2018.`
  },
  manufacturer: { name: 'manufacturer', label: 'manufacturer', placeholder: 'EarthQuaker Devices' },
  manufactureDate: { name: 'manufactureDate', label: 'manufacture date', placeholder: '2024 July 21' },
  manufactureLocation: { name: 'manufactureLocation', label: 'manufacture location', placeholder: 'Darlinghurst, Sydney' },
  material: { name: 'material', label: 'material', placeholder: 'clay, glaze' },
  acquisitionDate: { name: 'acquisitionDate', label: 'acquisition date', placeholder: '2024 July 21' },
  acquisitionLocation: { name: 'acquisitionLocation', label: 'acquisition location', placeholder: 'Darlinghurst, Sydney' },
  storageLocation: { name: 'storageLocation', label: 'storage location', placeholder: 'Darlinghurst, Sydney' },
  captureDate: { name: 'captureDate', label: 'capture date', placeholder: '2024 July 21, 10:35AM' },
  captureLocation: { name: 'captureLocation', label: 'capture location', placeholder: 'Darlinghurst, Sydney' },
  captureLatLon: { name: 'captureLatLon', label: 'capture lat/lon', placeholder: '33.88 S, 151.21 E' },
  captureDevice: { name: 'captureDevice', label: 'capture device', placeholder: 'Apple iPhone 13 Pro' },
  captureApp: { name: 'captureApp', label: 'capture app', placeholder: 'Polycam' },
  captureMethod: { name: 'captureMethod', label: 'capture method', placeholder: 'LiDAR' },
  model: { 
    name: 'model', 
    label: 'model', 
    type: 'file', 
    required: true,
    accept: '.glb,.gltf,.zip',
    description: "The path to the 3D model. Supports .glb, .gltf, or .zip files (zip must contain a single .glb file)."
  },
  og: {
    name: 'og',
    label: 'Open Graph image',
    description: "This is the image that will be displayed when this item is shared on social media."
  },
  // Fields not in the form but still need descriptions
  usdzModel: {
    name: 'usdzModel',
    label: 'USDZ model',
    description: "The path to the USDZ model for use in AR on Apple devices."
  },
  poster: {
    name: 'poster',
    label: 'poster',
    description: "The image to be displayed instead of the model it is loaded and ready to render."
  },
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

export const MANIFEST_URL_QUERY_PARAM = 'manifest';
export const ARENA_PREFIX = 'arena:';

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
      e.g. while the iPhone SE 1 was released in 2016, it was manufactured up until 2018.\`,

  // YAML parsing feature for Are.na integration
  yamlInDescription: \`You can include YAML metadata in Are.na block descriptions by adding a "---" divider.
Everything before "---" becomes the description, everything after is parsed as YAML that can set Item fields.

Example Are.na block description:
This is my beautiful sculpture made from clay.
---
formalName: "Clay Sculpture #42"
releaseDate: "2023-10-15"
manufacturer: "Artist Name"
material: 
  - "clay"
  - "glaze"
acquisitionDate: "2023-11-01"
captureDevice: "iPhone 15 Pro"
captureMethod: "LiDAR"

If there's no "---" divider, the entire description is treated normally.\`
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
  //   og: "/assets/derived/joey_og.jpeg",
  //   collections: [
  //     {
  //       id: "stolen",
  //       name: "stolen from others",
  //       og: "/assets/derived/joey_stolen_og.jpeg",
  //       description: "i don't own these items but i took them from someone's house",
  //       items: [
  //         // {
  //         //   id: "mug",
  //         //   name: "mug",
  //         //   description: "a mug with writing on it",
  //         //   model: "/assets/goldens/joey_stolen_mug.glb",
  //         // },
  //         {
  //           id: "film-camera",
  //           name: "film camera",
  //           model: "/assets/goldens/joey_stolen_film-camera.glb",
  //         }
  //       ]
  //     }
  //   ]
  // },
  {
    id: "jackie",
    name: "Jackie",
    og: "/assets/derived/jackie_og.jpeg",
    bio: `cakes rule everything around me  
baker & baby cook  
[baking Instagram](https://www.instagram.com/bb.flambe/)`,
    collections: [
      {
        id: "cakes",
        name: "cakes",
        og: "/assets/derived/jackie_cakes_og.jpeg",
        items: [
          {
            id: "brat",
            releaseDate: "2024 July 21",
            name: "<br/>at cake",
            description: "<𝓫𝓻/>𝓪𝓽 𝔀𝓲𝓷𝓽𝓮𝓻 ✮ choc sponge cake w layers of apple jam, caramel, whipped cream, swiss meringue bc ✮ for @max.bo_ HTML in hyde (i'm now a woman in STEM) ᯓ★ ~ https://www.instagram.com/p/C91qasNS9YI/",
            model: "/assets/goldens/jackie_cakes_brat.glb",
            usdzModel: "/assets/derived/jackie_cakes_brat.usdz",
            og: "/assets/derived/jackie_cakes_brat.jpeg",
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
            model: "/assets/goldens/jackie_cakes_meringue-stack.glb",
            usdzModel: "/assets/derived/jackie_cakes_meringue-stack.usdz",
            og: "/assets/derived/jackie_cakes_meringue-stack.jpeg",
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
            model: "/assets/goldens/jackie_cakes_ube-cheesecake.glb",
            usdzModel: "/assets/derived/jackie_cakes_ube-cheesecake.usdz",
            og: "/assets/derived/jackie_cakes_ube-cheesecake.jpeg",
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
            model: "/assets/goldens/jackie_cakes_dark-forest-dragon.glb",
            usdzModel: "/assets/derived/jackie_cakes_dark-forest-dragon.usdz",
            og: "/assets/derived/jackie_cakes_dark-forest-dragon.jpeg",
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
    og: "/assets/derived/mbo_og.jpeg",
    name: "Max",
    bio: "[maxbo.me](https://maxbo.me), [twitter](https://twitter.com/_max_bo_)",
    collections: [
      {
        id: "plucked-instruments",
        name: "plucked instruments",
        og: "/assets/derived/mbo_plucked-instruments_og.jpeg",
        description: `Not listed: 2 classical guitars that were lost to the Queensland heat, when the glue of their bridges melted and sheared off.`,
        items: [
          {
            id: "requinto",
            description: `This requinto^ graciously gifted to me by my old guitar teacher. He found it in Paracho de Verduzco* (pop. 37000 in 2024), Mexico. He attempted to purchase it with a credit card but the store did not have a terminal, and the only bank in town was closed. The store owner said he could take it and send the money once he got back to Australia, which he did.

^"The requinto [classical] guitar has six nylon strings with a scale length of 530 to 540 millimetres (20.9 to 21.3 in), which is about 18% smaller than a standard guitar scale. Requintos are tuned: A2-D3-G3-C4-E4-A4 (one fourth higher than the standard classical guitar)."

*"Paracho is well known throughout both Mexico and elsewhere in the world as a hub of lutherie [...] the town's craftsmen are reputed to make the best sounding guitars and vihuelas in all of Mexico."`,
            name: "a requinto",
            model: "/assets/goldens/mbo_plucked-instruments_requinto.glb",
            usdzModel: "/assets/derived/mbo_plucked-instruments_requinto.usdz",
            og: "/assets/derived/mbo_plucked-instruments_requinto.jpeg",
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
            model: "/assets/goldens/mbo_plucked-instruments_yamaha.glb",
            usdzModel: "/assets/derived/mbo_plucked-instruments_yamaha.usdz",
            og: "/assets/derived/mbo_plucked-instruments_yamaha.jpeg",
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
            model: "/assets/goldens/mbo_plucked-instruments_cordoba.glb",
            usdzModel: "/assets/derived/mbo_plucked-instruments_cordoba.usdz",
            og: "/assets/derived/mbo_plucked-instruments_cordoba.jpeg",
            manufacturer: "Cordoba",
            captureDate: "2025 October 2 8:21PM",
            acquisitionDate: "2025 October 1",
            acquisitionLocation: "Rudy's Music Soho, New York City",
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
            model: "/assets/goldens/mbo_plucked-instruments_squire.glb",
            usdzModel: "/assets/derived/mbo_plucked-instruments_squire.usdz",
            og: "/assets/derived/mbo_plucked-instruments_squire.jpeg",
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
            model: "/assets/goldens/mbo_plucked-instruments_kohala.glb",
            usdzModel: "/assets/derived/mbo_plucked-instruments_kohala.usdz",
            og: "/assets/derived/mbo_plucked-instruments_kohala.jpeg",
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
            model: "/assets/goldens/mbo_plucked-instruments_moozica.glb",
            usdzModel: "/assets/derived/mbo_plucked-instruments_moozica.usdz",
            manufacturer: "Moozica",
            og: "/assets/derived/mbo_plucked-instruments_moozica.jpeg",
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
        og: "/assets/derived/mbo_pedals_og.jpeg",
        description: `I have a small collection of guitar pedals from an era where I was trying to get into the electric guitar. 
My abject failure to use them properly convinced me to stick to the classical guitar.`,
        items: [
          {
            id: "screambox",
            name: "Screambox",
            model: "/assets/goldens/mbo_pedals_screambox.glb",
            og: "/assets/derived/mbo_pedals_screambox.jpeg",
            manufacturer: "Max Bo",
            releaseDate: "2025 December 7",
            material: ["cardboard", "LM386 amplifier chip", "speaker out of a telephone"],
            manufactureDate: "2025 December 7",
            manufactureLocation: "NYC Resistor, Brooklyn",
            acquisitionDate: "2025 December 7",
            acquisitionLocation: "NYC Resistor, Brooklyn",
            captureDate: "2025 December 7",
            captureMethod: "LiDAR",
            captureDevice: "Apple iPhone 13 Pro",
            captureLocation: "NYC Resistor, Brooklyn",
            captureApp: "Polycam",
            storageLocation: "New York",
          },
          {
            id: "plumes",
            name: "Plumes",
            model: "/assets/goldens/mbo_pedals_plumes.glb",
            usdzModel: "/assets/derived/mbo_pedals_plumes.usdz",
            og: "/assets/derived/mbo_pedals_plumes.jpeg",
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
            model: "/assets/goldens/mbo_pedals_elcap.glb",
            usdzModel: "/assets/derived/mbo_pedals_elcap.usdz",
            og: "/assets/derived/mbo_pedals_elcap.jpeg",
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
            model: "/assets/goldens/mbo_pedals_multistomp.glb",
            usdzModel: "/assets/derived/mbo_pedals_multistomp.usdz",
            og: "/assets/derived/mbo_pedals_multistomp.jpeg",
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
            model: "/assets/goldens/mbo_pedals_avrun.glb",
            usdzModel: "/assets/derived/mbo_pedals_avrun.usdz",
            og: "/assets/derived/mbo_pedals_avrun.jpeg",
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
            model: "/assets/goldens/mbo_badminton-racquets_hello-kitty.glb",
            usdzModel: "/assets/derived/mbo_badminton-racquets_hello-kitty.usdz",
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
            model: "/assets/goldens/mbo_badminton-racquets_jetspeed.glb",
            og: "/assets/derived/mbo_badminton-racquets_jetspeed.jpeg",
            usdzModel: "/assets/derived/mbo_badminton-racquets_jetspeed.usdz",
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
        og: "/assets/derived/mbo_friends_og.jpeg",
        description: "Always appreciated (all parties have agreed to be on the site)",
        items: [
          {
            id: "cory",
            acquisitionDate: "2015",
            name: "Cory",
            captureApp: "Polycam",
            captureMethod: "LiDAR",
            model: "/assets/goldens/mbo_friends_Cory.glb",
            usdzModel: "/assets/derived/mbo_friends_Cory.usdz",
            og: "/assets/derived/mbo_friends_Cory.jpeg",
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
            model: "/assets/goldens/mbo_friends_Georgia.glb",
            usdzModel: "/assets/derived/mbo_friends_Georgia.usdz",
            og: "/assets/derived/mbo_friends_Georgia.jpeg",
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
            model: "/assets/goldens/mbo_friends_Kriti.glb",
            usdzModel: "/assets/derived/mbo_friends_Kriti.usdz",
            og: "/assets/derived/mbo_friends_Kriti.jpeg",
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
            model: "/assets/goldens/mbo_friends_Bec.glb",
            usdzModel: "/assets/derived/mbo_friends_Bec.usdz",
            og: "/assets/derived/mbo_friends_Bec.jpeg",
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
            model: "/assets/goldens/mbo_friends_Lucia.glb",
            usdzModel: "/assets/derived/mbo_friends_Lucia.usdz",
            og: "/assets/derived/mbo_friends_Lucia.jpeg",
          },
          {
            id: "qualtrough",
            name: "Qualtrough collective",
            model: "/assets/goldens/mbo_friends_Qualtrough.glb",
            usdzModel: "/assets/derived/mbo_friends_Qualtrough.usdz",
            og: "/assets/derived/mbo_friends_Qualtrough.jpeg",
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
            model: "/assets/goldens/mbo_friends_James.glb",
            usdzModel: "/assets/derived/mbo_friends_James.usdz",
            og: "/assets/derived/mbo_friends_James.jpeg",
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
            model: "/assets/goldens/mbo_friends_Dragan.glb",
            usdzModel: "/assets/derived/mbo_friends_Dragan.usdz",
            og: "/assets/derived/mbo_friends_Dragan.jpeg",
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
            model: "/assets/goldens/mbo_friends_Jackie.glb",
            usdzModel: "/assets/derived/mbo_friends_Jackie.usdz",
            og: "/assets/derived/mbo_friends_Jackie.jpeg",
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
            model: "/assets/goldens/mbo_friends_MatchaMonday.glb",
            usdzModel: "/assets/derived/mbo_friends_MatchaMonday.usdz",
            og: "/assets/derived/mbo_friends_MatchaMonday.jpeg",
            captureDevice: "Apple iPhone 13 Pro",
            captureDate: "2025 Jun 9",
            captureLocation: "Parami, Sydney",
          },
          {
            id: "peter",
            name: "Peter",
            model: "/assets/goldens/mbo_friends_Peter.glb",
            usdzModel: "/assets/derived/mbo_friends_Peter.usdz",
            captureLocation: "Atlassian, Sydney",
            captureApp: "Polycam",
            captureMethod: "LiDAR",
            og: "/assets/derived/mbo_friends_Peter.jpeg",
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
            model: "/assets/goldens/mbo_friends_Roman.glb",
            usdzModel: "/assets/derived/mbo_friends_Roman.usdz",
            og: "/assets/derived/mbo_friends_Roman.jpeg",
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
            model: "/assets/goldens/mbo_friends_Hamish.glb",
            usdzModel: "/assets/derived/mbo_friends_Hamish.usdz",
            og: "/assets/derived/mbo_friends_Hamish.jpeg",
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
            model: "/assets/goldens/mbo_friends_Claudia.glb",
            usdzModel: "/assets/derived/mbo_friends_Claudia.usdz",
            og: "/assets/derived/mbo_friends_Claudia.jpeg",
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
            model: "/assets/goldens/mbo_friends_Sugg.glb",
            usdzModel: "/assets/derived/mbo_friends_Sugg.usdz",
            og: "/assets/derived/mbo_friends_Sugg.jpeg",
          },
          {
            id: "sam",
            name: "Sam",
            captureApp: "Polycam",
            captureMethod: "LiDAR",
            model: "/assets/goldens/mbo_friends_Sam.glb",
            usdzModel: "/assets/derived/mbo_friends_Sam.usdz",
            og: "/assets/derived/mbo_friends_Sam.jpeg",
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
            model: "/assets/goldens/mbo_friends_Tom.glb",
            usdzModel: "/assets/derived/mbo_friends_Tom.usdz",
            og: "/assets/derived/mbo_friends_Tom.jpeg",
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
            model: "/assets/goldens/mbo_friends_UyenLidar.glb",
            usdzModel: "/assets/derived/mbo_friends_UyenLidar.usdz",
            og: "/assets/derived/mbo_friends_UyenLidar.jpeg",
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
            model: "/assets/goldens/mbo_friends_Casey.glb",
            usdzModel: "/assets/derived/mbo_friends_Casey.usdz",
            og: "/assets/derived/mbo_friends_Casey.jpeg",
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
            model: "/assets/goldens/mbo_friends_Issy.glb",
            usdzModel: "/assets/derived/mbo_friends_Issy.usdz",
            og: "/assets/derived/mbo_friends_Issy.jpeg",
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
            model: "/assets/goldens/mbo_friends_Fran.glb",
            usdzModel: "/assets/derived/mbo_friends_Fran.usdz",
            og: "/assets/derived/mbo_friends_Fran.jpeg",
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
            model: "/assets/goldens/mbo_friends_Sarah.glb",
            usdzModel: "/assets/derived/mbo_friends_Sarah.usdz",
            og: "/assets/derived/mbo_friends_Sarah.jpeg",
            captureDevice: "Apple iPhone 13 Pro",
            captureLocation: "Chippendale, Sydney",
            captureDate: "2023 April 18 9:13 PM",
          },
          {
            id: "liam",
            name: "Liam",
            captureMethod: "LiDAR",
            model: "/assets/goldens/mbo_friends_Liam.glb",
            usdzModel: "/assets/derived/mbo_friends_Liam.usdz",
            og: "/assets/derived/mbo_friends_Liam.jpeg",
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
            model: "/assets/goldens/mbo_friends_LouNathan.glb",
            usdzModel: "/assets/derived/mbo_friends_LouNathan.usdz",
            og: "/assets/derived/mbo_friends_LouNathan.jpeg",
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
            model: "/assets/goldens/mbo_friends_Jack.glb",
            usdzModel: "/assets/derived/mbo_friends_Jack.usdz",
            og: "/assets/derived/mbo_friends_Jack.jpeg",
            captureDevice: "Apple iPhone 13 Pro",
            captureDate: "2023 April 8 10:16 PM",
            acquisitionDate: "2022",
            captureLocation: "Sydney",
            captureLatLon: "33.88 S, 151.21 E"
          },
          {
            id: "annaliese-riya",
            name: "Annaliese & Riya",
            model: "/assets/goldens/mbo_friends_AnnalieseRiya.glb",
            usdzModel: "/assets/derived/mbo_friends_AnnalieseRiya.usdz",
            og: "/assets/derived/mbo_friends_AnnalieseRiya.jpeg",
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
            model: "/assets/goldens/mbo_friends_Anna.glb",
            usdzModel: "/assets/derived/mbo_friends_Anna.usdz",
            og: "/assets/derived/mbo_friends_Anna.jpeg",
            captureApp: "Polycam",
            captureMethod: "LiDAR",
            captureDate: "2024 July 15 9:09AM",
            captureLocation: "Darlinghurst, Sydney",
            captureDevice: "Apple iPhone 13 Pro",
            acquisitionDate: "2022",
            acquisitionLocation: "Surry Hills, Sydney"
          },
          {
            id: "katie",
            name: "Katie",
            model: "/assets/goldens/mbo_friends_katie.glb",
            og: "/assets/derived/mbo_friends_katie.jpeg",
            acquisitionDate: "2026 Jan 3",
            acquisitionLocation: "Long Island City",
            captureApp: "Polycam",
            captureDate: "2026 Jan 3",
            captureDevice: "Apple iPhone 13 Pro",
            captureLatLon: "40.7447° N, 73.9485° W",
            captureLocation: "Long Island City",
            captureMethod: "LiDAR",
            manufactureDate: "1998",
            manufactureLocation: "California",
            manufacturer: "Catherine",
            releaseDate: "1998"
          },
          {
            id: "maja",
            name: "Maja",
            model: "/assets/goldens/mbo_friends_maja.glb",
            og: "/assets/derived/mbo_friends_maja.jpeg",
            acquisitionDate: "2024",
            acquisitionLocation: "Liberty House, Enmore, Sydney",
            captureApp: "Polycam",
            captureDate: "2025 July 3",
            captureDevice: "iPhone 13 Pro",
            captureLocation: "Liberty House, Enmore, Sydney",
            captureMethod: "LiDAR",
            manufactureDate: "1999 January",
            manufactureLocation: "Hong Kong",
            manufacturer: "Helen",
            releaseDate: "1999 September",
            storageLocation: "Sydney"
          },
          // {
          //   id: "neal",
          //   name: "Neal",
          //   model: "https://firebasestorage.googleapis.com/v0/b/poppenhu-is.firebasestorage.app/o/models%2Ft%3Amax%2Ffriends%2Fneal.glb?alt=media&token=1738a605-d9d1-46a6-be42-0273caf0c1ae",
          //   acquisitionDate: "2025 September",
          //   acquisitionLocation: "Bushwick, NYC",
          //   captureApp: "Polycam",
          //   captureDate: "2025 November 17",
          //   captureDevice: "iPhone 13 Pro",
          //   captureLocation: "Hex House, East Williamsburg",
          //   captureMethod: "LiDAR",
          //   manufactureDate: "1997",
          //   manufactureLocation: "Fairfax, Virginia",
          //   manufacturer: "Payl",
          //   releaseDate: "1998",
          //   storageLocation: "Williamsburg, NYC"
          // },
          {
            id: "jordan",
            name: "Jordan",
            model: "/assets/goldens/mbo_friends_jordan.glb",
            usdzModel: "/assets/derived/mbo_friends_jordan.usdz",
            og: "/assets/derived/mbo_friends_jordan.jpeg",
            acquisitionDate: "2025 November",
            acquisitionLocation: "Kotofit, Long Island City",
            captureApp: "Polycam",
            captureDate: "2026 January 10",
            captureDevice: "Apple iPhone 13 Pro",
            captureLocation: "Dumbo Ceramics, Brooklyn",
            captureMethod: "LiDAR",
            manufactureDate: "2001",
            manufactureLocation: "Thailand",
            manufacturer: "Debbie",
            releaseDate: "2001",
            storageLocation: "Long Island City",
          },
          {
            id: "penguin",
            name: "penguin plush",
            model: "/assets/goldens/mbo_friends_penguin.glb",
            og: "/assets/derived/mbo_friends_penguin.jpeg",
            description: "found on the side of the road",
            acquisitionDate: "2020",
            acquisitionLocation: "Glebe, Sydney",
            captureApp: "Polycam",
            captureDate: "2025 August 22",
            captureDevice: "Apple iPhone 13 Pro",
            captureLocation: "Darlinghurst, Sydney",
            captureMethod: "LiDAR",
            manufactureLocation: "China",
            storageLocation: "Darlinghurst, Sydney"
          }
        ]
      }
    ]
  }, {
    id: "leaonie",
    name: "Leaonie",
    og: "/assets/derived/leaonie_og.jpeg",
    collections: [
      {
        id: "pottery",
        name: "pottery",
        og: "/assets/derived/leaonie_pottery_og.jpeg",
        items: [
          {
            id: "bear",
            name: "bear",
            alt: "A simplistic white bear with a green hat on a small snowy base.",
            model: "/assets/goldens/leaonie_pottery_bear.glb",
            usdzModel: "/assets/derived/leaonie_pottery_bear.usdz",
            og: "/assets/derived/leaonie_pottery_bear.jpeg",
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
            model: "/assets/goldens/leaonie_pottery_mouse-bowl.glb",
            usdzModel: "/assets/derived/leaonie_pottery_mouse-bowl.usdz",
            og: "/assets/derived/leaonie_pottery_mouse-bowl.jpeg",
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
            model: "/assets/goldens/leaonie_pottery_vase.glb",
            usdzModel: "/assets/derived/leaonie_pottery_vase.usdz",
            og: "/assets/derived/leaonie_pottery_vase.jpeg",
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
  },
  {
    id: "SugarPlumBoss",
    name: "Anderson",
    bio: "Manufactured: 3/27/22",
    og: "/assets/derived/SugarPlumBoss_og.jpeg",
    collections: [
      {
        id: "baked-goods",
        name: "baked goods",
        og: "/assets/derived/SugarPlumBoss_baked-goods_og.jpeg",
        items: [
          {
            id: "vegan-sugar-plum-cookie",
            name: "vegan sugar plum cookie",
            model: "/assets/goldens/SugarPlumBoss_baked-goods_vegan-sugar-plum-cookie.glb",
            og: "/assets/derived/SugarPlumBoss_baked-goods_vegan-sugar-plum-cookie.jpeg",
            acquisitionDate: "2026 Jan 3",
            acquisitionLocation: "New Jersey",
            captureApp: "Polycam",
            captureDate: "2026 Jan 3",
            captureDevice: "Apple iPhone 13 Pro",
            captureLatLon: "40.7447° N, 73.9485° W",
            captureLocation: "Long Island City",
            captureMethod: "LiDAR",
            manufactureDate: "2026 Jan 3",
            manufactureLocation: "New Jersey",
            manufacturer: "Anderson",
            material: [
              "sugar plum",
              "spiced rum",
              "fireball",
              "vegan butter",
              "sugar",
              "cinnamon",
              "baking soda",
              "apple cider vinegar"
            ],
            releaseDate: "2021 March 27",
            storageLocation: "our stomachs"
          }
        ]
      }
    ]
  }
];

export function loadUsers({ request }: { request: Request; }) {
  const manifestUrl = new URL(request.url).searchParams.get(MANIFEST_URL_QUERY_PARAM);

  let promises;

  if (manifestUrl) {
    promises = [loadManifest(manifestUrl), loadFirebaseUsers()];
  } else {
    promises = [loadFirebaseUsers()];
  }

  return {
    syncUsers: FIRST_PARTY_MANIFEST,
    asyncUsersPromise: Promise.all(promises).then(list => list.flat())
  }
}

async function loadManifest(manifestUrl: string): Promise<Manifest> {
  const response = await fetch(manifestUrl);
  if (!response.ok) {
    throw new Error(`Failed to load manifest from ${manifestUrl}: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function loadFirebaseUsers(): Promise<User[]> {
  const response = await fetch(`${FIREBASE_DATABASE_URL}/.json`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch Firebase data: ${response.status} ${response.statusText}`);
  }
  
  const users: FirebaseManifest | null = await response.json();

  if (!users) {
    return [];
  }
  
  return Object.values(users).map(firebaseUser => {
    // Convert collections from Record to Array format
    const collections: Collection[] = Object.values(firebaseUser.collections ?? {}).map(collection => {
      const items: Item[] = Object.values(collection.items ?? {});

      return {
        ...collection,
        items
      };
    });

    return {
      ...firebaseUser,
      id: firebaseUser.id,
      collections,
      source: 'firebase'
    };
  });
}

export async function loadFirebaseUser({ userId }: { userId: string }): Promise<User> {
  const response = await fetch(`${FIREBASE_DATABASE_URL}/.json`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch Firebase data: ${response.status} ${response.statusText}`);
  }
  
  const users: FirebaseManifest | null = await response.json();

  if (!users) {
    throw new Error("Firebase database is empty");
  }

  const firebaseUser: FirebaseUser = users[userId];

  if (!firebaseUser) {
    throw new Error(`User with id "${userId}" not found in Firebase`);
  }

  // Convert collections from Record to Array format
  const collections: Collection[] = Object.values(firebaseUser.collections ?? {}).map(collection => {
    const items: Item[] = Object.values(collection.items ?? {});

    return {
      ...collection,
      items
    };
  });

  const result: User = {
    ...firebaseUser,
    source: 'firebase',
    collections
  };

  return result;
}

export async function loadUser({ params, request }: { params: { userId: User['id']; }; request: Request; }): Promise<{
  user: User,
  users: User[]
}> {
  const hasArenaPrefix = params.userId.startsWith(ARENA_PREFIX);
  const manifestUrl = new URL(request.url).searchParams.get(MANIFEST_URL_QUERY_PARAM);

  if (hasArenaPrefix) {
    const slug = params.userId.slice(ARENA_PREFIX.length);
    const arenaUser = await loadArenaUser({ userSlug: slug })
    return { user: arenaUser, users: [...FIRST_PARTY_MANIFEST, arenaUser,] }
  }

  if (manifestUrl) {
    const manifest = await loadManifest(manifestUrl);
    const manifestUser = manifest.find((user: User) => user.id === params.userId);
    if (manifestUser) {
      return { user: { ...manifestUser, source: 'manifest' }, users: [...FIRST_PARTY_MANIFEST, manifestUser] }
    }
  }

  // Check FIRST_PARTY_MANIFEST first
  const firstPartyUser = FIRST_PARTY_MANIFEST.find((user: User) => user.id === params.userId);
  if (firstPartyUser) {
    return { user: { ...firstPartyUser }, users: FIRST_PARTY_MANIFEST }
  }

  // Load all firebase users and find the one we need
  const firebaseUsers = await loadFirebaseUsers();
  const firebaseUser = firebaseUsers.find(user => user.id === params.userId);
  if (!firebaseUser) {
    throw new Error(`User with id "${params.userId}" not found`);
  }
  return { user: firebaseUser, users: [...FIRST_PARTY_MANIFEST, ...firebaseUsers] }
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

      const { description, yamlFields } = parseDescriptionWithYaml(content.description);

      items.push({
        id: content.id.toString(),
        name: content.title,
        model: content.source.url,
        description,
        customFields: {
          "are.na block": `[https://www.are.na/block/${content.id}](https://www.are.na/block/${content.id})`
        },
        og: content.image?.display?.url,
        // Merge in any YAML fields, allowing them to override defaults
        ...yamlFields,
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
    collections,
    source: 'arena'
  };

  ARENA_USER_CACHE.set(userSlug, result);

  return result;
}

/**
 * Parses a description that may contain YAML frontmatter.
 * If the description contains "---" as a divider, everything after it is treated as YAML
 * that can override Item fields. The part before "---" becomes the description.
 */
function parseDescriptionWithYaml(rawDescription: string | null | undefined): {
  description?: string;
  yamlFields: Partial<Item>;
} {
  if (!rawDescription) {
    return { description: undefined, yamlFields: {} };
  }

  const dividerIndex = rawDescription.indexOf('---');

  if (dividerIndex === -1) {
    return {
      description: rawDescription.trim(),
      yamlFields: {}
    };
  }

  const description = rawDescription.substring(0, dividerIndex).trim();
  const yamlContent = rawDescription.substring(dividerIndex + 3).trim();

  let yamlFields: Partial<Item> = {};

  try {
    const parsed = yaml.load(yamlContent);
    if (parsed && typeof parsed === 'object') {
      yamlFields = parsed as Partial<Item>;
    }
  } catch (error) {
    console.warn('Failed to parse YAML in description:', error);
    // If YAML parsing fails, treat the whole thing as description
    return {
      description: rawDescription.trim(),
      yamlFields: {}
    };
  }

  return {
    description: description || undefined,
    yamlFields
  };
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
