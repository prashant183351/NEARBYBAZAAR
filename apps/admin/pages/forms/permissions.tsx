import dynamic from 'next/dynamic';
// @ts-ignore
const FormPermissions = dynamic(() => import('@components/forms/FormPermissions'), { ssr: false });
export default FormPermissions;
