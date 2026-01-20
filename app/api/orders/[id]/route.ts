import { NextResponse } from 'next/server';
import { readOrders, writeOrders } from '@/lib/server/db';
import { Order } from '@/types';

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function PUT(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const updates: Partial<Order> = await request.json();
    const orders = await readOrders();
    
    const index = orders.findIndex((o) => o.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    
    orders[index] = { ...orders[index], ...updates };
    await writeOrders(orders);
    
    return NextResponse.json(orders[index]);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const orders = await readOrders();
    
    const filteredOrders = orders.filter((o) => o.id !== id);
    if (filteredOrders.length === orders.length) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }
    
    await writeOrders(filteredOrders);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
  }
}
