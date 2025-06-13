import { useLoaderData } from "react-router";
import { loadItem } from "../manifest";
import { QueryPreservingLink } from "../components/QueryPreservingLink";

export const loader = loadItem;

export default function WallLabelPage() {
  const { item, user, collection } = useLoaderData() as Awaited<ReturnType<typeof loader>>;
  const itemUrl = `poppenhu.is/${user.id}/${collection.id}/${item.id}`;
  const itemQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=96x96&data=${encodeURIComponent(itemUrl)}`

  const dateLocation = (date?: string, location?: string) => {
    const acc = []
    if (date) acc.push(date)
    if (location) acc.push("in " + location)
    return acc.join(", ")
  }

  // NOTE: This component is styled entirely with utility classes.
  // Please continue this convention in this component.
  return (
    <article className='really-short'>
      <div className='no-print pb-3'>
        <QueryPreservingLink to={`/${user.id}/${collection.id}/${item.id}`}>← non-label page</QueryPreservingLink>
      </div>
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
        <img src={itemQrCodeUrl} alt="QR code" onLoad={() => window.print()} />
      </div>
    </article>
  )
}
