// Person Type Constants
export const PERSON_TYPE_LABELS: Record<string, string> = {
    SPADM: 'Super Administrateur',
    ADM: 'Administrateur',
    MGR: 'Manager',
    STF: 'Staff',
    KIT: 'Cuisine',
    WTR: 'Serveur',
    CSR: 'Caissier',
    SFO: 'Borne (Self-Order)',
};

export type PersonType = 'SPADM' | 'ADM' | 'MGR' | 'STF' | 'KIT' | 'WTR' | 'CSR' | 'SFO';
