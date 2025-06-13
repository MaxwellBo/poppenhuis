import { Helmet } from 'react-helmet';
import { Meta } from '../meta';

export function HelmetMeta(props: { meta: Meta }) {
  const { meta } = props;
  return (
    <Helmet>
      <title>{meta.title}</title>
      <meta name="description" content={meta.description} />
      <meta property="og:title" content={meta.title} />
      <meta property="og:description" content={meta.description} />
      <meta property="og:image" content={meta.image} />
      <meta property="og:url" content={meta.url} />
      <meta property="twitter:title" content={meta.title} />
      <meta property="twitter:description" content={meta.description} />
      <meta property="twitter:image" content={meta.image} />
      <meta property="twitter:url" content={meta.url} />
    </Helmet>
  );
}