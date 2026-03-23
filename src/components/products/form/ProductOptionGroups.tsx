import { useState } from 'react';
import { usePlatformCurrency } from '@/hooks/usePlatformCurrency';
import { Plus, LayoutGrid, ChefHat, Settings2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

export interface ProductOptionGroupConfig {
    id?: string;
    optionGroupId?: string;
    label: string;
    isRequired: boolean;
    maxChoices: number;
    isAvailable: boolean;
    items?: { id?: string; name: string; price: number; isAvailable: boolean }[];
}

interface ProductOptionGroupsProps {
    groups: ProductOptionGroupConfig[];
    onChange: (groups: ProductOptionGroupConfig[]) => void;
}

export function ProductOptionGroups({ groups, onChange }: ProductOptionGroupsProps) {
    const { symbol: currSymbol } = usePlatformCurrency();
    const [isOptionDialogOpen, setIsOptionDialogOpen] = useState(false);

    // Dialog Form State
    const [editingGroup, setEditingGroup] = useState<Partial<ProductOptionGroupConfig>>({
        isRequired: false,
        maxChoices: 1,
        isAvailable: true,
    });
    const [editIndex, setEditIndex] = useState<number | null>(null);
    const [newItem, setNewItem] = useState({ name: '', price: 0 });

    const handleAddItem = () => {
        if (!newItem.name) return;
        const newItems = [...(editingGroup.items || [])];
        newItems.push({
            name: newItem.name,
            price: newItem.price,
            isAvailable: true
        });
        setEditingGroup(prev => ({ ...prev, items: newItems }));
        setNewItem({ name: '', price: 0 });
    };

    const handleOpenAdd = () => {
        setEditingGroup({
            isRequired: false,
            maxChoices: 1,
            isAvailable: true,
            label: '',
            items: []
        });
        setNewItem({ name: '', price: 0 });
        setEditIndex(null);
        setIsOptionDialogOpen(true);
    };

    const handleOpenEdit = (group: ProductOptionGroupConfig, index: number) => {
        setEditingGroup({ ...group, items: group.items ? [...group.items] : [] });
        setNewItem({ name: '', price: 0 });
        setEditIndex(index);
        setIsOptionDialogOpen(true);
    };

    const handleSaveGroup = () => {
        if (!editingGroup.label) return;

        // Validation: If required, maxChoices must be >= 1
        let finalMaxChoices = editingGroup.maxChoices ?? 1;
        if (editingGroup.isRequired && finalMaxChoices < 1) {
            finalMaxChoices = 1;
        }

        const newGroup = {
            id: editingGroup.id || Math.random().toString(36).substr(2, 9),
            optionGroupId: editingGroup.optionGroupId,
            label: editingGroup.label,
            isRequired: editingGroup.isRequired ?? false,
            maxChoices: finalMaxChoices,
            isAvailable: editingGroup.isAvailable ?? true,
            items: editingGroup.items || [],
        };

        if (editIndex !== null) {
            const newGroups = [...groups];
            newGroups[editIndex] = newGroup;
            onChange(newGroups);
        } else {
            onChange([...groups, newGroup]);
        }

        setIsOptionDialogOpen(false);
    };

    const handleRemoveGroup = (index: number) => {
        if (window.confirm("Voulez-vous vraiment retirer ce groupe d'options ?")) {
            const newGroups = [...groups];
            newGroups.splice(index, 1);
            onChange(newGroups);
        }
    };

    return (
        <Card className="border-none shadow-sm rounded-2xl bg-card overflow-hidden">
            <CardHeader className="bg-card px-8 pt-8 pb-4 flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
                        <Settings2 className="w-5 h-5 text-muted-foreground" />
                        Personnalisation du produit
                    </CardTitle>
                    <CardDescription>Permettez aux clients de personnaliser ce produit (cuisson, suppléments...)</CardDescription>
                </div>
                <Button onClick={handleOpenAdd} type="button" variant="outline" size="sm" className="border-dashed border-border hover:border-primary hover:text-primary bg-background">
                    <Plus className="w-4 h-4 mr-2" />
                    Ajouter une option
                </Button>
            </CardHeader>
            <Separator />
            <CardContent className="p-8">
                {groups.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                        {groups.map((group, index) => (
                            <div
                                key={group.id || index}
                                className="group relative flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 rounded-xl border border-border bg-card shadow-sm hover:border-primary/30 hover:shadow-md transition-all duration-200"
                            >
                                <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                                        <LayoutGrid className="w-6 h-6" />
                                    </div>
                                    <div className="space-y-1">
                                        <h4 className="text-base font-bold text-foreground">{group.label}</h4>
                                        <div className="flex flex-wrap items-center gap-2">
                                            {group.isRequired ? (
                                                <Badge variant="secondary" className="bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900/50 hover:bg-amber-100/80">
                                                    Obligatoire
                                                </Badge>
                                            ) : (
                                                <Badge variant="outline" className="text-muted-foreground border-border">
                                                    Facultatif
                                                </Badge>
                                            )}
                                            <Badge variant="outline" className="text-primary bg-primary/10 border-primary/20">
                                                Max {group.maxChoices} choix
                                            </Badge>
                                            {!group.isAvailable && (
                                                <Badge variant="destructive" className="bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900/50 hover:bg-red-100/80">
                                                    Indisponible
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 mt-4 sm:mt-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleOpenEdit(group, index)}
                                        className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                                    >
                                        Modifier
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                        onClick={() => handleRemoveGroup(index)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-12 text-center bg-muted/10 rounded-2xl border-2 border-dashed border-border hover:border-primary/40 transition-colors group cursor-pointer" onClick={handleOpenAdd}>
                        <div className="w-16 h-16 bg-card rounded-full shadow-sm flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                            <ChefHat className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <h3 className="text-foreground font-semibold text-lg">Aucune personnalisation</h3>
                        <p className="text-sm text-muted-foreground max-w-sm mx-auto mt-2 mb-6">
                            Créez des options comme "Sauces", "Cuisson" ou "Suppléments" pour enrichir ce produit.
                        </p>
                        <Button type="button" variant="outline" className="border-border text-primary hover:bg-primary/10">
                            <Plus className="w-4 h-4 mr-2" />
                            Ajouter une option
                        </Button>
                    </div>
                )}

                {/* MODAL / DRAWER */}
                <Dialog open={isOptionDialogOpen} onOpenChange={setIsOptionDialogOpen}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>{editIndex !== null ? 'Modifier l\'option' : 'Ajouter une option'}</DialogTitle>
                            <DialogDescription>
                                Configurez les règles pour cette option.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-6 py-4">

                            {/* Label */}
                            <div className="space-y-2">
                                <Label htmlFor="optionLabel" className="text-foreground font-medium">Nom de l'option <span className="text-destructive">*</span></Label>
                                <Input
                                    id="optionLabel"
                                    value={editingGroup.label || ''}
                                    onChange={(e) => setEditingGroup(prev => ({ ...prev, label: e.target.value }))}
                                    placeholder="Ex: Cuisson de la viande"
                                    className="h-11 border-border bg-background focus:border-primary"
                                />
                            </div>

                            {/* Configuration Row */}
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="maxChoices" className="text-foreground font-medium">Choix Maximum</Label>
                                    <Input
                                        id="maxChoices"
                                        type="number"
                                        min="1"
                                        value={editingGroup.maxChoices}
                                        onChange={(e) => setEditingGroup(prev => ({ ...prev, maxChoices: parseInt(e.target.value) || 1 }))}
                                        className="h-11 border-border bg-background"
                                    />
                                    {editingGroup.isRequired && (editingGroup.maxChoices || 1) < 1 && (
                                        <p className="text-xs text-destructive">Doit être au moins 1 si obligatoire</p>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-foreground font-medium block">Contraintes</Label>
                                    <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                                        <span className="text-sm text-foreground">Obligatoire</span>
                                        <Switch
                                            checked={editingGroup.isRequired}
                                            onCheckedChange={(checked) => setEditingGroup(prev => ({ ...prev, isRequired: checked }))}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Availability */}
                            <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/20">
                                <div className="space-y-0.5">
                                    <Label className="text-base font-medium text-foreground">Activer cette option</Label>
                                    <p className="text-xs text-muted-foreground">Rendre cette option visible pour ce produit</p>
                                </div>
                                <Switch
                                    checked={editingGroup.isAvailable}
                                    onCheckedChange={(checked) => setEditingGroup(prev => ({ ...prev, isAvailable: checked }))}
                                    className="data-[state=checked]:bg-green-500"
                                />
                            </div>

                            <Separator />

                            {/* Option Items Management */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label className="text-foreground font-medium">Liste des variantes ({editingGroup.items?.length || 0})</Label>
                                </div>

                                {/* Add New Option Item */}
                                <div className="flex gap-2 items-end bg-muted/30 p-3 rounded-xl border border-dashed border-border">
                                    <div className="flex-1 space-y-1">
                                        <Label htmlFor="newItemName" className="text-xs text-muted-foreground">Nom de la variante</Label>
                                        <Input
                                            id="newItemName"
                                            value={newItem.name}
                                            onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="Ex: Saignante"
                                            className="h-9 bg-background border-border"
                                        />
                                    </div>
                                    <div className="w-24 space-y-1">
                                        <Label htmlFor="newItemPrice" className="text-xs text-muted-foreground">Supplé. ({currSymbol})</Label>
                                        <Input
                                            id="newItemPrice"
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={newItem.price}
                                            onChange={(e) => setNewItem(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                                            placeholder="0.00"
                                            className="h-9 bg-background border-border"
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        onClick={handleAddItem}
                                        disabled={!newItem.name}
                                        size="sm"
                                        className="h-9 w-9 p-0 shrink-0"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>

                                {/* Items List */}
                                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
                                    {editingGroup.items?.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-card border border-border rounded-lg shadow-sm group hover:border-primary/20 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div>
                                                    <p className="text-sm font-medium text-foreground">{item.name}</p>
                                                    <p className="text-xs text-muted-foreground">{item.price > 0 ? `+${item.price.toFixed(2)}${currSymbol}` : 'Gratuit'}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        const newItems = [...(editingGroup.items || [])];
                                                        newItems.splice(idx, 1);
                                                        setEditingGroup(prev => ({ ...prev, items: newItems }));
                                                    }}
                                                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    {(!editingGroup.items || editingGroup.items.length === 0) && (
                                        <div className="text-center py-6 text-sm text-muted-foreground italic bg-muted/10 rounded-lg">
                                            Aucune variante ajoutée
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setIsOptionDialogOpen(false)}>Annuler</Button>
                            <Button type="button" onClick={handleSaveGroup} className="bg-primary text-white hover:bg-primary/90">
                                {editIndex !== null ? 'Mettre à jour' : 'Ajouter l\'option'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}
