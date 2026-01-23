export function Size(props: { ts: unknown[]; t: string; }) {
  const { ts, t } = props;
  const plural = t && ts && (ts.length > 1 || ts.length === 0) ? "s" : "";

  return <span className='size'>({ts.length}&nbsp;{t}{plural})</span>;
}
