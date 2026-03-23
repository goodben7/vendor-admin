import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, ShieldCheck, Loader2, Save, X, Eye, EyeOff } from 'lucide-react';
import { useUser, useUpdateCredentials } from '@/hooks/useUsers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';

const passwordSchema = z.object({
    newPassword: z.string().min(6, 'Le nouveau mot de passe doit contenir au moins 6 caractères'),
    confirmPassword: z.string().min(1, 'La confirmation est requise'),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

export default function UserDetailSecurity() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data: user, isLoading: userLoading } = useUser(id!);
    const updateMutation = useUpdateCredentials();

    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting, isValid, isDirty },
    } = useForm<PasswordFormData>({
        resolver: zodResolver(passwordSchema),
        defaultValues: {
            newPassword: '',
            confirmPassword: '',
        },
        mode: 'onChange',
    });

    const onSubmit = async (data: PasswordFormData) => {
        if (!user?.id) return;

        try {
            await updateMutation.mutateAsync({
                id: user.id,
                data: {
                    newPassword: data.newPassword,
                }
            });
            reset();
            navigate(`/users/${id}`);
        } catch (error) {
            console.error(error);
        }
    };

    if (userLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <Card className="border-none shadow-xl shadow-black/5 rounded-[2.5rem] overflow-hidden bg-card/50 backdrop-blur-md">
            <CardHeader className="p-8 pb-4">
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Lock className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-black tracking-tight tracking-tight uppercase italic italic">Sécurité & Accès</CardTitle>
                        <CardDescription className="font-bold text-muted-foreground/60">Réinitialiser le mot de passe de cet utilisateur</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <Separator className="opacity-50" />
            <CardContent className="p-8 pt-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
                    <div className="grid gap-6">
                        {/* Nouveau mot de passe */}
                        <div className="space-y-2">
                            <Label htmlFor="newPassword" className="text-[11px] font-black uppercase tracking-wider text-muted-foreground ml-1">Nouveau mot de passe</Label>
                            <div className="relative group">
                                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    id="newPassword"
                                    type={showNew ? "text" : "password"}
                                    placeholder="••••••••"
                                    className="pl-12 pr-12 h-12 rounded-xl bg-background/50 border-border/50 focus:ring-primary/20 transition-all font-bold"
                                    {...register('newPassword')}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNew(!showNew)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                                >
                                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {errors.newPassword && <p className="text-xs text-destructive font-bold mt-1 ml-1">{errors.newPassword.message}</p>}
                        </div>

                        {/* Confirmer le nouveau mot de passe */}
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="text-[11px] font-black uppercase tracking-wider text-muted-foreground ml-1">Confirmer le nouveau mot de passe</Label>
                            <div className="relative group">
                                <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    id="confirmPassword"
                                    type={showConfirm ? "text" : "password"}
                                    placeholder="••••••••"
                                    className="pl-12 pr-12 h-12 rounded-xl bg-background/50 border-border/50 focus:ring-primary/20 transition-all font-bold"
                                    {...register('confirmPassword')}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                                >
                                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                            {errors.confirmPassword && <p className="text-xs text-destructive font-bold mt-1 ml-1">{errors.confirmPassword.message}</p>}
                        </div>
                    </div>

                    <div className="flex items-center gap-4 pt-6">
                        <Button
                            type="submit"
                            className="h-12 px-8 rounded-xl font-black bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all group"
                            disabled={isSubmitting || !isValid || !isDirty}
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                                <Save className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                            )}
                            Enregistrer le nouveau mot de passe
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            className="h-12 px-8 rounded-xl font-bold text-muted-foreground hover:bg-accent transition-all"
                            onClick={() => {
                                navigate(`/users/${id}`);
                            }}
                        >
                            <X className="w-4 h-4 mr-2" />
                            Annuler
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
