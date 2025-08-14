'use client'

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
  currency: string
  serviceCharge: number
  taxRate: number
  discount: number
  createdAt: string
  user: User
  items: BillItem[]
}

interface SharedBillViewProps {
  bill: Bill
}

export default function SharedBillView({ bill }: SharedBillViewProps) {
  const currencySymbol = CURRENCIES.find(c => c.code === bill.currency)?.symbol || bill.currency

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
          <div className="bg-blue-100 border border-blue-300 rounded-lg p-4 mb-6">
            <p className="text-blue-800 text-sm font-medium">
              📋 This is a shared bill - view only
            </p>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900">{bill.name}</h1>
          <p className="text-gray-600 mt-2">Reference: {bill.reference}</p>
          <p className="text-gray-500 text-sm">Created by {bill.user.name} on {formatDate(bill.createdAt)}</p>
          <p className="text-gray-500 text-sm">Currency: {currencySymbol} ({bill.currency})</p>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {item.assignedTo || <span className="text-gray-400">Unassigned</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex gap-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.paid ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {item.paid ? '💰 Paid' : '⏳ Pending'}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.verified ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {item.verified ? '✅ Verified' : '⏳ Unverified'}
                        </span>
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
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">Service Charge</p>
              <p className="font-semibold">{bill.serviceCharge}%</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">Tax Rate</p>
              <p className="font-semibold">{bill.taxRate}%</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-600">Discount</p>
              <p className="font-semibold">{currencySymbol}{bill.discount.toFixed(2)}</p>
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