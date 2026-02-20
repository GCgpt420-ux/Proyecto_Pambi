import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createPaymentOrder } from '@/src/lib/api/transbank';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const plan = body.plan || 'monthly'; // 'monthly' o 'annual'
    
    // Definimos los precios en pesos chilenos (CLP)
    const amount = plan === 'annual' ? 79900 : 7900;

    // URL dinámica dependiendo si estás en localhost o en Vercel
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const returnUrl = `${baseUrl}/api/payments/confirm`;

    // Llamamos a tu cliente de Transbank
    const paymentOrder = await createPaymentOrder({
      userId: user.id,
      amount,
      plan,
      returnUrl,
    });

    // Devolvemos la URL exacta a la que el frontend debe redirigir al usuario
    return NextResponse.json({
      url: `${paymentOrder.url}?token_ws=${paymentOrder.token}`,
      buyOrder: paymentOrder.buyOrder,
    });
  } catch (error) {
    console.error('Error en el endpoint de pago:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud de pago' },
      { status: 500 }
    );
  }
}