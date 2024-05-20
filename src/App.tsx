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

interface Doll {
  id: string;
  alt: string;
  name: string;
  model: string;
  poster: string;
  dateOfManufacture?: string;
  dateOfAcquisition?: string;
}

export async function loadDolls(): Promise<Doll[]> {
  return [
    { 
      id: "neil-armstrong", 
      alt: "Neil Armstrong's Spacesuit from the Smithsonian Digitization Programs Office and National Air and Space Museum",
      name: "Neil Armstrong", 
      model: "/models/NeilArmstrong.glb",
      poster: "/models/NeilArmstrong.webp",
      dateOfManufacture: "1969",
      dateOfAcquisition: "N/A",
    },
    { 
      id: "neil-armstrong", 
      alt: "Neil Armstrong's Spacesuit from the Smithsonian Digitization Programs Office and National Air and Space Museum",
      name: "Neil Armstrong", 
      model: "/models/NeilArmstrong.glb",
      poster: "/models/NeilArmstrong.webp",
      dateOfManufacture: "1969",
      dateOfAcquisition: "N/A",
    },
    { 
      id: "neil-armstrong", 
      alt: "Neil Armstrong's Spacesuit from the Smithsonian Digitization Programs Office and National Air and Space Museum",
      name: "Neil Armstrong", 
      model: "/models/NeilArmstrong.glb",
      poster: "/models/NeilArmstrong.webp",
      dateOfManufacture: "1969",
      dateOfAcquisition: "N/A",
    },
    { 
      id: "neil-armstrong", 
      alt: "Neil Armstrong's Spacesuit from the Smithsonian Digitization Programs Office and National Air and Space Museum",
      name: "Neil Armstrong", 
      model: "/models/NeilArmstrong.glb",
      poster: "/models/NeilArmstrong.webp",
      dateOfManufacture: "1969",
      dateOfAcquisition: "N/A",
    },
  ]
}

export async function loadDoll({ params }: { params: { id: string } }): Promise<Doll> {
  const dolls = await loadDolls();
  return dolls.filter((doll) => doll.id === params.id)[0];
}


export function DollPage() {
  const doll = useLoaderData() as Doll;

  return (
    <article className='doll-page'>
      <Link to="/">&larr; Back </Link>
      <h2 className='margin-bottom monospace'>{doll.name}</h2>
      <div className='flex-wrap-row'>
        <Model doll={doll} big />
        <DollDescriptionList doll={doll} />
      </div>
    </article>
  );
}

export function DollsListing() {
  const dolls = useLoaderData() as Doll[];

  return (
    <section>
      <ul className="card-grid">
        {dolls.map((doll) => <DollCard key={doll.id} doll={doll} />)}
      </ul>
    </section>
  );
}

function Model(props: { doll: Doll, big: boolean }) {
  return (
    // @ts-ignore
    <model-viewer 
      style={ props.big ? { height: '30rem', margin: 'auto' } : {} }
      alt={props.doll.alt}
      src={props.doll.model} 
      environment-image="/environments/moon_1k.hdr" 
      interaction-prompt=""
      progress-bar=""
      poster={props.doll.poster}
      shadow-intensity="1" 
      camera-controls 
      auto-rotate
      touch-action="pan-y" 
    />
  );
}


function DollCard(props: { doll: Doll }) {
  return (
    <li className="card">
      <div className='center thumbnail'>
        {/* <img src={props.doll.poster} alt={props.doll.alt} /> */}
        <Model doll={props.doll} big={false}  />
      </div>
      <a href={`/dolls/${props.doll.id}`}>
        {props.doll.name}
      </a>
    </li>
  );
}

function DollDescriptionList(props: { doll: Doll }) {
  return (
    <dl>
      <dt>ID</dt>
      <dd>{props.doll.id}</dd>
      <dt>Date of manufacture</dt>
      <dd>{props.doll.dateOfManufacture}</dd>
      <dt>Date of acquisition</dt>
      <dd>{props.doll.dateOfAcquisition}</dd>
      <dt>Description</dt>
      <dd>{props.doll.alt}</dd>
      <dt>Model</dt>
      <dd>{props.doll.model}</dd>
      <dt>Poster</dt>
      <dd>{props.doll.poster}</dd>
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