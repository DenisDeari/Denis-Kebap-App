"use client";

import { useState, useEffect, useMemo } from "react";
import { getCustomers, getEmployees, type Customer, type Employee } from "@/lib/storage";

export default function AdminDashboard() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    setCustomers(getCustomers());
    setEmployees(getEmployees());
  }, []);

  // Memoize filter operations
  const activeCustomers = useMemo(
    () => customers.filter((c) => c.status === true).length,
    [customers]
  );
  const inactiveCustomers = useMemo(
    () => customers.filter((c) => c.status === false).length,
    [customers]
  );
  const activeEmployees = useMemo(
    () => employees.filter((e) => e.status === true).length,
    [employees]
  );
  const inactiveEmployees = useMemo(
    () => employees.filter((e) => e.status === false).length,
    [employees]
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active Customers Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Active Customers</h3>
              <p className="text-4xl font-bold text-gray-900">{activeCustomers}</p>
              <p className="text-sm text-gray-500 mt-1">Total Active Customers</p>
            </div>
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-3xl">👥</span>
            </div>
          </div>
        </div>

        {/* InActive Customers Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">InActive Customers</h3>
              <p className="text-4xl font-bold text-gray-900">{inactiveCustomers}</p>
              <p className="text-sm text-gray-500 mt-1">Total InActive Customers</p>
            </div>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <span className="text-3xl">🚫</span>
            </div>
          </div>
        </div>

        {/* Active Employees Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">Active Employees</h3>
              <p className="text-4xl font-bold text-gray-900">{activeEmployees}</p>
              <p className="text-sm text-gray-500 mt-1">Total Active Employees</p>
            </div>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-3xl">👤</span>
            </div>
          </div>
        </div>

        {/* InActive Employees Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-2">InActive Employees</h3>
              <p className="text-4xl font-bold text-gray-900">{inactiveEmployees}</p>
              <p className="text-sm text-gray-500 mt-1">Total InActive Employees</p>
            </div>
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
              <span className="text-3xl">🚫</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

