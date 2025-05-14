'use client';

import { CreateEmployeeInput, CreateEmployeeSchema } from "@/schema/employeeschema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EmployeeForm({ username }: { username: string }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateEmployeeInput>({
    resolver: zodResolver(CreateEmployeeSchema),
    defaultValues: {
      username,
      currentBalance: 0

    },
  });

  const onSubmit = async (data: CreateEmployeeInput) => {
    try {
      const res = await axios.post("/api/employee", {
        action: "create",
        employeeData: data,
      });
      console.log(data);
      reset(res.data.employee);
      alert("Employee added successfully!");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Card className="p-4 w-full shadow-xl">
      <CardHeader>
        <CardTitle>Create Employee</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* <div>
            <Label>Username</Label>
            <Input {...register("username")} readOnly />
            {errors.username && <p className="text-red-500 text-sm">{errors.username.message}</p>}
          </div> */}
          <div>
            
            <Label>Name</Label>
            <Input {...register("name")} placeholder="John Doe" />
            {errors.name && <p className="text-red-500 text-sm">{errors.name.message}</p>}
          </div>

          <div>
            <Label>Phone</Label>
            <Input {...register("phone")} placeholder="1234567890" />
            {errors.phone && <p className="text-red-500 text-sm">{errors.phone.message}</p>}
          </div>

          <div>
            <Label>Photo Path</Label>
            <Input {...register("photoPath")} placeholder="/images/john.jpg" />
          </div>

          <div>
            <Label>Joining Date</Label>
            <Input type="date" {...register("joiningDate")} />
            {errors.joiningDate && <p className="text-red-500 text-sm">{errors.joiningDate.message}</p>}
          </div>

          <div>
            <Label>Base Salary</Label>
            <Input type="number" {...register("baseSalary", { valueAsNumber: true })} placeholder="50000" />
            {errors.baseSalary && <p className="text-red-500 text-sm">{errors.baseSalary.message}</p>}
          </div>

          {/* <div>
            <Label>Current Balance</Label>
            <Input type="number" {...register("currentBalance", { valueAsNumber: true })} placeholder="0" />
            {errors.currentBalance && <p className="text-red-500 text-sm">{errors.currentBalance.message}</p>}
          </div> */}

         

          <Button type="submit" className="w-full">
            Create Employee
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
