import * as React from "react";
import { X, Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface MultiSelectOption {
    label: string;
    value: string;
}

interface MultiSelectProps {
    options: MultiSelectOption[];
    selected: string[];
    onChange: (selected: string[]) => void;
    placeholder?: string;
    className?: string;
    isLoading?: boolean;
}

export function MultiSelect({
    options,
    selected,
    onChange,
    placeholder = "Sélectionnez...",
    className,
    isLoading = false,
}: MultiSelectProps) {
    const [open, setOpen] = React.useState(false);
    const [search, setSearch] = React.useState("");
    const dropdownRef = React.useRef<HTMLDivElement>(null);
    const buttonRef = React.useRef<HTMLButtonElement>(null);

    // Close dropdown when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredOptions = React.useMemo(() => {
        if (!search) return options;
        return options.filter((option) =>
            option.label.toLowerCase().includes(search.toLowerCase())
        );
    }, [options, search]);

    const handleSelect = (value: string) => {
        const newSelected = selected.includes(value)
            ? selected.filter((item) => item !== value)
            : [...selected, value];

        onChange(newSelected);
    };

    const handleRemove = (value: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onChange(selected.filter((item) => item !== value));
    };

    return (
        <div className="relative w-full">
            <Button
                ref={buttonRef}
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className={cn("w-full justify-between min-h-[40px] h-auto py-2", className)}
                onClick={() => setOpen(!open)}
            >
                <div className="flex gap-1 flex-wrap flex-1 mr-2">
                    {selected.length === 0 ? (
                        <span className="text-muted-foreground">{placeholder}</span>
                    ) : (
                        selected.map((value) => {
                            const option = options.find((opt) => opt.value === value);
                            return (
                                <Badge
                                    key={value}
                                    variant="secondary"
                                    className="mr-1 mb-1 cursor-pointer"
                                    onClick={(e: React.MouseEvent) => handleRemove(value, e)}
                                >
                                    {option?.label}
                                    <X className="ml-1 h-3 w-3" />
                                </Badge>
                            );
                        })
                    )}
                </div>
                <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0 self-start mt-1" />
            </Button>

            {open && (
                <div
                    ref={dropdownRef}
                    className="absolute z-50 w-full mt-1 rounded-md border bg-popover text-popover-foreground shadow-md"
                >
                    <div className="p-2 border-b">
                        <Input
                            placeholder="Rechercher..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="h-9"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                    <div className="max-h-64 overflow-y-auto p-2">
                        {isLoading ? (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                                Chargement...
                            </div>
                        ) : filteredOptions.length === 0 ? (
                            <div className="py-6 text-center text-sm text-muted-foreground">
                                Aucun résultat trouvé
                            </div>
                        ) : (
                            filteredOptions.map((option) => {
                                const isSelected = selected.includes(option.value);
                                return (
                                    <div
                                        key={option.value}
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                        }}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleSelect(option.value);
                                        }}
                                        className={cn(
                                            "flex items-center gap-2 px-2 py-2 text-sm rounded-sm cursor-pointer hover:bg-accent select-none transition-colors",
                                            isSelected && "bg-accent"
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                "flex h-4 w-4 items-center justify-center rounded-sm border border-primary flex-shrink-0",
                                                isSelected
                                                    ? "bg-primary text-primary-foreground"
                                                    : "opacity-50 [&_svg]:invisible"
                                            )}
                                        >
                                            <Check className="h-3 w-3" />
                                        </div>
                                        <span className="select-none flex-1">{option.label}</span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
