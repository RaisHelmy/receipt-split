import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/middleware'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

function generateBillRef(userName: string, billName: string): string {
  const timestamp = Date.now().toString().slice(-6)
  const userInitial = userName.charAt(0).toUpperCase()
  const billInitial = billName.split(' ').map(word => word.charAt(0).toUpperCase()).join('')
  return `${userInitial}${billInitial}${timestamp}`
}

function generateShareToken(): string {
  return randomBytes(32).toString('hex')
}

export async function GET() {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const bills = await prisma.bill.findMany({
      where: { userId: currentUser.userId },
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
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ bills })

  } catch (error) {
    console.error('Get bills error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const currentUser = await getCurrentUser()

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    const { name, reference: customReference, currency, visibility } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: 'Bill name is required' },
        { status: 400 }
      )
    }

    // If custom reference is provided, validate it
    if (customReference) {
      // Check if reference already exists
      const existingBill = await prisma.bill.findFirst({
        where: { reference: customReference }
      })
      
      if (existingBill) {
        return NextResponse.json(
          { error: `Reference "${customReference}" already exists. Please choose a different reference.` },
          { status: 400 }
        )
      }
      
      // Validate reference format (alphanumeric and some special chars, no spaces)
      if (!/^[a-zA-Z0-9_-]+$/.test(customReference)) {
        return NextResponse.json(
          { error: 'Reference must contain only letters, numbers, underscores, and hyphens (no spaces)' },
          { status: 400 }
        )
      }
    }

    const user = await prisma.user.findUnique({
      where: { id: currentUser.userId }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Use custom reference if provided, otherwise generate one
    const reference = customReference || generateBillRef(user.name, name)
    const shareToken = (visibility === 'READ_ONLY' || visibility === 'PUBLIC') ? generateShareToken() : null

    const bill = await prisma.bill.create({
      data: {
        name,
        reference,
        visibility: visibility || 'PRIVATE',
        shareToken,
        currency: currency || 'RM',
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
          }
        }
      }
    })

    return NextResponse.json({ bill }, { status: 201 })

  } catch (error) {
    console.error('Create bill error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}