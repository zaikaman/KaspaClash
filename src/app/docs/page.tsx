import { redirect } from 'next/navigation';
import { DEFAULT_DOC_PATH } from '@/lib/docs/config';

export default function DocsPage() {
    redirect(DEFAULT_DOC_PATH);
}
