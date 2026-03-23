import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import Breadcrumbs from './Breadcrumbs';

export default function AppShell() {
    const [sidebarOpen, setSidebarOpen] = useState(true);

    return (
        <div className="min-h-screen bg-background">
            {/* Sidebar */}
            <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

            {/* Main content */}
            <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-20'}`}>
                {/* Topbar */}
                <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

                {/* Content area */}
                <main className="p-6">
                    <Breadcrumbs />
                    <div className="mt-4">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
}
