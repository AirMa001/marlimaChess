import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
  const c = await prisma.player.count({ where: { status: 'APPROVED' } })
  const t = await prisma.tournament.findUnique({ where: { id: 1 } })
  console.log('COUNT:', c)
  console.log('TOURNAMENT:', t)
}
main().finally(() => prisma.$disconnect())
