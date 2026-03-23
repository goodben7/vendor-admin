import { useState } from 'react';
import { useCreateProfile, usePermissions } from '@/hooks/useUsers';
import { PersonType } from '@/types/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select';

interface ProfileFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function ProfileFormDialog({ open, onOpenChange }: ProfileFormDialogProps) {
    const createMutation = useCreateProfile();
    const { data: permissionsData, isLoading: isLoadingPermissions } = usePermissions();

    const [formData, setFormData] = useState({
        label: '',
        personType: 'SPADM' as PersonType,
        permission: [] as string[],
        active: true,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            await createMutation.mutateAsync(formData);
            // Reset form
            setFormData({
                label: '',
                personType: 'SPADM',
                permission: [],
                active: true,
            });
            onOpenChange(false);
        } catch (error) {
            // Error is handled by the mutation
        }
    };

    // Transform permissions data for MultiSelect
    const permissionOptions = (permissionsData || []).map((perm) => ({
        label: perm.label,
        value: perm.role,
    }));

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Créer un nouveau profil</DialogTitle>
                    <DialogDescription>
                        Remplissez les informations pour créer un nouveau profil utilisateur.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        {/* Label */}
                        <div className="grid gap-2">
                            <Label htmlFor="label">Nom du profil *</Label>
                            <Input
                                id="label"
                                value={formData.label}
                                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                                placeholder="Ex: Administrateur"
                                required
                            />
                        </div>

                        {/* Person Type */}
                        <div className="grid gap-2">
                            <Label htmlFor="personType">Type de personne *</Label>
                            <Select
                                value={formData.personType}
                                onValueChange={(value) => setFormData({ ...formData, personType: value as PersonType })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Sélectionnez un type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="SPADM">Super Administrateur</SelectItem>
                                    <SelectItem value="ADM">Administrateur</SelectItem>
                                    <SelectItem value="MGR">Manager</SelectItem>
                                    <SelectItem value="STF">Personnel</SelectItem>
                                    <SelectItem value="KIT">Cuisine</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Permissions */}
                        <div className="grid gap-2">
                            <Label htmlFor="permission">Permissions</Label>
                            <MultiSelect
                                options={permissionOptions}
                                selected={formData.permission}
                                onChange={(selected) => {
                                    console.log('MultiSelect onChange called with:', selected);
                                    setFormData({ ...formData, permission: selected });
                                }}
                                placeholder="Sélectionnez des permissions"
                                isLoading={isLoadingPermissions}
                            />
                            {formData.permission.length > 0 && (
                                <p className="text-xs text-muted-foreground">
                                    {formData.permission.length} permission(s) sélectionnée(s)
                                </p>
                            )}
                        </div>

                        {/* Active */}
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="active"
                                checked={formData.active}
                                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                                className="w-4 h-4"
                            />
                            <Label htmlFor="active" className="cursor-pointer">
                                Profil actif
                            </Label>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Annuler
                        </Button>
                        <Button type="submit" disabled={createMutation.isPending}>
                            {createMutation.isPending ? 'Création...' : 'Créer le profil'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
