import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AlertTriangle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CancelOrderDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void;
    isPending: boolean;
}

const MIN_CHARS = 10;

export function CancelOrderDialog({ isOpen, onClose, onConfirm, isPending }: CancelOrderDialogProps) {
    const [reason, setReason] = useState('');

    const trimmed = reason.trim();
    const charCount = trimmed.length;
    const isValid = charCount >= MIN_CHARS;
    const showError = trimmed.length > 0 && !isValid;

    const handleConfirm = () => {
        if (isValid) {
            onConfirm(trimmed);
        }
    };

    const handleClose = () => {
        setReason('');
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="sm:max-w-[425px] rounded-[32px] border-none shadow-2xl p-0 overflow-hidden bg-background">
                <div className="bg-destructive/5 p-8 flex flex-col items-center text-center space-y-4">
                    <div className="bg-destructive/10 p-4 rounded-3xl text-destructive">
                        <AlertTriangle className="w-12 h-12" />
                    </div>
                    <div className="space-y-2">
                        <DialogHeader>
                            <DialogTitle className="text-3xl font-black italic uppercase tracking-tighter text-destructive leading-none mb-2">
                                Annuler la Commande
                            </DialogTitle>
                            <DialogDescription className="font-bold text-muted-foreground/60 italic text-sm">
                                Cette commande sera marquée comme annulée et retirée de la liste active. Cette action est irréversible.
                            </DialogDescription>
                        </DialogHeader>
                    </div>
                </div>

                <div className="p-8 space-y-3">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between ml-2 mr-1">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">
                                Raison de l'annulation
                            </label>
                            <span className={cn(
                                "text-[10px] font-black tabular-nums transition-colors",
                                isValid ? "text-emerald-500" : showError ? "text-destructive" : "text-muted-foreground/40"
                            )}>
                                {charCount}/{MIN_CHARS} min.
                            </span>
                        </div>
                        <Textarea
                            placeholder="Ex: Erreur de saisie, Client parti, Rupture de stock sur un article..."
                            className={cn(
                                "min-h-[120px] rounded-2xl border-2 bg-muted shadow-inner font-bold p-4 resize-none transition-colors",
                                showError
                                    ? "border-destructive/50 focus-visible:ring-destructive/30"
                                    : isValid
                                        ? "border-emerald-500/40 focus-visible:ring-emerald-500/20"
                                        : "border-transparent focus-visible:ring-muted-foreground/20"
                            )}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                        {showError && (
                            <p className="text-[11px] text-destructive font-bold ml-2 animate-in slide-in-from-top-1 duration-200">
                                ⚠️ La raison doit contenir au moins {MIN_CHARS} caractères ({MIN_CHARS - charCount} manquant{MIN_CHARS - charCount > 1 ? 's' : ''})
                            </p>
                        )}
                    </div>
                </div>

                <DialogFooter className="p-8 pt-0 flex gap-3 sm:justify-between items-center">
                    <Button
                        variant="ghost"
                        className="flex-1 h-14 rounded-2xl font-black italic uppercase tracking-widest text-xs hover:bg-muted"
                        onClick={handleClose}
                        disabled={isPending}
                    >
                        Ignorer
                    </Button>
                    <Button
                        variant="destructive"
                        className="flex-[1.5] h-14 rounded-2xl font-black italic uppercase tracking-widest text-xs shadow-xl shadow-destructive/20 gap-3 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100"
                        onClick={handleConfirm}
                        disabled={!isValid || isPending}
                    >
                        {isPending ? (
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Annulation...
                            </div>
                        ) : (
                            <>
                                <XCircle className="w-5 h-5" />
                                Confirmer l'annulation
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
