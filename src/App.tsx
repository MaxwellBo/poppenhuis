import './App.css'
import {
  useLoaderData,
  useRouteError,
  Outlet,
  Link
} from "react-router-dom";

export function App() {
  return (
    <div>
      {/* <header>Header</header> */}
      <main>
        <Outlet />
      </main>
      {/* <footer>Footer Content</footer> */}
    </div>
  )
}

interface Item {
  id: string;
  description?: string;
  name: string;
  model: string;
  poster?: string;
  dateManufactured?: string;
  dateAcquired?: string;
  dateCaptured?: string;
  captureMethod?: string;
  latLong?: string;
}

export async function loadItems(): Promise<Item[]> {
  return [
    { 
      id: "neil-armstrong", 
      name: "Neil Armstrong", 
      description: "Neil Armstrong's Spacesuit from the Smithsonian Digitization Programs Office and National Air and Space Museum",
      model: "/models/NeilArmstrong.glb",
      poster: "/models/NeilArmstrong.webp",
      dateManufactured: "1969",
    },
    {
      id: "hamish",
      name: "Hamish Bultitude",
      model: "/models/Hamish.glb",
      dateManufactured: "1999?",
      dateCaptured: "2023 August 26 4:43PM",
      captureMethod: "LiDAR",
      latLong: "35.29 S, 149.12 E",
    },
    {
      id: "issy",
      name: "Islwyn Wilson",
      model: "/models/Issy.glb",
      captureMethod: "LiDAR",
    },
    {
      id: "lou-nathan",
      name: "Lou & Nathan",
      captureMethod: "LiDAR",
      model: "/models/LouNathan.glb",
    },
    {
      id: "jack",
      name: "Jack She",
      captureMethod: "LiDAR",
      model: "/models/Jack.glb",
    }
  ]
}

export async function loadItem({ params }: { params: { id: string } }): Promise<Item> {
  const items = await loadItems();
  return items.filter((item) => item.id === params.id)[0];
}


export function ItemPage() {
  const item = useLoaderData() as Item;

  return (
    <article className='item-page'>
      <Link to="/">&larr; Back </Link>
      <h2 className='margin-bottom monospace'>{item.name}</h2>
      <div className='flex-wrap-row'>
        <Model item={item} big />
        <ItemDescriptionList item={item} />
      </div>
    </article>
  );
}

export function ItemsListing() {
  const items = useLoaderData() as Item[];

  return (
    <section>
      <ul className="card-grid">
        {items.map((item) => <ItemCard key={item.id} item={item} />)}
      </ul>
    </section>
  );
}

function Model(props: { item: Item, big: boolean }) {
  return (
    // @ts-ignore
    <model-viewer 
      style={ props.big ? { height: '40rem', width: "40rem", margin: 'auto' } : { height: "20rem", width: "20rem" } }
      alt={props.item.description}
      src={props.item.model} 
      environment-image="/environments/moon_1k.hdr" 
      interaction-prompt=""
      progress-bar=""
      poster={props.item.poster}
      shadow-intensity="1" 
      camera-controls 
      auto-rotate
      touch-action="pan-y" 
    />
  );
}


function ItemCard(props: { item: Item }) {
  return (
    <li className="card">
      <div className='center thumbnail'>
        {/* <img src={props.item.poster} alt={props.item.alt} /> */}
        <Model item={props.item} big={false}  />
      </div>
      <a href={`/items/${props.item.id}`}>
        {props.item.name}
      </a>
    </li>
  );
}

function ItemDescriptionList(props: { item: Item }) {
  return (
    <dl>
      <dt>ID</dt>
      <dd>{props.item.id}</dd>
      <dt>Date manufactured</dt>
      <dd>{props.item.dateManufactured}</dd>
      <dt>Date acquired</dt>
      <dd>{props.item.dateAcquired}</dd>
      <dt>Date captured</dt>
      <dd>{props.item.dateCaptured}</dd>
      <dt>Capture method</dt>
      <dd>{props.item.captureMethod}</dd>
      <dt>Description</dt>
      <dd>{props.item.description}</dd>
      <dt>Model</dt>
      <dd>{props.item.model}</dd>
      <dt>Poster</dt>
      <dd>{props.item.poster}</dd>
      <dt>Lat/Long</dt>
      <dd>{props.item.latLong}</dd>
    </dl>
  );
}

export function ErrorPage() {
  const error: any = useRouteError();

  return (
    <div id="error-page">
      <h1>Oops!</h1>
      <p>Sorry, an unexpected error has occurred.</p>
      <p>
        <i>{error.statusText || error.message}</i>
      </p>
    </div>
  );
}