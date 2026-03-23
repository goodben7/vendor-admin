import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Upload, X } from 'lucide-react';

interface ImageUploaderProps {
    value?: string;
    onChange: (url: string) => void;
    onFileSelect?: (file: File | null) => void;
}

export function ImageUploader({ value, onChange, onFileSelect }: ImageUploaderProps) {
    const [preview, setPreview] = useState<string | undefined>(value);
    const [isDragging, setIsDragging] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) {
            await uploadFile(file);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            await uploadFile(file);
        }
    };

    const uploadFile = async (file: File) => {
        if (onFileSelect) onFileSelect(file);

        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            setPreview(result);
            onChange(result); // Support existing preview logic
        };
        reader.readAsDataURL(file);
    };

    const clean = () => {
        setPreview(undefined);
        onChange('');
        if (onFileSelect) onFileSelect(null);
    };

    return (
        <div className="space-y-2">
            <div
                className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center transition-colors ${isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
                    }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                {preview ? (
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden group">
                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                        <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={clean}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    </div>
                ) : (
                    <div className="text-center space-y-4">
                        <div className="p-4 rounded-full bg-muted w-16 h-16 mx-auto flex items-center justify-center">
                            <Upload className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="font-medium">Glissez une image ici</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                ou cliquez pour parcourir
                            </p>
                        </div>
                        <Input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            id="image-upload"
                            onChange={handleFileChange}
                        />
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById('image-upload')?.click()}
                        >
                            Parcourir les fichiers
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
