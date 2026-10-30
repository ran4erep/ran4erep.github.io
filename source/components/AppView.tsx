
import React from 'react';

interface AppViewProps {
    path: string;
    title: string;
}

export const AppView: React.FC<AppViewProps> = ({ path, title }) => (
    <div className="h-screen">
        <iframe src={path} title={title} className="w-full h-full border-0 block" />
    </div>
);
