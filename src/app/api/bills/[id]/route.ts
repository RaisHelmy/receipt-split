import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { id } = await context.params

    const bill = await prisma.bill.findFirst({
      where: {
        id,
        userId: currentUser.userId,
      },
      include: {
        user: {
          select: {
            name: true,
          }
        },
        items: {
          include: {
            assignments: true,
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    })

    if (!bill) {
      return NextResponse.json(
        { error: 'Bill not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ bill })

  } catch (error) {
    console.error('Get bill error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { id } = await context.params
    const updates = await request.json()

    const existingBill = await prisma.bill.findFirst({
      where: {
        id,
        userId: currentUser.userId,
      }
    })

    if (!existingBill) {
      return NextResponse.json(
        { error: 'Bill not found' },
        { status: 404 }
      )
    }

    const allowedFields = ['serviceCharge', 'taxRate', 'discount', 'currency', 'visibility']
    const updateData: any = {}

    for (const field of allowedFields) {
      if (field in updates) {
        updateData[field] = updates[field]
      }
    }

    // Generate or remove share token based on visibility change
    if ('visibility' in updates) {
      if (updates.visibility === 'READ_ONLY' || updates.visibility === 'PUBLIC') {
        if (!existingBill.shareToken) {
          updateData.shareToken = require('crypto').randomBytes(32).toString('hex')
        }
      } else if (updates.visibility === 'PRIVATE') {
        updateData.shareToken = null
      }
    }

    const bill = await prisma.bill.update({
      where: { id },
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

    return NextResponse.json({ bill })

  } catch (error) {
    console.error('Update bill error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}