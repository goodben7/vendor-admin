import { useAboutMe } from './useUsers';
import { usePlatform, usePlatforms } from './usePlatforms';
import { Currency } from '@/types/entities';

/**
 * Returns the default currency of the connected user's platform.
 * - Tries to get platformId from /users/about
 * - Falls back to the first platform in the list (for super admins who have no platformId)
 *
 * Usage:
 *   const { symbol, currency, isLoading } = usePlatformCurrency();
 */
export function usePlatformCurrency() {
    const { data: me, isLoading: loadingMe } = useAboutMe();

    // Try to get the specific platform from user's platformId
    const platformId = me?.platformId || '';
    const { data: specificPlatform, isLoading: loadingSpecific } = usePlatform(platformId);

    // Fallback: load platforms list if no platformId
    const { data: platformsData, isLoading: loadingList } = usePlatforms(
        !platformId ? {} : undefined as any
    );

    const platform = platformId ? specificPlatform : platformsData?.data?.[0];
    const isLoading = loadingMe || (platformId ? loadingSpecific : loadingList);

    // Resolve currency — can be a Currency object or a string IRI
    let currency: Currency | undefined;
    if (platform?.currency && typeof platform.currency === 'object') {
        currency = platform.currency as Currency;
    }

    const symbol = currency?.symbol || '$';
    const code = currency?.code || '';

    return {
        /** The default currency symbol (e.g. "$", "XOF", "FCFA") */
        symbol,
        /** The default currency code (e.g. "EUR", "XOF") */
        code,
        /** The full currency object if available */
        currency,
        /** The platform object */
        platform,
        isLoading,
    };
}
