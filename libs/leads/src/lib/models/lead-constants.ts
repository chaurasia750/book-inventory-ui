export const LEAD_STATUS_BADGE: Record<string, string> = {
  new: 'bg-saffron-50 text-saffron-600 border-saffron-200',
  hot: 'bg-red-50 text-red-500 border-red-200',
  warm: 'bg-yellow-50 text-yellow-600 border-yellow-200',
  cold: 'bg-gray-50 text-gray-500 border-gray-200',
  converted: 'bg-green-50 text-green-600 border-green-200',
  lost: 'bg-pink-50 text-pink-500 border-pink-200',
};

export function getLeadStatusBadge(status: string): string {
  return LEAD_STATUS_BADGE[status] || LEAD_STATUS_BADGE['new'];
}
