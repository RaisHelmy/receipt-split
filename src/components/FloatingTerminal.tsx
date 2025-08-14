'use client'

import { useState, useRef, useEffect } from 'react'
import { CURRENCIES, BILL_VISIBILITY_OPTIONS, type BillVisibility } from '@/lib/constants'

interface TerminalMessage {
  id: string
  type: 'system' | 'user' | 'success' | 'error'
  content: string
  timestamp: Date
}

interface FloatingTerminalProps {
  onBillCreated?: () => void
  onBillUpdated?: () => void
}

export default function FloatingTerminal({ onBillCreated, onBillUpdated }: FloatingTerminalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<TerminalMessage[]>([])
  const [input, setInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Focus input when terminal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  // Initialize with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      addMessage('system', `Bill Manager Terminal v1.0
Type 'help' for available commands.`)
    }
  }, [isOpen, messages.length])

  const addMessage = (type: TerminalMessage['type'], content: string) => {
    const message: TerminalMessage = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, message])
  }

  // Split batch add commands while preserving quoted strings  
  const splitAddCommands = (input: string): string[] => {
    const commands: string[] = []
    let currentPos = 0
    
    // Find all 'add ' positions that are not inside quotes
    const addPositions: number[] = [0] // Start with position 0
    let inQuotes = false
    let quoteChar = ''
    
    for (let i = 0; i < input.length - 4; i++) {
      const char = input[i]
      
      if ((char === '"' || char === "'") && !inQuotes) {
        inQuotes = true
        quoteChar = char
      } else if (char === quoteChar && inQuotes) {
        inQuotes = false
        quoteChar = ''
      } else if (!inQuotes && input.substring(i, i + 5) === ' add ' && i > 0) {
        // Found ' add ' outside quotes, and not at the beginning
        addPositions.push(i + 1) // +1 to skip the space before 'add'
      }
    }
    
    // Extract commands between positions
    for (let i = 0; i < addPositions.length; i++) {
      const start = addPositions[i]
      const end = i < addPositions.length - 1 ? addPositions[i + 1] - 1 : input.length
      const command = input.substring(start, end).trim()
      
      if (command && command.startsWith('add ')) {
        commands.push(command)
      }
    }
    
    return commands
  }

  const executeCommand = async (command: string) => {
    const trimmedCommand = command.trim()
    if (!trimmedCommand) return

    // Add to history
    setCommandHistory(prev => [...prev, trimmedCommand])
    setHistoryIndex(-1)
    
    // Show user command
    addMessage('user', `$ ${trimmedCommand}`)
    setIsProcessing(true)

    try {
      // Handle multiple commands separated by semicolons, newlines, or detect batch add commands
      if (trimmedCommand.includes(';')) {
        // Split by semicolon for general multiple commands
        const commands = trimmedCommand.split(';').map(cmd => cmd.trim()).filter(Boolean)
        for (const cmd of commands) {
          await processCommand(cmd)
        }
      } else if (trimmedCommand.includes('\n')) {
        // Handle newline-separated commands (multiline paste)
        const commands = trimmedCommand.split('\n').map(cmd => cmd.trim()).filter(Boolean)
        for (const cmd of commands) {
          await processCommand(cmd)
        }
      } else if (trimmedCommand.match(/^add\s+\S+.*?\s+add\s+/)) {
        // Handle batch add commands on single line - split carefully to preserve quoted strings
        const commands = splitAddCommands(trimmedCommand)
        for (const cmd of commands) {
          await processCommand(cmd)
        }
      } else {
        await processCommand(trimmedCommand)
      }
    } catch (error) {
      addMessage('error', `Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsProcessing(false)
    }
  }

  // Parse command arguments, handling quoted strings properly
  const parseCommandArgs = (command: string) => {
    const args: string[] = []
    let currentArg = ''
    let inQuotes = false
    let quoteChar = ''
    
    for (let i = 0; i < command.length; i++) {
      const char = command[i]
      
      if ((char === '"' || char === "'") && !inQuotes) {
        // Start of quoted string
        inQuotes = true
        quoteChar = char
      } else if (char === quoteChar && inQuotes) {
        // End of quoted string
        inQuotes = false
        quoteChar = ''
      } else if (char === ' ' && !inQuotes) {
        // Space outside quotes - end of argument
        if (currentArg.trim()) {
          args.push(currentArg.trim())
          currentArg = ''
        }
      } else {
        // Regular character or space inside quotes
        currentArg += char
      }
    }
    
    // Add the last argument if exists
    if (currentArg.trim()) {
      args.push(currentArg.trim())
    }
    
    return args
  }

  const processCommand = async (command: string) => {
    const parts = parseCommandArgs(command)
    const cmd = parts[0]?.toLowerCase() || ''

    switch (cmd) {
      case 'help':
        addMessage('system', `Available commands:
• help - Show this help message
• list - List all bills
• create <name> [reference] [currency] [visibility] - Create new bill
• add <billRef> <itemName> <amount> [quantity] - Add item to bill
• remove <billRef> <itemIndex> - Remove item by index (use show to see indices)
• edit <billRef> <field> <value> - Edit bill settings
• tax <billRef> <percentage> - Set tax rate
• service <billRef> <percentage> - Set service charge
• voucher <billRef> <amount> - Set discount/voucher
• show <billRef> - Show bill details
• clear - Clear terminal

Batch commands:
• Separate multiple commands with semicolons (;)
• Paste multiple commands with newlines (multiline)
• Multiple add commands can be chained together

Examples:
• create "Dinner Bill" DINNER2024 RM public
• add DB123456 "Pizza" 25.50 2
• remove DB123456 1 (removes first item)
• add DB123456 "Item 1" 10.00 1 add DB123456 "Item 2" 15.00 2
• Multiline paste: Copy/paste multiple commands at once
• tax DB123456 10
• service DB123456 5
• voucher DB123456 15.00
• edit DB123456 currency USD
• show DB123456`)
        break

      case 'clear':
        setMessages([])
        addMessage('system', `Bill Manager Terminal v1.0
Type 'help' for available commands.`)
        break

      case 'list':
        await listBills()
        break

      case 'create':
        await createBill(parts.slice(1))
        break

      case 'add':
        await addItem(parts.slice(1))
        break

      case 'remove':
        await removeItem(parts.slice(1))
        break

      case 'edit':
        await editBill(parts.slice(1))
        break

      case 'show':
        await showBill(parts.slice(1))
        break

      case 'tax':
        await setTax(parts.slice(1))
        break

      case 'service':
        await setServiceCharge(parts.slice(1))
        break

      case 'voucher':
      case 'discount':
        await setVoucher(parts.slice(1))
        break

      default:
        addMessage('error', `Unknown command: ${cmd}. Type 'help' for available commands.`)
    }
  }

  const listBills = async () => {
    try {
      const response = await fetch('/api/bills')
      if (response.ok) {
        const data = await response.json()
        if (data.bills.length === 0) {
          addMessage('system', 'No bills found.')
        } else {
          const billList = data.bills.map((bill: any) => 
            `• ${bill.name} (${bill.reference}) - ${bill.currency} - ${bill.visibility}`
          ).join('\n')
          addMessage('system', `Found ${data.bills.length} bills:\n${billList}`)
        }
      } else {
        addMessage('error', 'Failed to fetch bills. Please ensure you are signed in.')
      }
    } catch (error) {
      addMessage('error', 'Network error while fetching bills.')
    }
  }

  const createBill = async (args: string[]) => {
    if (args.length === 0) {
      addMessage('error', 'Usage: create <name> [reference] [currency] [visibility]\nExample: create "Dinner Bill" DINNER2024 RM public')
      return
    }

    const name = args[0]
    const reference = args[1] || null // Optional reference
    const currency = args[2]?.toUpperCase() || 'RM'
    const visibility = args[3]?.toUpperCase() || 'PRIVATE'

    // Validate currency
    if (!CURRENCIES.find(c => c.code === currency)) {
      const validCurrencies = CURRENCIES.map(c => c.code).join(', ')
      addMessage('error', `Invalid currency: ${currency}. Valid options: ${validCurrencies}`)
      return
    }

    // Validate visibility
    if (!BILL_VISIBILITY_OPTIONS.find(v => v.value === visibility)) {
      const validVisibility = BILL_VISIBILITY_OPTIONS.map(v => v.value).join(', ')
      addMessage('error', `Invalid visibility: ${visibility}. Valid options: ${validVisibility}`)
      return
    }

    try {
      const response = await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, reference, currency, visibility })
      })

      if (response.ok) {
        const data = await response.json()
        addMessage('success', `✓ Bill created successfully!
Name: ${data.bill.name}
Reference: ${data.bill.reference}
Currency: ${data.bill.currency}
Visibility: ${data.bill.visibility}`)
        onBillCreated?.()
      } else {
        const error = await response.json()
        addMessage('error', error.error || 'Failed to create bill')
      }
    } catch (error) {
      addMessage('error', 'Network error while creating bill.')
    }
  }

  const addItem = async (args: string[]) => {
    if (args.length < 3) {
      addMessage('error', 'Usage: add <billRef> <itemName> <amount> [quantity]\nExample: add DB123456 "Pizza" 25.50 2')
      return
    }

    const billRef = args[0]
    const itemName = args[1]
    const amount = parseFloat(args[2])
    const quantity = args[3] ? parseInt(args[3]) : 1

    if (isNaN(amount) || amount <= 0) {
      addMessage('error', 'Amount must be a valid positive number')
      return
    }

    if (isNaN(quantity) || quantity <= 0) {
      addMessage('error', 'Quantity must be a valid positive integer')
      return
    }

    try {
      // First find the bill by reference
      const billsResponse = await fetch('/api/bills')
      if (!billsResponse.ok) {
        addMessage('error', 'Failed to fetch bills. Please ensure you are signed in.')
        return
      }

      const billsData = await billsResponse.json()
      const bill = billsData.bills.find((b: any) => b.reference === billRef)

      if (!bill) {
        addMessage('error', `Bill with reference ${billRef} not found.`)
        return
      }

      const response = await fetch(`/api/bills/${bill.id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: itemName,
          amount,
          quantity
        })
      })

      if (response.ok) {
        const data = await response.json()
        const total = amount * quantity
        addMessage('success', `✓ Item added successfully!
Item: ${itemName}
Amount: ${amount} × ${quantity} = ${total}
Added to: ${bill.name} (${billRef})`)
        onBillUpdated?.()
      } else {
        const error = await response.json()
        addMessage('error', error.error || 'Failed to add item')
      }
    } catch (error) {
      addMessage('error', 'Network error while adding item.')
    }
  }

  const removeItem = async (args: string[]) => {
    if (args.length < 2) {
      addMessage('error', 'Usage: remove <billRef> <itemIndex>\nExample: remove DB123456 1 (removes first item)\nTip: Use "show <billRef>" to see item indices')
      return
    }

    const billRef = args[0]
    const itemIndex = parseInt(args[1])

    if (isNaN(itemIndex) || itemIndex < 1) {
      addMessage('error', 'Item index must be a positive number starting from 1')
      return
    }

    try {
      // First find the bill by reference
      const billsResponse = await fetch('/api/bills')
      if (!billsResponse.ok) {
        addMessage('error', 'Failed to fetch bills. Please ensure you are signed in.')
        return
      }

      const billsData = await billsResponse.json()
      const bill = billsData.bills.find((b: any) => b.reference === billRef)

      if (!bill) {
        addMessage('error', `Bill with reference ${billRef} not found.\nTip: Use "list" to see all available bills.`)
        return
      }

      // Fetch full bill details to get items
      const billResponse = await fetch(`/api/bills/${bill.id}`)
      if (!billResponse.ok) {
        addMessage('error', 'Failed to fetch bill details.')
        return
      }

      const billData = await billResponse.json()
      const items = billData.bill.items

      if (items.length === 0) {
        addMessage('error', 'This bill has no items to remove.')
        return
      }

      if (itemIndex > items.length) {
        addMessage('error', `Invalid item index: ${itemIndex}. This bill has ${items.length} item(s).`)
        return
      }

      const itemToDelete = items[itemIndex - 1] // Convert to 0-based index
      
      // Delete the item
      const response = await fetch(`/api/bills/${bill.id}/items/${itemToDelete.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        addMessage('success', `✓ Item removed successfully!
Item: ${itemToDelete.name} (${itemToDelete.amount} × ${itemToDelete.quantity})
Removed from: ${bill.name} (${billRef})`)
        onBillUpdated?.()
      } else {
        const error = await response.json()
        addMessage('error', error.error || 'Failed to remove item')
      }
    } catch (error) {
      addMessage('error', 'Network error while removing item.')
    }
  }

  const editBill = async (args: string[]) => {
    if (args.length < 3) {
      addMessage('error', 'Usage: edit <billRef> <field> <value>\nFields: currency, visibility, serviceCharge, taxRate, discount\nTip: Use dedicated commands: tax, service, voucher\nExample: edit DB123456 currency USD')
      return
    }

    const billRef = args[0]
    const field = args[1]
    let value: any = args[2]

    // Validate field
    const validFields = ['currency', 'visibility', 'servicecharge', 'taxrate', 'discount']
    if (!validFields.includes(field.toLowerCase())) {
      addMessage('error', `Invalid field: ${field}. Valid fields: currency, visibility, serviceCharge, taxRate, discount`)
      return
    }

    // Convert field names
    const fieldMap: { [key: string]: string } = {
      'servicecharge': 'serviceCharge',
      'taxrate': 'taxRate'
    }
    const actualField = fieldMap[field.toLowerCase()] || field

    // Validate and convert values
    if (['serviceCharge', 'taxRate', 'discount'].includes(actualField)) {
      value = parseFloat(value)
      if (isNaN(value) || value < 0) {
        addMessage('error', `${actualField} must be a valid positive number`)
        return
      }
    } else if (actualField === 'currency') {
      value = value.toUpperCase()
      if (!CURRENCIES.find(c => c.code === value)) {
        const validCurrencies = CURRENCIES.map(c => c.code).join(', ')
        addMessage('error', `Invalid currency: ${value}. Valid options: ${validCurrencies}`)
        return
      }
    } else if (actualField === 'visibility') {
      value = value.toUpperCase()
      if (!BILL_VISIBILITY_OPTIONS.find(v => v.value === value)) {
        const validVisibility = BILL_VISIBILITY_OPTIONS.map(v => v.value).join(', ')
        addMessage('error', `Invalid visibility: ${value}. Valid options: ${validVisibility}`)
        return
      }
    }

    try {
      // Find the bill by reference
      const billsResponse = await fetch('/api/bills')
      if (!billsResponse.ok) {
        addMessage('error', 'Failed to fetch bills. Please ensure you are signed in.')
        return
      }

      const billsData = await billsResponse.json()
      const bill = billsData.bills.find((b: any) => b.reference === billRef)

      if (!bill) {
        addMessage('error', `Bill with reference ${billRef} not found.`)
        return
      }

      const response = await fetch(`/api/bills/${bill.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [actualField]: value })
      })

      if (response.ok) {
        addMessage('success', `✓ Bill updated successfully!
${actualField}: ${value}
Bill: ${bill.name} (${billRef})`)
        onBillUpdated?.()
      } else {
        const error = await response.json()
        addMessage('error', error.error || 'Failed to update bill')
      }
    } catch (error) {
      addMessage('error', 'Network error while updating bill.')
    }
  }

  const showBill = async (args: string[]) => {
    if (args.length === 0) {
      addMessage('error', 'Usage: show <billRef>\nExample: show DB123456')
      return
    }

    const billRef = args[0]

    try {
      const billsResponse = await fetch('/api/bills')
      if (!billsResponse.ok) {
        addMessage('error', 'Failed to fetch bills. Please ensure you are signed in.')
        return
      }

      const billsData = await billsResponse.json()
      const bill = billsData.bills.find((b: any) => b.reference === billRef)

      if (!bill) {
        addMessage('error', `Bill with reference ${billRef} not found.`)
        return
      }

      const subtotal = bill.items.reduce((sum: number, item: any) => sum + item.total, 0)
      const serviceCharge = subtotal * bill.serviceCharge / 100
      const tax = (subtotal + serviceCharge) * bill.taxRate / 100
      const total = Math.max(0, subtotal + serviceCharge + tax - bill.discount)

      const itemsList = bill.items.length > 0 
        ? bill.items.map((item: any, index: number) => 
            `  ${index + 1}. ${item.name}: ${item.amount} × ${item.quantity} = ${item.total}${item.assignedTo ? ` (${item.assignedTo})` : ''}`
          ).join('\n')
        : '  No items yet'

      addMessage('system', `Bill Details: ${bill.name}
Reference: ${bill.reference}
Currency: ${bill.currency}
Visibility: ${bill.visibility}
Created: ${new Date(bill.createdAt).toLocaleDateString()}

Items (${bill.items.length}):
${itemsList}

Summary:
  Subtotal: ${subtotal.toFixed(2)}
  Service Charge (${bill.serviceCharge}%): ${serviceCharge.toFixed(2)}
  Tax (${bill.taxRate}%): ${tax.toFixed(2)}
  Discount: -${bill.discount.toFixed(2)}
  Total: ${total.toFixed(2)}`)
    } catch (error) {
      addMessage('error', 'Network error while fetching bill details.')
    }
  }

  const setTax = async (args: string[]) => {
    if (args.length < 2) {
      addMessage('error', 'Usage: tax <billRef> <percentage>\nExample: tax DB123456 10')
      return
    }

    const billRef = args[0]
    const taxRate = parseFloat(args[1])

    if (isNaN(taxRate) || taxRate < 0) {
      addMessage('error', 'Tax rate must be a valid positive number (percentage)')
      return
    }

    try {
      const billsResponse = await fetch('/api/bills')
      if (!billsResponse.ok) {
        addMessage('error', 'Failed to fetch bills. Please ensure you are signed in.')
        return
      }

      const billsData = await billsResponse.json()
      const bill = billsData.bills.find((b: any) => b.reference === billRef)

      if (!bill) {
        addMessage('error', `Bill with reference ${billRef} not found.`)
        return
      }

      const response = await fetch(`/api/bills/${bill.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taxRate })
      })

      if (response.ok) {
        addMessage('success', `✓ Tax rate updated successfully!
Tax Rate: ${taxRate}%
Bill: ${bill.name} (${billRef})`)
        onBillUpdated?.()
      } else {
        const error = await response.json()
        addMessage('error', error.error || 'Failed to update tax rate')
      }
    } catch (error) {
      addMessage('error', 'Network error while updating tax rate.')
    }
  }

  const setServiceCharge = async (args: string[]) => {
    if (args.length < 2) {
      addMessage('error', 'Usage: service <billRef> <percentage>\nExample: service DB123456 5')
      return
    }

    const billRef = args[0]
    const serviceCharge = parseFloat(args[1])

    if (isNaN(serviceCharge) || serviceCharge < 0) {
      addMessage('error', 'Service charge must be a valid positive number (percentage)')
      return
    }

    try {
      const billsResponse = await fetch('/api/bills')
      if (!billsResponse.ok) {
        addMessage('error', 'Failed to fetch bills. Please ensure you are signed in.')
        return
      }

      const billsData = await billsResponse.json()
      const bill = billsData.bills.find((b: any) => b.reference === billRef)

      if (!bill) {
        addMessage('error', `Bill with reference ${billRef} not found.`)
        return
      }

      const response = await fetch(`/api/bills/${bill.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceCharge })
      })

      if (response.ok) {
        addMessage('success', `✓ Service charge updated successfully!
Service Charge: ${serviceCharge}%
Bill: ${bill.name} (${billRef})`)
        onBillUpdated?.()
      } else {
        const error = await response.json()
        addMessage('error', error.error || 'Failed to update service charge')
      }
    } catch (error) {
      addMessage('error', 'Network error while updating service charge.')
    }
  }

  const setVoucher = async (args: string[]) => {
    if (args.length < 2) {
      addMessage('error', 'Usage: voucher <billRef> <amount>\nExample: voucher DB123456 15.00')
      return
    }

    const billRef = args[0]
    const discount = parseFloat(args[1])

    if (isNaN(discount) || discount < 0) {
      addMessage('error', 'Voucher/discount amount must be a valid positive number')
      return
    }

    try {
      const billsResponse = await fetch('/api/bills')
      if (!billsResponse.ok) {
        addMessage('error', 'Failed to fetch bills. Please ensure you are signed in.')
        return
      }

      const billsData = await billsResponse.json()
      const bill = billsData.bills.find((b: any) => b.reference === billRef)

      if (!bill) {
        addMessage('error', `Bill with reference ${billRef} not found.`)
        return
      }

      const response = await fetch(`/api/bills/${bill.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discount })
      })

      if (response.ok) {
        const currencySymbol = CURRENCIES.find(c => c.code === bill.currency)?.symbol || bill.currency
        addMessage('success', `✓ Voucher/discount updated successfully!
Discount: ${currencySymbol}${discount.toFixed(2)}
Bill: ${bill.name} (${billRef})`)
        onBillUpdated?.()
      } else {
        const error = await response.json()
        addMessage('error', error.error || 'Failed to update voucher/discount')
      }
    } catch (error) {
      addMessage('error', 'Network error while updating voucher/discount.')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isProcessing) {
      executeCommand(input)
      setInput('')
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (commandHistory.length > 0) {
        const newIndex = historyIndex + 1 >= commandHistory.length ? commandHistory.length - 1 : historyIndex + 1
        setHistoryIndex(newIndex)
        setInput(commandHistory[commandHistory.length - 1 - newIndex])
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1
        setHistoryIndex(newIndex)
        setInput(commandHistory[commandHistory.length - 1 - newIndex])
      } else if (historyIndex === 0) {
        setHistoryIndex(-1)
        setInput('')
      }
    }
  }

  const getMessageStyle = (type: TerminalMessage['type']) => {
    switch (type) {
      case 'user':
        return 'text-blue-400'
      case 'success':
        return 'text-green-400'
      case 'error':
        return 'text-red-400'
      case 'system':
      default:
        return 'text-gray-300'
    }
  }

  return (
    <>
      {/* Floating Icon */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all duration-300 hover:scale-110"
          title="Open Terminal"
        >
          {isOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3" />
            </svg>
          )}
        </button>
      </div>

      {/* Terminal Chatbox */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-96 bg-gray-900 rounded-lg shadow-2xl border border-gray-700 flex flex-col z-40">
          {/* Header */}
          <div className="bg-gray-800 px-4 py-3 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-gray-300 text-sm font-mono ml-2">Bill Terminal</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto font-mono text-sm">
            {messages.map((message) => (
              <div key={message.id} className={`mb-2 ${getMessageStyle(message.type)}`}>
                <pre className="whitespace-pre-wrap font-mono">{message.content}</pre>
              </div>
            ))}
            {isProcessing && (
              <div className="text-yellow-400 mb-2">
                <span className="inline-block animate-pulse">Processing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-700">
            <div className="flex items-center space-x-2">
              <span className="text-green-400 font-mono">$</span>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a command..."
                disabled={isProcessing}
                className="flex-1 bg-transparent text-gray-300 font-mono outline-none placeholder-gray-500 disabled:opacity-50"
              />
              {isProcessing && (
                <div className="text-yellow-400">
                  <div className="animate-spin w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full"></div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}