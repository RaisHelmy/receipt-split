'use client'

import { CURRENCIES, BILL_VISIBILITY_OPTIONS } from '@/lib/constants'

interface BillItem {
  id: string
  name: string
  amount: number
  quantity: number
  total: number
}

interface Bill {
  id: string
  name: string
  reference: string
  visibility: string
  shareToken: string | null
  currency: string
  serviceCharge: number
  taxRate: number
  discount: number
  createdAt: string
  items: BillItem[]
}

interface BillCardProps {
  bill: Bill
  onClick: () => void
}

export default function BillCard({ bill, onClick }: BillCardProps) {
  const currencySymbol = CURRENCIES.find(c => c.code === bill.currency)?.symbol || bill.currency
  const visibilityConfig = BILL_VISIBILITY_OPTIONS.find(option => option.value === bill.visibility)

  const calculateTotal = () => {
    const subtotal = bill.items.reduce((sum, item) => sum + item.total, 0)
    const serviceCharge = subtotal * bill.serviceCharge / 100
    const tax = (subtotal + serviceCharge) * bill.taxRate / 100
    return Math.max(0, subtotal + serviceCharge + tax - bill.discount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const copyShareLink = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (bill.shareToken) {
      const shareUrl = `${window.location.origin}/shared/${bill.shareToken}`
      try {
        await navigator.clipboard.writeText(shareUrl)
        alert('Share link copied to clipboard!')
      } catch (error) {
        console.error('Failed to copy:', error)
      }
    }
  }

  return (
    <div
      className="bg-white border-2 border-gray-200 rounded-xl shadow-sm p-6 hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer transform hover:scale-105"
      onClick={onClick}
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-gray-800">{bill.name}</h3>
        {bill.visibility !== 'PRIVATE' && bill.shareToken && (
          <button
            onClick={copyShareLink}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            title="Copy share link"
          >
            📤 Share
          </button>
        )}
      </div>
      
      <p className="text-sm text-gray-600 mb-2">Ref: {bill.reference}</p>
      <p className="text-sm text-gray-500 mb-2">Currency: {currencySymbol} ({bill.currency})</p>
      
      {bill.visibility !== 'PRIVATE' && (
        <div className="mb-2">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
            bill.visibility === 'PUBLIC' 
              ? 'bg-green-100 text-green-600' 
              : 'bg-blue-100 text-blue-600'
          }`}>
            {visibilityConfig?.label || bill.visibility}
          </span>
        </div>
      )}
      
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm text-gray-500">{bill.items.length} items</span>
        <span className="text-lg font-bold text-blue-600">{currencySymbol}{calculateTotal().toFixed(2)}</span>
      </div>
      
      <p className="text-xs text-gray-400 mb-3">{formatDate(bill.createdAt)}</p>
      
      <div className="text-center">
        <span className="text-xs bg-blue-100 text-blue-600 px-3 py-1 rounded-full font-medium">
          👆 Click to manage items
        </span>
      </div>
    </div>
  )
}