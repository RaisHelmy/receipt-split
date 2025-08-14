import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: Request, context: { params: Promise<{ id: string; itemId: string }> }) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { id: billId, itemId } = await context.params
    const updates = await request.json()

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

    const item = await prisma.billItem.findFirst({
      where: {
        id: itemId,
        billId,
      }
    })

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      )
    }

    const allowedFields = ['assignedTo', 'paid', 'verified']
    const updateData: any = {}

    for (const field of allowedFields) {
      if (field in updates) {
        updateData[field] = updates[field]
      }
    }

    if ('assignedTo' in updates) {
      await prisma.itemAssignment.deleteMany({
        where: { itemId }
      })

      if (updates.assignedTo) {
        const names = updates.assignedTo.split(',').map((name: string) => name.trim()).filter((name: string) => name.length > 0)
        const limitedNames = names.slice(0, item.quantity)

        for (const name of limitedNames) {
          await prisma.itemAssignment.create({
            data: {
              name,
              amount: item.amount,
              itemId,
            }
          })
        }

        updateData.assignedTo = limitedNames.join(', ')
      }
    }

    const updatedItem = await prisma.billItem.update({
      where: { id: itemId },
      data: updateData,
      include: {
        assignments: true,
      }
    })

    return NextResponse.json({ item: updatedItem })

  } catch (error) {
    console.error('Update item error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string; itemId: string }> }) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { id: billId, itemId } = await context.params

    // Verify user owns the bill
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

    // Verify item exists and belongs to the bill
    const item = await prisma.billItem.findFirst({
      where: {
        id: itemId,
        billId,
      }
    })

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      )
    }

    // Delete related assignments first
    await prisma.itemAssignment.deleteMany({
      where: { itemId }
    })

    // Delete the item
    await prisma.billItem.delete({
      where: { id: itemId }
    })

    return NextResponse.json({ message: 'Item deleted successfully' })

  } catch (error) {
    console.error('Delete item error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}