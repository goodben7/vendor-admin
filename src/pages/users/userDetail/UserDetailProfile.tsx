import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Mail, Phone, Loader2, Save, X } from 'lucide-react';
import { useUser, useUpdateUser } from '@/hooks/useUsers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useNavigate, useParams } from 'react-router-dom';

const profileSchema = z.object({
    email: z.string().email('Email invalide'),
    displayName: z.string().min(1, 'Le nom complet est requis'),
    phone: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function UserDetailProfile() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { data: user, isLoading: userLoading } = useUser(id!);
    const updateMutation = useUpdateUser();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isDirty, isSubmitting },
    } = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            displayName: '',
            email: '',
            phone: '',
        },
    });

    useEffect(() => {
        if (user) {
            reset({
                displayName: user.displayName?.replace(/\s*\([^)]*\)$/, '') || '',
                email: user.email,
                phone: user.phone || '',
            });
        }
    }, [user, reset]);

    const onSubmit = async (data: ProfileFormData) => {
        if (!user?.id) return;

        try {
            await updateMutation.mutateAsync({
                id: user.id,
                data: {
                    email: data.email,
                    displayName: data.displayName,
                    phone: data.phone || '',
                }
            });
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
                        <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl font-black tracking-tight tracking-tight uppercase italic italic">Informations personnelles</CardTitle>
                        <CardDescription className="font-bold text-muted-foreground/60">Modifier les informations de profil de cet utilisateur</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <Separator className="opacity-50" />
            <CardContent className="p-8 pt-6">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
                    <div className="grid gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="displayName" className="text-[11px] font-black uppercase tracking-wider text-muted-foreground ml-1">Nom complet</Label>
                            <Input
                                id="displayName"
                                placeholder="..."
                                className="h-12 rounded-xl bg-background/50 border-border/50 focus:ring-primary/20 transition-all font-bold"
                                {...register('displayName')}
                            />
                            {errors.displayName && <p className="text-xs text-destructive font-bold mt-1 ml-1">{errors.displayName.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-[11px] font-black uppercase tracking-wider text-muted-foreground ml-1">Adresse email</Label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="user@example.com"
                                    className="pl-12 h-12 rounded-xl bg-background/50 border-border/50 focus:ring-primary/20 transition-all font-bold"
                                    {...register('email')}
                                />
                            </div>
                            {errors.email && <p className="text-xs text-destructive font-bold mt-1 ml-1">{errors.email.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone" className="text-[11px] font-black uppercase tracking-wider text-muted-foreground ml-1">Téléphone</Label>
                            <div className="relative group">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    id="phone"
                                    placeholder="+243 ..."
                                    className="pl-12 h-12 rounded-xl bg-background/50 border-border/50 focus:ring-primary/20 transition-all font-bold"
                                    {...register('phone')}
                                />
                            </div>
                            {errors.phone && <p className="text-xs text-destructive font-bold mt-1 ml-1">{errors.phone.message}</p>}
                        </div>
                    </div>

                    <div className="flex items-center gap-4 pt-6">
                        <Button
                            type="submit"
                            className="h-12 px-8 rounded-xl font-black bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all group"
                            disabled={isSubmitting || !isDirty}
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            ) : (
                                <Save className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                            )}
                            Enregistrer les changements
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
