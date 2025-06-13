export function Size(props: { ts: unknown[]; t: string; }) {
  const { ts, t } = props;
  const plural = t && ts && ts.length > 1 ? "s" : "";

  return <span className='size'>({ts.length} {t}{plural})</span>;
}
