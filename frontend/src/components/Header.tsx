import React from 'react';
import { LogOut, RefreshCw } from 'lucide-react';

interface HeaderProps {
    username: string;
    role: string;
    onFetch: () => void;
    onSignOut: () => void;
}

const Header: React.FC<HeaderProps> = ({ username, role, onFetch, onSignOut }) => {
    return (
        <div className="flex items-center justify-between p-6 mb-8 glass">
            <div>
                <h1 className="text-2xl font-bold text-text-main">Task Management</h1>
                <p className="text-text-muted">Welcome, <span className="text-primary font-medium">{username}</span> ({role})</p>
            </div>
            <div className="flex items-center gap-3">
                <button
                    onClick={onFetch}
                    className="p-3 transition-colors border rounded-lg border-border hover:bg-white/5 text-text-main"
                    title="Refresh missions"
                >
                    <RefreshCw size={20} />
                </button>
                <button
                    onClick={onSignOut}
                    className="flex items-center gap-2 px-4 py-2 text-white bg-red-500 rounded-lg hover:bg-red-600 transition-all font-semibold"
                >
                    <LogOut size={18} />
                    <span>Sign Out</span>
                </button>
            </div>
        </div>
    );
};

export default Header;
