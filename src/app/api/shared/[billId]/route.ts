import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: Request, context: { params: Promise<{ billId: string }> }) {
  try {
    const { billId } = await context.params
    const updates = await request.json()

    const bill = await prisma.bill.findFirst({
      where: {
        id: billId,
        visibility: 'PUBLIC',
      }
    })

    if (!bill) {
      return NextResponse.json(
        { error: 'Bill not found or not publicly editable' },
        { status: 404 }
      )
    }

    const allowedFields = ['serviceCharge', 'taxRate', 'discount']
    const updateData: any = {}

    for (const field of allowedFields) {
      if (field in updates) {
        updateData[field] = updates[field]
      }
    }

    const updatedBill = await prisma.bill.update({
      where: { id: billId },
      data: updateData,
      include: {
        user: {
          select: {
            name: true,
          }
        },
        items: {
          include: {
            assignments: true,
          }
        }
      }
    })

    return NextResponse.json({ bill: updatedBill })

  } catch (error) {
    console.error('Update bill error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}