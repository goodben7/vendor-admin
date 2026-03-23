import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export type FieldType = 'text' | 'number' | 'email' | 'password' | 'textarea' | 'select' | 'switch' | 'date';

export interface FormField {
    name: string;
    label: string;
    type: FieldType;
    placeholder?: string;
    required?: boolean;
    options?: { value: string; label: string }[];
    defaultValue?: any;
}

interface FormBuilderProps {
    fields: FormField[];
    schema: any;
    onSubmit: (data: any) => void | Promise<void>;
    submitLabel?: string;
    isLoading?: boolean;
    defaultValues?: Record<string, any>;
}

export default function FormBuilder({
    fields,
    schema,
    onSubmit,
    submitLabel = 'Enregistrer',
    isLoading = false,
    defaultValues = {},
}: FormBuilderProps) {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(schema),
        defaultValues,
    });

    const renderField = (field: FormField) => {
        const error = errors[field.name];

        switch (field.type) {
            case 'text':
            case 'email':
            case 'password':
                return (
                    <div key={field.name} className="space-y-2">
                        <Label htmlFor={field.name}>
                            {field.label} {field.required && <span className="text-destructive">*</span>}
                        </Label>
                        <Input
                            id={field.name}
                            type={field.type}
                            placeholder={field.placeholder}
                            {...register(field.name)}
                        />
                        {error && <p className="text-sm text-destructive">{error.message as string}</p>}
                    </div>
                );

            case 'number':
                return (
                    <div key={field.name} className="space-y-2">
                        <Label htmlFor={field.name}>
                            {field.label} {field.required && <span className="text-destructive">*</span>}
                        </Label>
                        <Input
                            id={field.name}
                            type="number"
                            step="0.01"
                            placeholder={field.placeholder}
                            {...register(field.name, { valueAsNumber: true })}
                        />
                        {error && <p className="text-sm text-destructive">{error.message as string}</p>}
                    </div>
                );

            case 'textarea':
                return (
                    <div key={field.name} className="space-y-2">
                        <Label htmlFor={field.name}>
                            {field.label} {field.required && <span className="text-destructive">*</span>}
                        </Label>
                        <textarea
                            id={field.name}
                            placeholder={field.placeholder}
                            className="w-full px-3 py-2 border rounded-md bg-background min-h-[100px]"
                            {...register(field.name)}
                        />
                        {error && <p className="text-sm text-destructive">{error.message as string}</p>}
                    </div>
                );

            case 'select':
                return (
                    <div key={field.name} className="space-y-2">
                        <Label htmlFor={field.name}>
                            {field.label} {field.required && <span className="text-destructive">*</span>}
                        </Label>
                        <select
                            id={field.name}
                            className="w-full px-3 py-2 border rounded-md bg-background"
                            {...register(field.name)}
                        >
                            <option value="">Sélectionner...</option>
                            {field.options?.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        {error && <p className="text-sm text-destructive">{error.message as string}</p>}
                    </div>
                );

            case 'switch':
                return (
                    <div key={field.name} className="flex items-center space-x-2">
                        <input
                            id={field.name}
                            type="checkbox"
                            className="w-4 h-4"
                            {...register(field.name)}
                        />
                        <Label htmlFor={field.name}>{field.label}</Label>
                        {error && <p className="text-sm text-destructive">{error.message as string}</p>}
                    </div>
                );

            case 'date':
                return (
                    <div key={field.name} className="space-y-2">
                        <Label htmlFor={field.name}>
                            {field.label} {field.required && <span className="text-destructive">*</span>}
                        </Label>
                        <Input
                            id={field.name}
                            type="date"
                            {...register(field.name)}
                        />
                        {error && <p className="text-sm text-destructive">{error.message as string}</p>}
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {fields.map((field) => renderField(field))}

            <div className="pt-4">
                <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading ? 'En cours...' : submitLabel}
                </Button>
            </div>
        </form>
    );
}
