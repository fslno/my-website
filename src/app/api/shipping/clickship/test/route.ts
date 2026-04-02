import { NextResponse } from 'next/server';
import { ClickShipClient } from '@/lib/shipping/clickship';

export async function POST(request: Request) {
  try {
    const config = await request.json();
    
    if (!config.host || !config.username) {
      return NextResponse.json({ success: false, error: 'SFTP Host and Username are required.' }, { status: 400 });
    }

    const client = new ClickShipClient(config);
    const success = await client.testConnection();

    if (success) {
      return NextResponse.json({ success: true, message: 'SFTP Handshake Successful.' });
    } else {
      return NextResponse.json({ success: false, error: 'Failed to establish SFTP connection. Verify credentials and Host Key.' }, { status: 401 });
    }

  } catch (error: any) {
    console.error('[CLICKSHIP_TEST_ERROR]', error);
    return NextResponse.json({ 
      success: false, 
      error: error?.message || 'Handshake failed due to an unknown protocol error.' 
    }, { status: 500 });
  }
}
