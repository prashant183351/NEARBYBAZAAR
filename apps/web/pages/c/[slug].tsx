import { GetStaticPaths, GetStaticProps } from 'next';
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

export const getStaticPaths: GetStaticPaths = async () => {
  // In a real app, fetch all classified slugs from API
  return {
    paths: [], // fallback: 'blocking' for on-demand generation
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps = async (context) => {
  const { slug } = context.params as { slug: string };
  // In a real app, fetch classified data by slug
  return { props: { slug } };
};
