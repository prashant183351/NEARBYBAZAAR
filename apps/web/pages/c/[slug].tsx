import { GetServerSideProps } from 'next';
import Link from 'next/link';
import { SeoHead } from '../../components/SeoHead';

interface Props {
  slug: string;
}

export default function ClassifiedDetail({ slug }: Props) {
  const name = slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <>
      <SeoHead title={name + ' | Classified'} description={`Details for classified: ${name}`} />
      <main style={{ padding: 32 }}>
        <h1>Classified Detail</h1>
        <p>Slug: {slug}</p>
        <Link href={`/inquire/${slug}`}>
          <button>Inquire</button>
        </Link>
      </main>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug } = context.params as { slug: string };
  return { props: { slug } };
};
