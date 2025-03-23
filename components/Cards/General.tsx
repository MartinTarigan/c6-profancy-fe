'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function DashboardBarista() {
  const orders = [
    { id: 1, customer: "Andi", status: "Completed", drink: "Cappuccino" },
    { id: 2, customer: "Budi", status: "Pending", drink: "Espresso" }
  ];

  return (
    <div className="grid grid-cols-1 gap-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Recent Orders</CardTitle>
          <CardDescription>List of ongoing and completed orders.</CardDescription>
        </CardHeader>
        <CardContent>
          {orders.map((order) => (
            <div key={order.id} className="border-b py-2">
              <p className="font-semibold">{order.customer}</p>
              <p>{order.drink} - <span className={order.status === 'Completed' ? 'text-green-500' : 'text-orange-500'}>{order.status}</span></p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
