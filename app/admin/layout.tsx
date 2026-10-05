import DocumentShell from '@/components/layout/DocumentShell';
import AdminShell from './AdminShell';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <DocumentShell lang="ko">
            <AdminShell>{children}</AdminShell>
        </DocumentShell>
    );
}
