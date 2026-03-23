import { Card } from "@/components/ui/card";

export default function Settings() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-black italic tracking-tighter uppercase underline decoration-primary/30 underline-offset-8">Paramètres</h1>
            <Card className="p-6">
                <p className="text-muted-foreground">
                    Configuration générale de l'application et du restaurant.
                </p>
                <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-md">
                    Module en cours de développement
                </div>
            </Card>
        </div>
    );
}
