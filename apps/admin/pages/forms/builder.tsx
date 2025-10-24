import dynamic from 'next/dynamic';
// @ts-ignore
const FormBuilder = dynamic(() => import('@components/forms/FormBuilder'), { ssr: false });
export default FormBuilder;
