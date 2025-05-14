import { prisma } from '@/config/db';
import { Customer, Employee } from '@prisma/client';

export async function getCustomers(): Promise<Customer[]> {
  return await prisma.customer.findMany();
}

export async function getCustomerById(id: number): Promise<Customer | null> {
  return await prisma.customer.findUnique({
    where: { id },
  });
}

export async function getEmployee(username: string, name: string): Promise<Employee[]> {
  return await prisma.employee.findMany({
    where: { username, name },
  });
}
