import Head from 'next/head';

const BASE_URL = "https://poppenhu.is";

export interface NextMeta {
  title: string;
  description: string;
  image: string;
  url: string;
}

export const DEFAULT_META = {
  title: "poppenhuis",
  description: "a digital dollhouse",
  image: `${BASE_URL}/og.jpeg`,
  url: BASE_URL,
};

export function NextMetaHead({ meta }: { meta: NextMeta }) {
  return (
    <Head>
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
    </Head>
  );
}
