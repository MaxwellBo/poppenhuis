import { Size } from '../components/Size';
import { ItemCards } from '../components/ItemCards';
import { useLoaderData, useSearchParams, Link } from "react-router";
import { loadCollection } from "../manifest";
import { metaForCollection } from "../meta";
import Markdown from "react-markdown";
import { HelmetMeta } from '../components/HelmetMeta';
import { QueryPreservingLink } from '../components/QueryPreservingLink';
import { PageHeader } from '../components/PageHeader';
import * as yaml from 'js-yaml';

const ITEMS_PER_PAGE = 30;

export const loader = loadCollection;

function searchWithPage(searchParams: URLSearchParams, page: number): string {
  const next = new URLSearchParams(searchParams);
  next.delete('page');
  if (page > 0) next.set('page', String(page));
  return next.toString();
}

function CollectionPagination(props: {
  basePath: string;
  searchParams: URLSearchParams;
  searchWithPage: (searchParams: URLSearchParams, page: number) => string;
  currentPage: number;
  totalPages: number;
}) {
  const { basePath, searchParams, searchWithPage, currentPage, totalPages } = props;
  if (totalPages <= 1) return null;
  const prevPage = currentPage === 0 ? totalPages - 1 : currentPage - 1;
  const nextPage = currentPage === totalPages - 1 ? 0 : currentPage + 1;
  const prevIsWrap = currentPage === 0;
  const nextIsWrap = currentPage === totalPages - 1;
  return (
    <div className="pagination">
      <QueryPreservingLink
        to={basePath}
        pushParam={prevPage > 0 ? new Map([['page', String(prevPage)]]) : undefined}
        triggerKey="h"
      >
        {prevIsWrap ? '↻ go to end' : '← prev'}
      </QueryPreservingLink>
      {' · '}
      Page:{' '}
      {Array.from({ length: totalPages }, (_, i) => (
        <span key={i}>
          {i > 0 && ' '}
          {i === currentPage ? (
            <b>{i}</b>
          ) : (
            <Link to={{ pathname: basePath, search: searchWithPage(searchParams, i) }}>{i}</Link>
          )}
        </span>
      ))}
      {' · '}
      <QueryPreservingLink
        to={basePath}
        pushParam={nextPage > 0 ? new Map([['page', String(nextPage)]]) : undefined}
        triggerKey="l"
      >
        {nextIsWrap ? 'back to start ↺' : 'next →'}
      </QueryPreservingLink>
    </div>
  );
}

export default function CollectionPage() {
  const { collection, user } = useLoaderData() as Awaited<ReturnType<typeof loader>>;
  const [searchParams] = useSearchParams();
  const pageParam = searchParams.get('page');
  const page = Math.max(0, parseInt(pageParam ?? '0', 10) || 0);
  const totalPages = Math.max(1, Math.ceil(collection.items.length / ITEMS_PER_PAGE));
  const currentPage = Math.min(page, totalPages - 1);
  const start = currentPage * ITEMS_PER_PAGE;
  const end = start + ITEMS_PER_PAGE;
  const paginatedCollection = { ...collection, items: collection.items.slice(start, end) };

  const collectionYaml = yaml.dump(collection);
  const meta = metaForCollection(collection, user);
  const basePath = `/${user.id}/${collection.id}`;

  return <article>
    <HelmetMeta meta={meta} />
    <PageHeader>
        <QueryPreservingLink to="/">poppenhuis</QueryPreservingLink> / <QueryPreservingLink to={`/${user.id}`}>{user.name}</QueryPreservingLink> / {collection.name} / <Size ts={collection.items} t="item" />
    </PageHeader>
    <div className="header-content">
      {(user.source === undefined || user.source === 'firebase') && (
        <div className="header-actions">
          {user.source === undefined && (
            <>
              <a href={`https://github.com/MaxwellBo/poppenhuis/issues/new?template=put-item.yml&user-id=${user.id}&collection-id=${collection.id}`}>+ add item</a>
              <a href={`https://github.com/MaxwellBo/poppenhuis/issues/new?template=put-collection.yml&user-id=${user.id}&yaml-template=${encodeURIComponent(collectionYaml)}`}>edit?</a>
              <a href={meta.image}>og image</a>
            </>
          )}
          {user.source === 'firebase' && (
            <>
              <QueryPreservingLink to={`/${user.id}/${collection.id}/new`}>+ new item</QueryPreservingLink>
              <QueryPreservingLink to={`/${user.id}/${collection.id}/edit`}>edit?</QueryPreservingLink>
              <a href={meta.image}>og image</a>
            </>
            )}
          </div>
        )}
      {collection.description && <div className='short description ugc'><Markdown>{collection.description}</Markdown></div>}
    </div>
    <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
      <CollectionPagination
        basePath={basePath}
        searchParams={searchParams}
        searchWithPage={searchWithPage}
        currentPage={currentPage}
        totalPages={totalPages}
      />
    </div>
    <ItemCards collection={paginatedCollection} user={user} />
    <div style={{ marginTop: '3ch', display: 'flex', justifyContent: 'center', width: '100%' }}>
      <CollectionPagination
        basePath={basePath}
        searchParams={searchParams}
        searchWithPage={searchWithPage}
        currentPage={currentPage}
        totalPages={totalPages}
      />
    </div>
  </article>
}