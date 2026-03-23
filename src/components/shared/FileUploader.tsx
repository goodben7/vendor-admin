import { useState, useCallback } from 'react';
import { Upload, X, FileIcon, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface FileUploaderProps {
    onFileSelect: (file: File) => void;
    onFileRemove?: () => void;
    accept?: string;
    maxSize?: number; // in MB
    preview?: string | null;
    label?: string;
    description?: string;
    disabled?: boolean;
}

export default function FileUploader({
    onFileSelect,
    onFileRemove,
    accept = 'image/*',
    maxSize = 5,
    preview,
    label = 'Télécharger un fichier',
    description = 'Glissez-déposez ou cliquez pour sélectionner',
    disabled = false,
}: FileUploaderProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const validateFile = (file: File): boolean => {
        setError(null);

        // Check file size
        const fileSizeMB = file.size / (1024 * 1024);
        if (fileSizeMB > maxSize) {
            setError(`Le fichier est trop volumineux. Taille maximale: ${maxSize}MB`);
            return false;
        }

        // Check file type
        if (accept && accept !== '*') {
            const acceptedTypes = accept.split(',').map(t => t.trim());
            const fileType = file.type;
            const fileExtension = `.${file.name.split('.').pop()}`;

            const isAccepted = acceptedTypes.some(type => {
                if (type.endsWith('/*')) {
                    const baseType = type.split('/')[0];
                    return fileType.startsWith(baseType);
                }
                return type === fileType || type === fileExtension;
            });

            if (!isAccepted) {
                setError(`Type de fichier non accepté. Types acceptés: ${accept}`);
                return false;
            }
        }

        return true;
    };

    const handleFileChange = (file: File) => {
        if (validateFile(file)) {
            onFileSelect(file);
        }
    };

    const handleDragEnter = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) {
            setIsDragging(true);
        }
    }, [disabled]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (disabled) return;

        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
            handleFileChange(files[0]);
        }
    }, [disabled]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFileChange(files[0]);
        }
    };

    const handleRemove = () => {
        setError(null);
        onFileRemove?.();
    };

    const isImage = preview && (preview.startsWith('data:image') || preview.match(/\.(jpg|jpeg|png|gif|webp)$/i));

    return (
        <div className="space-y-2">
            {label && (
                <label className="text-sm font-medium">{label}</label>
            )}

            {preview ? (
                <div className="relative border-2 border-dashed rounded-lg p-4">
                    {isImage ? (
                        <div className="relative">
                            <img
                                src={preview}
                                alt="Preview"
                                className="max-h-64 mx-auto rounded-lg object-contain"
                            />
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                            <FileIcon className="w-8 h-8 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">Fichier sélectionné</p>
                                <p className="text-xs text-muted-foreground">Prêt pour l'upload</p>
                            </div>
                        </div>
                    )}
                    {!disabled && (
                        <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2"
                            onClick={handleRemove}
                        >
                            <X className="w-4 h-4" />
                        </Button>
                    )}
                </div>
            ) : (
                <div
                    className={cn(
                        'border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer',
                        isDragging && 'border-primary bg-primary/5',
                        !isDragging && 'border-muted-foreground/25 hover:border-primary/50',
                        disabled && 'opacity-50 cursor-not-allowed',
                        error && 'border-destructive'
                    )}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => {
                        if (!disabled) {
                            document.getElementById('file-input')?.click();
                        }
                    }}
                >
                    <input
                        id="file-input"
                        type="file"
                        accept={accept}
                        onChange={handleInputChange}
                        className="hidden"
                        disabled={disabled}
                    />

                    <div className="flex flex-col items-center gap-2">
                        {isDragging ? (
                            <Upload className="w-12 h-12 text-primary animate-bounce" />
                        ) : (
                            <ImageIcon className="w-12 h-12 text-muted-foreground" />
                        )}
                        <div>
                            <p className="text-sm font-medium">
                                {isDragging ? 'Déposez le fichier ici' : description}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                Taille maximale: {maxSize}MB
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {error && (
                <p className="text-sm text-destructive">{error}</p>
            )}
        </div>
    );
}
