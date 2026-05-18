import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import "dotenv/config"

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('Start seeding...')

  // Create Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@test.com' },
    update: {},
    create: {
      email: 'admin@test.com',
      name: 'System Admin',
      password: 'pass123',
      role: 'ADMIN',
    },
  })

  // Create Manager
  const manager = await prisma.user.upsert({
    where: { email: 'manager@test.com' },
    update: {},
    create: {
      email: 'manager@test.com',
      name: 'Jane Manager',
      password: 'pass123',
      role: 'MANAGER',
      employeeProfile: {
        create: {
          department: 'Engineering'
        }
      }
    },
  })

  // Fetch the created manager's profile ID to link the employee
  const managerProfile = await prisma.employeeProfile.findUnique({
    where: { userId: manager.id }
  })

  // Create Employee
  const employee = await prisma.user.upsert({
    where: { email: 'employee@test.com' },
    update: {},
    create: {
      email: 'employee@test.com',
      name: 'John Employee',
      password: 'pass123',
      role: 'EMPLOYEE',
      employeeProfile: {
        create: {
          department: 'Engineering',
          managerId: managerProfile?.id
        }
      }
    },
  })

  const employee2 = await prisma.user.upsert({
    where: { email: 'employee2@test.com' },
    update: {},
    create: {
      email: 'employee2@test.com',
      name: 'Alice Smith',
      password: 'pass123',
      role: 'EMPLOYEE',
      employeeProfile: {
        create: {
          department: 'Engineering',
          managerId: managerProfile?.id
        }
      }
    },
  })

  const employee3 = await prisma.user.upsert({
    where: { email: 'employee3@test.com' },
    update: {},
    create: {
      email: 'employee3@test.com',
      name: 'Bob Johnson',
      password: 'pass123',
      role: 'EMPLOYEE',
      employeeProfile: {
        create: {
          department: 'Engineering',
          managerId: managerProfile?.id
        }
      }
    },
  })

  console.log({ admin, manager, employee, employee2, employee3 })
  console.log('Seeding finished.')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
