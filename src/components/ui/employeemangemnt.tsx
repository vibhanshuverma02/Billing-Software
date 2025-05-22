// components/ui/EmployeePageClient.tsx
'use client';

import React from 'react';
import { MotionDiv } from './MotionDiv';
import EmployeeSearchPage from './employeedetail';
import EmployeeFormWrapper from './InteractiveEmployeePanel ';

interface EmployeePageClientProps {
  username: string;
}

export default function EmployeePageClient({ username }: EmployeePageClientProps) {
  return (
    <MotionDiv
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-4"
    >
      <h1 className="text-2xl font-bold text-center mt-10 mb-6">Search Employee</h1>

      <div className="w-full flex flex-col items-center">
        {/* EmployeeSearchPage full width */}
        <div className="w-full">
          <EmployeeSearchPage />
        </div>

        <h3 className="my-4 text-center">Or</h3>

        <div className="w-full md:max-w-lg mx-auto flex justify-center">
          <EmployeeFormWrapper username={username} />
        </div>
      </div>
    </MotionDiv>
  );
}
