import React from 'react';
import { FileX } from 'lucide-react';

interface EmptyStateProps {
    title: React.ReactNode;
    description?: string;
    icon?: React.ReactNode;
    action?: React.ReactNode;
}

export default function EmptyState({ title, description, icon, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                {icon || <FileX className="w-8 h-8 text-muted-foreground" />}
            </div>
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            {description && (
                <p className="text-muted-foreground text-sm max-w-md mb-4">{description}</p>
            )}
            {action}
        </div>
    );
}
