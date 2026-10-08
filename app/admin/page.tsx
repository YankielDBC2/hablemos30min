import AdminDashboard from "@/components/admin-dashboard";
import { privateMetadata } from "@/lib/seo";
import "./admin.css";

export const metadata = privateMetadata('/admin', 'Administración', 'Acceso privado a la administración de reservas de Hablemos30min.');

export default function AdminPage() {
  return <AdminDashboard />;
}
