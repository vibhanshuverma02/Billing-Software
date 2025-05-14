"use client";

import {
  Bell,
  Home,
  LineChart,
  Package,
  Package2,
  ShoppingCart,
  Users,
  Menu,
  
  X,
} from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { Button } from "./button";

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
      <div className="flex  overflow-hidden">
      {/* Toggle Button (always visible) */}
      <div className="absolute top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar (slides in/out) */}
      <aside
        className={`absolute left-0 top-0 z-40 w-64 min-h-screen transfor transform bg-muted/40 border-r shadow-md transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col gap-2">
          <div className="flex h-14 items-center justify-between border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
              <Package2 className="h-6 w-6" />
              <span>Kukreja Saree Center Roorkee</span>
            </Link>
            {/* <Button
              variant="outline"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close sidebar</span>
            </Button> */}
          </div>

          <div className="flex-1 overflow-y-auto">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
  <Link
    href="/dashboard"
    onClick={() => setIsOpen(false)}
    className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
  >
    <Home className="h-4 w-4" />
    HOME
  </Link>
  <Link
    href="/test"
    onClick={() => setIsOpen(false)}
    className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
  >
    <ShoppingCart className="h-4 w-4" />
    Generate Invoice
  </Link>
  <Link
    href="/product"
    onClick={() => setIsOpen(false)}
    className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
  >
    <Package className="h-4 w-4" />
    Products
  </Link>
  <Link
    href="/customermange"
    onClick={() => setIsOpen(false)}
    className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
  >
    <Users className="h-4 w-4" />
    Customer Management
  </Link>
  <Link
    href="/employee"
    onClick={() => setIsOpen(false)}
    className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
  >
    <Users className="h-4 w-4" />
    Employee Management
  </Link>
  <Link
    href="/PurchaseMangement"
    onClick={() => setIsOpen(false)}
    className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
  >
    <Users className="h-4 w-4" />
    Purchase Management
  </Link>
</nav>

          </div>
        </div>
      </aside>

      {/* Optional: Page content overlay when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

