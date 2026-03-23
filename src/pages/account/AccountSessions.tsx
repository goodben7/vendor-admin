import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

export default function AccountSessions() {
    return (
        <Card className="border-none shadow-xl shadow-black/5 rounded-2xl overflow-hidden">
            <CardHeader className="p-8 pb-4">
                <CardTitle className="text-2xl font-black tracking-tight">Sessions actives</CardTitle>
                <CardDescription className="font-bold text-muted-foreground/60">Consultez et gérez les navigateurs et appareils connectés à votre compte.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-4">
                <div className="p-12 border-2 border-dashed border-border/50 rounded-3xl flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center mb-4">
                        <span className="text-2xl">💻</span>
                    </div>
                    <h3 className="font-black text-lg tracking-tight">Zone en construction</h3>
                    <p className="text-sm font-medium text-muted-foreground mt-1 max-w-xs">Le suivi des sessions sera disponible prochainement.</p>
                </div>
            </CardContent>
        </Card>
    );
}
