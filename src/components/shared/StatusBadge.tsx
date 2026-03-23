import { OrderStatus, PaymentStatus, ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '@/types/entities';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
    status: OrderStatus | PaymentStatus | string;
    type?: 'order' | 'payment' | 'default';
    className?: string;
}

const orderStatusColors: Record<OrderStatus, string> = {
    D: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
    K: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
    R: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
    S: 'bg-zinc-800 text-zinc-100 border-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-200',
    C: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
};

const paymentStatusColors: Record<PaymentStatus, string> = {
    P: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    S: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    F: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

export default function StatusBadge({ status, type = 'default', className }: StatusBadgeProps) {
    let label = status;
    let colorClass = 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';

    if (type === 'order' && status in ORDER_STATUS_LABELS) {
        label = ORDER_STATUS_LABELS[status as OrderStatus];
        colorClass = orderStatusColors[status as OrderStatus];
    } else if (type === 'payment' && status in PAYMENT_STATUS_LABELS) {
        label = PAYMENT_STATUS_LABELS[status as PaymentStatus];
        colorClass = paymentStatusColors[status as PaymentStatus];
    }

    return (
        <span
            className={cn(
                'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                colorClass,
                className
            )}
        >
            {label}
        </span>
    );
}
