import { Button } from '@/components/ui/button';
import { useFormContext } from 'react-hook-form';
import { Save } from 'lucide-react';

interface ProductFooterActionsProps {
    onCancel: () => void;
    isSaving: boolean;
}

export function ProductFooterActions({ onCancel, isSaving }: ProductFooterActionsProps) {
    const { setValue } = useFormContext();

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-t border-border p-4 shadow-[0_-4px_20px_rgba(0,0,0,0,05)]">
            <div className="max-w-[1600px] mx-auto flex items-center justify-between px-6">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={onCancel}
                    disabled={isSaving}
                    className="text-muted-foreground hover:text-foreground"
                >
                    Annuler
                </Button>

                <div className="flex items-center gap-4">
                    <Button
                        type="submit"
                        disabled={isSaving}
                        onClick={() => setValue('isAvailable', true)}
                        className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 px-8"
                    >
                        <Save className="w-4 h-4 mr-2" />
                        Publier le produit
                    </Button>
                </div>
            </div>
        </div>
    );
}
