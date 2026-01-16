import { GetServerSideProps } from 'next';

export const getServerSideProps: GetServerSideProps = async () => {
  return {
    redirect: {
      destination: '/mbo',
      permanent: false,
    },
  };
};

export default function TMaxRedirect() {
  return null;
}
