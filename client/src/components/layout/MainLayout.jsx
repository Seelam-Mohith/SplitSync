import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

export default function MainLayout() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 md:ml-60 overflow-y-auto pb-16 md:pb-0">
        <Outlet />
      </main>
    </div>
  );
}
