import dynamic from 'next/dynamic';
// @ts-ignore
const KaizenBoard = dynamic(() => import('@components/kaizen/KaizenBoard'), { ssr: false });
export default KaizenBoard;
