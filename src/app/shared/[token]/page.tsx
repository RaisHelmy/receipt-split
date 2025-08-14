import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import SharedBillView from '@/components/SharedBillView'
import EditableSharedBillView from '@/components/EditableSharedBillView'

interface SharedBillPageProps {
  params: Promise<{ token: string }>
}

export default async function SharedBillPage({ params }: SharedBillPageProps) {
  const { token } = await params
  
  const bill = await prisma.bill.findUnique({
    where: {
      shareToken: token,
      visibility: {
        in: ['READ_ONLY', 'PUBLIC']
      }
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

  if (!bill) {
    notFound()
  }

  // Render editable version for PUBLIC bills, read-only for READ_ONLY bills
  if (bill.visibility === 'PUBLIC') {
    return <EditableSharedBillView bill={bill} />
  }

  return <SharedBillView bill={bill} />
}