'use client'

import { useState, useEffect } from 'react'
import { CURRENCIES, BILL_VISIBILITY_OPTIONS, type BillVisibility } from '@/lib/constants'

interface ItemAssignment {
  id: string
  name: string
  amount: number
  paid: boolean
}

interface BillItem {
  id: string
  name: string
  itemId: string | null
  amount: number
  quantity: number
  total: number
  assignedTo: string | null
  paid: boolean
  verified: boolean
  assignments: ItemAssignment[]
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
  items: BillItem[]
}

interface BillDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  billId: string
  onBillUpdated: () => void
}

export default function BillDetailsModal({ isOpen, onClose, billId, onBillUpdated }: BillDetailsModalProps) {
  const [bill, setBill] = useState<Bill | null>(null)
  const [loading, setLoading] = useState(true)
  const [itemForm, setItemForm] = useState({
    name: '',
    itemId: '',
    amount: '',
    quantity: 1
  })

  useEffect(() => {
    if (isOpen && billId) {
      fetchBill()
    }
  }, [isOpen, billId])

  const fetchBill = async () => {
    try {
      const response = await fetch(`/api/bills/${billId}`)
      if (response.ok) {
        const data = await response.json()
        setBill(data.bill)
      }
    } catch (error) {
      console.error('Failed to fetch bill:', error)
    } finally {
      setLoading(false)
    }
  }

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch(`/api/bills/${billId}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: itemForm.name,
          itemId: itemForm.itemId || null,
          amount: parseFloat(itemForm.amount),
          quantity: itemForm.quantity,
        }),
      })

      if (response.ok) {
        setItemForm({ name: '', itemId: '', amount: '', quantity: 1 })
        fetchBill()
        onBillUpdated()
      }
    } catch (error) {
      console.error('Failed to add item:', error)
    }
  }

  const updateBillSettings = async (field: string, value: number | string) => {
    try {
      const response = await fetch(`/api/bills/${billId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [field]: value }),
      })

      if (response.ok) {
        setBill(prev => prev ? { ...prev, [field]: value } : null)
        fetchBill()
        onBillUpdated()
      }
    } catch (error) {
      console.error('Failed to update bill:', error)
    }
  }

  const updateItemAssignment = async (itemId: string, assignedTo: string) => {
    try {
      const response = await fetch(`/api/bills/${billId}/items/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assignedTo }),
      })

      if (response.ok) {
        fetchBill()
      }
    } catch (error) {
      console.error('Failed to update assignment:', error)
    }
  }

  const updateItemStatus = async (itemId: string, field: string, value: boolean) => {
    try {
      const response = await fetch(`/api/bills/${billId}/items/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [field]: value }),
      })

      if (response.ok) {
        fetchBill()
      }
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const calculateSummary = () => {
    if (!bill) return { subtotal: 0, serviceCharge: 0, tax: 0, total: 0 }
    
    const subtotal = bill.items.reduce((sum, item) => sum + item.total, 0)
    const serviceCharge = subtotal * bill.serviceCharge / 100
    const tax = (subtotal + serviceCharge) * bill.taxRate / 100
    const total = Math.max(0, subtotal + serviceCharge + tax - bill.discount)
    
    return { subtotal, serviceCharge, tax, total }
  }

  const copyShareLink = async () => {
    if (bill?.shareToken) {
      const shareUrl = `${window.location.origin}/shared/${bill.shareToken}`
      try {
        await navigator.clipboard.writeText(shareUrl)
        alert('Share link copied to clipboard!')
      } catch (error) {
        console.error('Failed to copy:', error)
      }
    }
  }

  const currencySymbol = bill ? CURRENCIES.find(c => c.code === bill.currency)?.symbol || bill.currency : '$'

  if (!isOpen) return null

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-lg p-6">
          <div className="text-gray-600">Loading...</div>
        </div>
      </div>
    )
  }

  if (!bill) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white rounded-lg p-6">
          <div className="text-red-600">Bill not found</div>
        </div>
      </div>
    )
  }

  const summary = calculateSummary()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 overflow-y-auto">
      <div className="bg-white rounded-lg p-6 w-full max-w-6xl m-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <div>
              <h3 className="text-2xl font-bold text-gray-800">{bill.name}</h3>
              <p className="text-gray-600">Reference: {bill.reference}</p>
              <p className="text-gray-500 text-sm">Currency: {currencySymbol} ({bill.currency})</p>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  bill.visibility === 'PUBLIC' 
                    ? 'bg-green-100 text-green-600' 
                    : bill.visibility === 'READ_ONLY'
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {BILL_VISIBILITY_OPTIONS.find(option => option.value === bill.visibility)?.label || bill.visibility}
                </span>
              </div>
            </div>
            {bill.visibility !== 'PRIVATE' && bill.shareToken && (
              <button
                onClick={copyShareLink}
                className="py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
              >
                📤 Copy Share Link
              </button>
            )}
          </div>
          <button
            type="button"
            className="text-gray-400 hover:text-gray-600"
            onClick={onClose}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        {/* Add Item Form */}
        <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
          <h4 className="font-semibold text-gray-800 mb-3">Add New Item</h4>
          <form onSubmit={addItem} className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <input
              type="text"
              placeholder="Item name"
              value={itemForm.name}
              onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
              className="py-2 px-3 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
            <input
              type="text"
              placeholder="Item ID"
              value={itemForm.itemId}
              onChange={(e) => setItemForm({ ...itemForm, itemId: e.target.value })}
              className="py-2 px-3 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500"
            />
            <input
              type="number"
              placeholder="Amount"
              step="0.01"
              value={itemForm.amount}
              onChange={(e) => setItemForm({ ...itemForm, amount: e.target.value })}
              className="py-2 px-3 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
            <input
              type="number"
              placeholder="Qty"
              value={itemForm.quantity}
              onChange={(e) => setItemForm({ ...itemForm, quantity: parseInt(e.target.value) || 1 })}
              className="py-2 px-3 border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
            <button
              type="submit"
              className="py-2 px-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
            >
              Add Item
            </button>
          </form>
        </div>

        {/* Items List */}
        <div className="mb-6">
          <h4 className="font-semibold text-gray-800 mb-3">Items</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned To</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {bill.items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.itemId || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{currencySymbol}{item.amount.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.quantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{currencySymbol}{item.total.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="text"
                        placeholder="Name1, Name2..."
                        value={item.assignedTo || ''}
                        onChange={(e) => updateItemAssignment(item.id, e.target.value)}
                        className="py-1 px-2 border border-gray-200 rounded text-sm focus:border-blue-500 focus:ring-blue-500 w-32"
                        title={`Enter names separated by commas (max ${item.quantity} people)`}
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={item.paid}
                            onChange={(e) => updateItemStatus(item.id, 'paid', e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-1 text-xs">Paid</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={item.verified}
                            onChange={(e) => updateItemStatus(item.id, 'verified', e.target.checked)}
                            className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                          />
                          <span className="ml-1 text-xs">Verified</span>
                        </label>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bill Settings Section */}
        <div className="border-t pt-6 mb-6">
          <h4 className="font-semibold text-gray-800 mb-4">Bill Settings</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select
                value={bill.currency}
                onChange={(e) => updateBillSettings('currency', e.target.value)}
                className="py-2 px-3 block w-full border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {CURRENCIES.map((currency) => (
                  <option key={currency.code} value={currency.code}>
                    {currency.symbol} {currency.code} - {currency.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
              <select
                value={bill.visibility}
                onChange={(e) => updateBillSettings('visibility', e.target.value)}
                className="py-2 px-3 block w-full border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {BILL_VISIBILITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {BILL_VISIBILITY_OPTIONS.find(option => option.value === bill.visibility)?.description}
              </p>
            </div>
          </div>
        </div>

        {/* Summary Section */}
        <div className="border-t pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service Charge (%)</label>
              <input
                type="number"
                placeholder="0"
                step="0.01"
                value={bill.serviceCharge}
                onChange={(e) => updateBillSettings('serviceCharge', parseFloat(e.target.value) || 0)}
                className="py-2 px-3 block w-full border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SST/Tax (%)</label>
              <input
                type="number"
                placeholder="0"
                step="0.01"
                value={bill.taxRate}
                onChange={(e) => updateBillSettings('taxRate', parseFloat(e.target.value) || 0)}
                className="py-2 px-3 block w-full border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Voucher/Discount</label>
              <input
                type="number"
                placeholder="0"
                step="0.01"
                value={bill.discount}
                onChange={(e) => updateBillSettings('discount', parseFloat(e.target.value) || 0)}
                className="py-2 px-3 block w-full border border-gray-200 rounded-lg text-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex justify-between items-center text-sm mb-2">
              <span>Subtotal:</span>
              <span>{currencySymbol}{summary.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm mb-2">
              <span>Service Charge:</span>
              <span>{currencySymbol}{summary.serviceCharge.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm mb-2">
              <span>Tax:</span>
              <span>{currencySymbol}{summary.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm mb-2">
              <span>Discount:</span>
              <span>-{currencySymbol}{bill.discount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-lg font-bold border-t pt-2">
              <span>Total:</span>
              <span>{currencySymbol}{summary.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}