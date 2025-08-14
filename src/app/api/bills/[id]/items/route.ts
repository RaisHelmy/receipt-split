import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { id: billId } = await context.params
    const { name, itemId, amount, quantity } = await request.json()

    if (!name || !amount || !quantity) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const bill = await prisma.bill.findFirst({
      where: {
        id: billId,
        userId: currentUser.userId,
      }
    })

    if (!bill) {
      return NextResponse.json(
        { error: 'Bill not found' },
        { status: 404 }
      )
    }

    const total = amount * quantity

    const item = await prisma.billItem.create({
      data: {
        name,
        itemId,
        amount,
        quantity,
        total,
        billId,
      },
      include: {
        assignments: true,
      }
    })

    return NextResponse.json({ item }, { status: 201 })

  } catch (error) {
    console.error('Create item error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}