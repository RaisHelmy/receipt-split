export const CURRENCIES = [
  { code: 'RM', symbol: 'RM', name: 'Malaysian Ringgit' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht' },
  { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
  { code: 'PHP', symbol: '₱', name: 'Philippine Peso' },
] as const

export type CurrencyCode = typeof CURRENCIES[number]['code']

export const BILL_VISIBILITY_OPTIONS = [
  { value: 'PRIVATE', label: 'Private', description: 'Only you can see and edit this bill' },
  { value: 'READ_ONLY', label: 'Read Only', description: 'Anyone with the link can view but not edit' },
  { value: 'PUBLIC', label: 'Public', description: 'Anyone with the link can view and edit' },
] as const

export type BillVisibility = 'PRIVATE' | 'READ_ONLY' | 'PUBLIC'