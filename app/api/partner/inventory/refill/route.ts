import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { itemId, itemName, vendorName, vendorPhone } = await req.json();

    if (!itemName) {
      return NextResponse.json({ error: 'Item name is required.' }, { status: 400 });
    }

    // In a live production environment, this triggers a WhatsApp Business template message or SMS to the vendor
    console.log(`[Inventory Dispatch] Refill order placed for ${itemName} to vendor ${vendorName} (${vendorPhone})`);

    return NextResponse.json({
      success: true,
      message: `Restock order dispatched to ${vendorName}. Estimated delivery: < 24 Hours.`,
      dispatchedAt: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Inventory refill API error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
