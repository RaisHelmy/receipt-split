'use client'

import { useState } from 'react'
import { CURRENCIES } from '@/lib/constants'

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

interface User {
  name: string
}

interface Bill {
  id: string
  name: string
  reference: string
  visibility: string
  currency: string
  serviceCharge: number
  taxRate: number
  discount: number
  createdAt: string
  user: User
  items: BillItem[]
}

interface EditableSharedBillViewProps {
  bill: Bill
}

export default function EditableSharedBillView({ bill: initialBill }: EditableSharedBillViewProps) {
  const [bill, setBill] = useState(initialBill)
  const [itemForm, setItemForm] = useState({
    name: '',
    itemId: '',
    amount: '',
    quantity: 1
  })

  const currencySymbol = CURRENCIES.find(c => c.code === bill.currency)?.symbol || bill.currency

  const addItem = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch(`/api/shared/${bill.id}/items`, {
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
        // Refresh bill data
        window.location.reload()
      }
    } catch (error) {
      console.error('Failed to add item:', error)
    }
  }

  const updateBillSettings = async (field: string, value: number) => {
    try {
      const response = await fetch(`/api/shared/${bill.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [field]: value }),
      })

      if (response.ok) {
        setBill(prev => ({ ...prev, [field]: value }))
      }
    } catch (error) {
      console.error('Failed to update bill:', error)
    }
  }

  const updateItemAssignment = async (itemId: string, assignedTo: string) => {
    try {
      const response = await fetch(`/api/shared/${bill.id}/items/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assignedTo }),
      })

      if (response.ok) {
        setBill(prev => ({
          ...prev,
          items: prev.items.map(item =>
            item.id === itemId ? { ...item, assignedTo } : item
          )
        }))
      }
    } catch (error) {
      console.error('Failed to update assignment:', error)
    }
  }

  const updateItemStatus = async (itemId: string, field: string, value: boolean) => {
    try {
      const response = await fetch(`/api/shared/${bill.id}/items/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ [field]: value }),
      })

      if (response.ok) {
        setBill(prev => ({
          ...prev,
          items: prev.items.map(item =>
            item.id === itemId ? { ...item, [field]: value } : item
          )
        }))
      }
    } catch (error) {
      console.error('Failed to update status:', error)
    }
  }

  const calculateSummary = () => {
    const subtotal = bill.items.reduce((sum, item) => sum + item.total, 0)
    const serviceCharge = subtotal * bill.serviceCharge / 100
    const tax = (subtotal + serviceCharge) * bill.taxRate / 100
    const total = Math.max(0, subtotal + serviceCharge + tax - bill.discount)
    
    return { subtotal, serviceCharge, tax, total }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const summary = calculateSummary()

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-green-100 border border-green-300 rounded-lg p-4 mb-6">
            <p className="text-green-800 text-sm font-medium">
              ✏️ This is a public bill - you can view and edit items
            </p>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900">{bill.name}</h1>
          <p className="text-gray-600 mt-2">Reference: {bill.reference}</p>
          <p className="text-gray-500 text-sm">Created by {bill.user.name} on {formatDate(bill.createdAt)}</p>
          <p className="text-gray-500 text-sm">Currency: {currencySymbol} ({bill.currency})</p>
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
        <div className="mb-6 bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h4 className="font-semibold text-gray-800">Items ({bill.items.length})</h4>
          </div>
          
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
              <tbody className="divide-y divide-gray-200 bg-white">
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

        {/* Summary Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h4 className="font-semibold text-gray-800 mb-4">Bill Summary</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Tax Rate (%)</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount</label>
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
            <div className="flex justify-between items-center text-lg font-bold border-t pt-2 mt-2">
              <span>Total:</span>
              <span>{currencySymbol}{summary.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            Want to create your own bills? 
            <a href="/" className="text-blue-600 hover:underline ml-1">
              Get started with Bill Manager
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}