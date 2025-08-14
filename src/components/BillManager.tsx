'use client'

import { useState, useEffect } from 'react'
import AuthModal from './AuthModal'
import BillCard from './BillCard'
import CreateBillModal from './CreateBillModal'
import BillDetailsModal from './BillDetailsModal'
import FloatingTerminal from './FloatingTerminal'

interface User {
  id: string
  email: string
  name: string
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
  user: User
  items: BillItem[]
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

interface ItemAssignment {
  id: string
  name: string
  amount: number
  paid: boolean
}

export default function BillManager() {
  const [user, setUser] = useState<User | null>(null)
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)
  const [authModal, setAuthModal] = useState({ isOpen: false, mode: 'signin' as 'signin' | 'signup' })
  const [createBillModal, setCreateBillModal] = useState(false)
  const [billDetailsModal, setBillDetailsModal] = useState<{ isOpen: boolean; billId: string | null }>({
    isOpen: false,
    billId: null
  })

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (user) {
      fetchBills()
    }
  }, [user])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const userData = await response.json()
        setUser(userData.user)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchBills = async () => {
    try {
      const response = await fetch('/api/bills')
      if (response.ok) {
        const data = await response.json()
        setBills(data.bills)
      }
    } catch (error) {
      console.error('Failed to fetch bills:', error)
    }
  }

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/signout', { method: 'POST' })
      setUser(null)
      setBills([])
    } catch (error) {
      console.error('Sign out failed:', error)
    }
  }

  const openBillDetails = (billId: string) => {
    setBillDetailsModal({ isOpen: true, billId })
  }

  const handleAuthSuccess = async () => {
    await checkAuth()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 font-sans">
        <div className="container mx-auto p-6">
          <div className="text-center py-20">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Bill Manager</h1>
            <p className="text-gray-600 mb-8 text-lg">Create and manage bills with item assignments</p>
            <div className="space-x-4">
              <button
                onClick={() => setAuthModal({ isOpen: true, mode: 'signin' })}
                className="py-3 px-6 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => setAuthModal({ isOpen: true, mode: 'signup' })}
                className="py-3 px-6 border border-blue-600 text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition-colors"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>

        <AuthModal
          isOpen={authModal.isOpen}
          onClose={() => setAuthModal({ ...authModal, isOpen: false })}
          mode={authModal.mode}
          onToggleMode={() => setAuthModal({ 
            ...authModal, 
            mode: authModal.mode === 'signin' ? 'signup' : 'signin' 
          })}
          onAuthSuccess={handleAuthSuccess}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Bill Manager</h1>
              <p className="text-gray-600 mt-2">Welcome back, {user.name}!</p>
            </div>
            <button
              onClick={handleSignOut}
              className="py-2 px-4 text-gray-600 hover:text-gray-800 font-medium"
            >
              Sign Out
            </button>
          </div>
        </div>

        <div className="mb-6">
          <button
            onClick={() => setCreateBillModal(true)}
            className="py-3 px-4 inline-flex items-center gap-x-2 text-sm font-semibold rounded-lg border border-transparent bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none"
          >
            <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14"></path>
              <path d="M12 5v14"></path>
            </svg>
            Create New Bill
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bills.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500">No bills created yet. Click "Create New Bill" to get started!</p>
            </div>
          ) : (
            bills.map((bill) => (
              <BillCard
                key={bill.id}
                bill={bill}
                onClick={() => openBillDetails(bill.id)}
              />
            ))
          )}
        </div>
      </div>

      <CreateBillModal
        isOpen={createBillModal}
        onClose={() => setCreateBillModal(false)}
        onBillCreated={() => {
          fetchBills()
          setCreateBillModal(false)
        }}
      />

      {billDetailsModal.billId && (
        <BillDetailsModal
          isOpen={billDetailsModal.isOpen}
          onClose={() => setBillDetailsModal({ isOpen: false, billId: null })}
          billId={billDetailsModal.billId}
          onBillUpdated={fetchBills}
        />
      )}

      <FloatingTerminal
        onBillCreated={fetchBills}
        onBillUpdated={fetchBills}
      />
    </div>
  )
}