// lib/customerService.ts
import { prisma } from '@/config/db';

export async function getCustomers() {
  return await prisma.customer.findMany();
}

export async function getCustomerById(id: string) {
  return await prisma.customer.findUnique({
    where: { id: Number(id) },
  });
}

export async function getemployee(username : string ,name :string) {
  return await prisma.employee.findMany({
    where: { username: username,
             name :name ,
    }}
   );
}
