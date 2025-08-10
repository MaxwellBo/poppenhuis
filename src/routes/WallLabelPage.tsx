import { useLoaderData } from "react-router";
import { loadItem } from "../manifest";
import { QueryPreservingLink } from "../components/QueryPreservingLink";
import { QrCode } from "../components/QrCode";
import './label.css'

export const loader = loadItem;

export default function WallLabelPage() {
  const { item, user, collection } = useLoaderData() as Awaited<ReturnType<typeof loader>>;
  const itemUrl = `poppenhu.is/${user.id}/${collection.id}/${item.id}`;

  const dateLocation = (date?: string, location?: string) => {
    const acc = []
    if (date) acc.push(date)
    if (location) acc.push("in " + location)
    return acc.join(", ")
  }

  // NOTE: This component is styled entirely with utility classes.
  // Please continue this convention in this component.
  return (
    <div>
      <div className='no-print' style={{ padding: "1ch" }}>
        <QueryPreservingLink to={`/${user.id}/${collection.id}/${item.id}`}>← non-label page</QueryPreservingLink>
      </div>
      <article id="label" className='really-short'>
        <span className="corner-plus top-left">+</span>
        <span className="corner-plus top-right">+</span>
        <span className="corner-plus bottom-left">+</span>
        <span className="corner-plus bottom-right">+</span>
        <div className='sans-serif'>
          <div className='pb-3 bigger'>
            <h2 className='pb-3'>{item.manufacturer || "Anonymous"}</h2>
            <h1 className='pb-0'>{item.name}</h1>
            {item.formalName && <i className='block'>{item.formalName}</i>}
            {item.manufactureDate && <p className='block'>{item.manufactureDate}</p>}
            {item.manufactureLocation && <p className='block'>{item.manufactureLocation}</p>}
            {item.material && <i className='block'>{item.material.join(", ")}</i>}
          </div>
          <div className='pb-3'>
            {item.releaseDate && <small className='block'>Released {item.releaseDate}</small>}
            {(item.acquisitionDate || item.acquisitionLocation) && <small className='block'>Acquired {dateLocation(item.acquisitionDate, item.acquisitionLocation)}</small>}
          </div>
          {item.description && <p className='pb-3 white-space-pre-wrap'>{item.description}</p>}
          <div className='pb-3'>
            <QueryPreservingLink to={`/${user.id}/${collection.id}/${item.id}`}>
              <code className='color-black even-smaller'>
                <small>{itemUrl}</small></code>
            </QueryPreservingLink>
          </div>
          {/* <QrCode item={item} user={user} collection={collection} onLoad={(() => window.print())} context="print"/> */}
          <div className="flex justify-center items-center pb-3">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
              <path d="M 50 50 L 50 20 A 30 30 0 0 0 20 50 Z" fill="cyan"/>
              <path d="M 50 50 L 80 50 A 30 30 0 0 0 50 20 Z" fill="magenta"/>
              <path d="M 50 50 L 20 50 A 30 30 0 0 0 50 80 Z" fill="yellow"/>
              <path d="M 50 50 L 50 80 A 30 30 0 0 0 80 50 Z" fill="black"/>
              <circle cx="50" cy="50" r="30" fill="none" stroke="black" stroke-width="2"/>
              <line x1="5" y1="50" x2="95" y2="50" stroke="black" stroke-width="3"/>
              <line x1="50" y1="5" x2="50" y2="95" stroke="black" stroke-width="3"/>
              <text x="40" y="42" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="white" text-anchor="middle">C</text>
              <text x="60" y="42" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="white" text-anchor="middle">M</text>
              <text x="40" y="62" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="white" text-anchor="middle">Y</text>
              <text x="60" y="62" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="white" text-anchor="middle">K</text>
            </svg>
          </div>
        </div>
      </article>

    </div>
  )
}
