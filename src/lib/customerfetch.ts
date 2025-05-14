// lib/customerService.ts
import { prisma } from '@/config/db';

export async function getCustomers() {
  return await prisma.customer.findMany();
}

export async function getCustomerById(id: number) {
  return await prisma.customer.findUnique({
    where: { id: id },
  });
}

export async function getemployee(username : string ,name :string) {
  return await prisma.employee.findMany({
    where: { username: username,
             name :name ,
    }}
   );
}
