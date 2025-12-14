import { Sidebar } from './Sidebar';
import { Outlet } from 'react-router-dom';

export function MainLayout() {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="pl-64 transition-all duration-300">
        <div className="min-h-screen">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
