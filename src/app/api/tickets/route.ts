import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = 'https://pypomilurmkzlceecukr.supabase.co';
const SUPABASE_KEY = 'sb_publishable_R30YtCj6dqhLwjTQsrR1Uw_tcItK0JV';
const TABLE_NAME = 'Ticket';

// GET - Fetch all tickets
export async function GET() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE_NAME}?select=*&order=id.desc`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
    });

    const data = await res.json();

    // Transform data to match the interface
    const formattedData = (Array.isArray(data) ? data : []).map((t: any) => ({
      id: t.id,
      name: t.name,
      phone: t.phone,
      subject: t.subject,
      description: t.message || t.description || '',
      status: t.status || 'open',
      createdAt: t.createdAt,
    }));

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json([]);
  }
}

// POST - Add new ticket/complaint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('New ticket:', body);

    const { name, phone, subject, description } = body;

    if (!subject || !description) {
      return NextResponse.json({ error: 'Subject and description are required' }, { status: 400 });
    }

    const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE_NAME}`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        name: name || null,
        phone: phone || null,
        subject: subject,
        message: description,
        status: 'open',
        priority: 'normal',
        createdAt: new Date().toISOString(),
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('Error creating ticket:', data);
      return NextResponse.json({ error: 'Error: ' + JSON.stringify(data) }, { status: 500 });
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (error) {
    console.error('Error adding ticket:', error);
    return NextResponse.json({ error: 'Error: ' + String(error) }, { status: 500 });
  }
}

// PUT - Update ticket status
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id) {
      return NextResponse.json({ error: 'Ticket ID is required' }, { status: 400 });
    }

    const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE_NAME}?id=eq.${id}`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status, updatedAt: new Date().toISOString() }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Error updating ticket' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating ticket:', error);
    return NextResponse.json({ error: 'Error updating ticket' }, { status: 500 });
  }
}

// DELETE - Delete a ticket
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Ticket ID is required' }, { status: 400 });
    }

    const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE_NAME}?id=eq.${id}`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Error deleting ticket' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting ticket:', error);
    return NextResponse.json({ error: 'Error deleting ticket' }, { status: 500 });
  }
}
