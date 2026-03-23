import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, User, Mail, Phone, Shield, Lock } from 'lucide-react';
import { z } from 'zod';
import { useUser, useCreateUser, useUpdateUser, useProfiles } from '@/hooks/useUsers';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import LoadingSkeleton from '@/components/shared/LoadingSkeleton';
import { Separator } from '@/components/ui/separator';

const baseUserSchema = z.object({
    email: z.string().email('Email invalide'),
    displayName: z.string().min(1, 'Le nom d\'affichage est requis'),
    phone: z.string().optional(),
});

// Schema for creation - requires profile and password
const createUserSchema = baseUserSchema.extend({
    profile: z.string().min(1, 'Le profil est requis'),
    plainPassword: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
});

// Schema for update - only personal info, no profile or password
const updateUserSchema = baseUserSchema;

type CreateUserFormData = z.infer<typeof createUserSchema>;
type UpdateUserFormData = z.infer<typeof updateUserSchema>;

export default function UserForm() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const isEdit = !!id;

    const { data: user, isLoading: userLoading } = useUser(id!);
    const { data: profilesData } = useProfiles();
    const createMutation = useCreateUser();
    const updateMutation = useUpdateUser();

    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors, isValid, isSubmitting },
    } = useForm<CreateUserFormData | UpdateUserFormData>({
        resolver: zodResolver(isEdit ? updateUserSchema : createUserSchema),
        defaultValues: isEdit ? {
            displayName: '',
            email: '',
            phone: '',
        } : {
            displayName: '',
            email: '',
            phone: '',
            profile: '',
            plainPassword: '',
        },
        mode: 'onChange',
    });

    useEffect(() => {
        if (user) {
            reset({
                displayName: user.displayName,
                email: user.email,
                phone: user.phone || '',
                ...(isEdit ? {} : {
                    profile: typeof user.profile === 'object' ? user.profile?.id : (user.profile ? user.profile.split('/').pop() : ''),
                    plainPassword: '',
                }),
            } as any);
        }
    }, [user, reset]);

    const onSubmit = async (data: any) => {
        // Prepare data for API
        const apiData: any = {
            email: data.email,
            displayName: data.displayName,
            phone: data.phone || '',
            profile: `/api/profiles/${data.profile}`, // Convert to IRI format
        };

        // Add password only if provided
        if (data.plainPassword && data.plainPassword.trim() !== '') {
            apiData.plainPassword = data.plainPassword;
        }

        try {
            if (isEdit) {
                await updateMutation.mutateAsync({ id: id!, data: apiData });
            } else {
                await createMutation.mutateAsync(apiData);
            }
            navigate('/users');
        } catch (error) {
            console.error(error);
        }
    };

    if (isEdit && userLoading) {
        return <LoadingSkeleton />;
    }

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4 bg-muted/20">
            <Card className="w-full max-w-[560px] shadow-sm border-muted/60">
                <CardHeader className="space-y-1">
                    <div className="flex items-center gap-2 mb-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="-ml-2 h-8 w-8"
                            onClick={() => navigate('/users')}
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                        <CardTitle className="text-2xl font-bold">
                            {isEdit ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
                        </CardTitle>
                    </div>
                    <CardDescription className="text-base">
                        {isEdit
                            ? 'Modifiez les informations et les accès de cet utilisateur.'
                            : 'Créez un nouvel utilisateur et définissez son profil d\'accès.'}
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">

                        {/* 1. Informations personnelles */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                                <User className="w-4 h-4" />
                                <h3>Informations personnelles</h3>
                            </div>
                            <Separator />

                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="displayName">Nom d'affichage <span className="text-destructive">*</span></Label>
                                    <Input
                                        id="displayName"
                                        placeholder="John Doe"
                                        {...register('displayName')}
                                    />
                                    {errors.displayName && <p className="text-xs text-destructive">{errors.displayName.message as string}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="email"
                                            type="email"
                                            className="pl-9"
                                            placeholder="john@example.com"
                                            {...register('email')}
                                        />
                                    </div>
                                    {errors.email && <p className="text-xs text-destructive">{errors.email.message as string}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone">Téléphone</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="phone"
                                            className="pl-9"
                                            placeholder="+33 6 12 34 56 78"
                                            {...register('phone')}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. Profil d'accès - Only shown during creation */}
                        {!isEdit && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                                    <Shield className="w-4 h-4" />
                                    <h3>Profil et sécurité</h3>
                                </div>
                                <Separator />

                                <div className="grid gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="profile">Profil <span className="text-destructive">*</span></Label>
                                        <Controller
                                            name="profile"
                                            control={control}
                                            render={({ field }) => (
                                                <Select
                                                    onValueChange={field.onChange}
                                                    defaultValue={field.value}
                                                    value={field.value}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Sélectionner un profil" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {profilesData?.map((profile) => (
                                                            <SelectItem key={profile.id} value={profile.id}>
                                                                {profile.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                        {(errors as any).profile && <p className="text-xs text-destructive">{(errors as any).profile.message as string}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="plainPassword">
                                            Mot de passe
                                            <span className="text-destructive"> *</span>
                                        </Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="plainPassword"
                                                type="password"
                                                className="pl-9"
                                                placeholder="••••••••"
                                                {...register('plainPassword')}
                                            />
                                        </div>
                                        {(errors as any).plainPassword && <p className="text-xs text-destructive">{(errors as any).plainPassword.message as string}</p>}
                                    </div>
                                </div>
                            </div>
                        )}



                        {/* Actions */}
                        <div className="flex items-center gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                className="w-full"
                                onClick={() => navigate('/users')}
                            >
                                Annuler
                            </Button>
                            <Button
                                type="submit"
                                className="w-full"
                                disabled={isSubmitting || !isValid}
                            >
                                {isSubmitting ? (
                                    <>Enregistrement...</>
                                ) : (
                                    <>{isEdit ? 'Mettre à jour' : 'Créer l\'utilisateur'}</>
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
