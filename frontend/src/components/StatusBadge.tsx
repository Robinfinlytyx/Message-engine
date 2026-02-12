import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
    status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
    const getVariant = (status: string) => {
        const s = status.toUpperCase();
        switch (s) {
            case 'COMPLETED':
            case 'DELIVERED':
            case 'READ':
            case 'ACTIVE':
                return 'success';
            case 'PENDING':
            case 'QUEUED':
            case 'SENT':
                return 'warning';
            case 'FAILED':
            case 'ERROR':
            case 'INACTIVE':
                return 'error';
            default:
                return 'secondary';
        }
    };

    return (
        <Badge variant={getVariant(status)}>
            {status}
        </Badge>
    );
}
