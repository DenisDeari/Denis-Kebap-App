import { NextResponse } from 'next/server';
import { readOrders, writeOrders } from '@/lib/server/db';
import { Order } from '@/types';

export async function GET() {
  try {
    const orders = await readOrders();
    return NextResponse.json(orders);
  } catch (error) {
    console.error('[API] GET /api/orders failed:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const newOrder: Order = await request.json();
    console.log('[API] POST /api/orders received:', newOrder);
    
    const orders = await readOrders();
    
    // Simple validation could go here
    
    orders.push(newOrder);
    await writeOrders(orders);
    console.log(`[API] Order ${newOrder.id} saved. Total orders: ${orders.length}`);
    
    return NextResponse.json(newOrder, { status: 201 });
  } catch (error) {
    console.error('[API] POST /api/orders failed:', error);
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await writeOrders([]);
    console.log('[API] 🗑️ All orders cleared');
    return NextResponse.json({ success: true, message: 'All orders deleted' });
  } catch (error) {
    console.error('[API] DELETE /api/orders failed:', error);
    return NextResponse.json({ error: 'Failed to clear orders' }, { status: 500 });
  }
}
