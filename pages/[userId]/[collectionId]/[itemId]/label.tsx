import { GetServerSideProps } from "next";
import { loadItem } from "../../../../src/manifest-extras";
import { QueryPreservingLink as NextQueryPreservingLink } from "../../../../src/components/NextQueryPreservingLink";
import { QrCode } from "../../../../src/components/QrCode";
import '../../../../src/routes/label.css'
import type { Item, Collection, User } from "../../../../src/manifest";

interface WallLabelPageProps {
  item: Item;
  user: User;
  collection: Collection;
}

export const getServerSideProps: GetServerSideProps<WallLabelPageProps> = async (context) => {
  const { userId, collectionId, itemId } = context.params as { userId: string; collectionId: string; itemId: string };
  const request = new Request(`http://localhost${context.resolvedUrl}`);
  
  try {
    const { item, user, collection } = await loadItem({ params: { userId, collectionId, itemId }, request });
    return {
      props: {
        item,
        user,
        collection,
      },
    };
  } catch (error) {
    return {
      notFound: true,
    };
  }
};

function Plus({ idSuffix }: { idSuffix: string }) {
  return (
    <div>
      <svg id={`plus-${idSuffix}`} width="16" height="16">
        <line x1="8" y1="2" x2="8" y2="14" stroke="black" strokeWidth="1"/>
        <line x1="2" y1="8" x2="14" y2="8" stroke="black" strokeWidth="1"/>
      </svg>
    </div>
  );
}

function RegistrationMark({ idSuffix }: { idSuffix: string }) {
  return (
    <div id={`registration-mark-${idSuffix}`}>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="24" height="24">
        <path d="M 50 50 L 50 20 A 30 30 0 0 0 20 50 Z" fill="cyan"/>
        <path d="M 50 50 L 80 50 A 30 30 0 0 0 50 20 Z" fill="magenta"/>
        <path d="M 50 50 L 20 50 A 30 30 0 0 0 50 80 Z" fill="yellow"/>
        <path d="M 50 50 L 50 80 A 30 30 0 0 0 80 50 Z" fill="black"/>
        <circle cx="50" cy="50" r="30" fill="none" stroke="black" strokeWidth="2"/>
        <line x1="5" y1="50" x2="95" y2="50" stroke="black" strokeWidth="3"/>
        <line x1="50" y1="5" x2="50" y2="95" stroke="black" strokeWidth="3"/>
        <text x="40" y="42" fontFamily="Arial, sans-serif" fontSize="8" fontWeight="bold" fill="white" textAnchor="middle">C</text>
        <text x="60" y="42" fontFamily="Arial, sans-serif" fontSize="8" fontWeight="bold" fill="white" textAnchor="middle">M</text>
        <text x="40" y="62" fontFamily="Arial, sans-serif" fontSize="8" fontWeight="bold" fill="white" textAnchor="middle">Y</text>
        <text x="60" y="62" fontFamily="Arial, sans-serif" fontSize="8" fontWeight="bold" fill="white" textAnchor="middle">K</text>
      </svg>
    </div>
  )
}

function KcmyTestBar() {
  const colors = ["#000000", "#00BCD4", "#E040FB", "#FFEB3B"];
  return (
    <div id="kcmy-test-bar" style={{ display: "flex" }}>
      {colors.map((color, i) => (
        <div
          key={i}
          style={{
            minWidth: "0.8cm",
            height: "0.1cm",
            background: color,
            margin: 0,
            padding: 0,
            border: "none",
          }}
        />
      ))}
    </div>
  );
}

export default function WallLabelPage({ item, user, collection }: WallLabelPageProps) {
  const itemUrl = `poppenhu.is/${user.id}/${collection.id}/${item.id}`;

  const dateLocation = (date?: string, location?: string) => {
    const acc = []
    if (date) acc.push(date)
    if (location) acc.push("in " + location)
    return acc.join(", ")
  }

  return (
    <div>
      <div className='no-print' style={{ padding: "1ch" }}>
        <NextQueryPreservingLink to={`/${user.id}/${collection.id}/${item.id}`}>← non-label page</NextQueryPreservingLink>
      </div>
      <article id="label" className='really-short'>
        <div>
          <KcmyTestBar />
        </div>
        <div>
          <Plus idSuffix="top-left" />
          <Plus idSuffix="top-right" />
          <Plus idSuffix="bottom-left" />
          <Plus idSuffix="bottom-right" />
        </div>
        <div>
          <RegistrationMark idSuffix="top-left" />
          <RegistrationMark idSuffix="top-right" />
          <RegistrationMark idSuffix="bottom-left" />
          <RegistrationMark idSuffix="bottom-right" />
        </div>
        <div id="main-container">
          <div id="header-section">
            {item.manufacturer && <h2 id="manufacturer-title">{item.manufacturer}</h2>}
            <h1 id="item-name">{item.name}</h1>
            {item.formalName && <i id="formal-name">{item.formalName}</i>}
            {item.manufactureDate && <p id="manufacture-date">{item.manufactureDate}</p>}
            {item.manufactureLocation && <p id="manufacture-location">{item.manufactureLocation}</p>}
            {item.material && <i id="material-list">{item.material.join(", ")}</i>}
          </div>
          <div id="dates-section">
            {item.releaseDate && <small id="release-date">Released {item.releaseDate}</small>}
            {(item.acquisitionDate || item.acquisitionLocation) && <small id="acquisition-info">Acquired {dateLocation(item.acquisitionDate, item.acquisitionLocation)}</small>}
          </div>
          {item.description && <p id="description">{item.description}</p>}
          <div id="qr-code-section">
            <QrCode item={item} user={user} collection={collection} onLoad={(() => typeof window !== 'undefined' && window.print())} context="print"/>
          </div>
          <div id="url-section">
            <NextQueryPreservingLink to={`/${user.id}/${collection.id}/${item.id}`}>
              <code id="item-url">
                <small>{itemUrl}</small></code>
            </NextQueryPreservingLink>
          </div>
        </div>
      </article>

    </div>
  )
}
