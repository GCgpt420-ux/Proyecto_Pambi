import { NextResponse } from 'next/server';
import { confirmPayment } from '@/src/lib/api/transbank';
import { createClient } from '@/lib/supabase/server'; 

async function handleWebpayResponse(token: string | null, isCancellation: boolean, baseUrl: string) {
  if (isCancellation || !token) {
    // Si el usuario canceló en la pantalla de Transbank
    return NextResponse.redirect(`${baseUrl}/protected/perfil?payment=cancelled`);
  }

  try {
    // 1. Confirmamos el pago usando tu función
    const data = await confirmPayment(token);
    // 2. Desempacamos la respuesta real de Transbank
    const tbkResponse = data.response;
    // 3. Verificamos que Transbank haya aprobado la transacción (código 0)
    // También nos aseguramos de que tu función haya dicho 'success: true'
    if (data.success && tbkResponse.response_code === 0 && tbkResponse.status === 'AUTHORIZED') {
      // 4. Extraemos el ID del usuario desde el sessionId (S-tuid-fecha)
      const userId = tbkResponse.session_id.substring(2, 38);
      // 5. Conectamos a la base de datos y actualizamos la columna
      const supabase = await createClient();
      const { error } = await supabase
        .from('profiles')
        .update({ is_premium: true })
        .eq('id', userId);
      if (error) {
        console.error('Error actualizando el plan en la base de datos:', error);
      }
      // ¡Pago exitoso y cuenta actualizada! Redirigimos al perfil
      return NextResponse.redirect(`${baseUrl}/protected/perfil?payment=success`);
    } else {
      // El pago fue rechazado por falta de fondos u otro motivo
      return NextResponse.redirect(`${baseUrl}/protected/perfil?payment=failed`);
    }
  } catch (error) {
    console.error('Error confirmando el pago:', error);
    return NextResponse.redirect(`${baseUrl}/protected/perfil?payment=failed`);
  }
}

// Transbank Webpay Plus normalmente retorna usando GET
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token_ws');
  const tbkToken = searchParams.get('TBK_TOKEN'); 
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  return handleWebpayResponse(token, !!tbkToken, baseUrl);
}

// Soporte de respaldo por si el entorno envía un POST
export async function POST(request: Request) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  
  try {
    const formData = await request.formData();
    const token = formData.get('token_ws') as string | null;
    const tbkToken = formData.get('TBK_TOKEN') as string | null;

    return handleWebpayResponse(token, !!tbkToken, baseUrl);
  } catch (e) {
    return NextResponse.redirect(`${baseUrl}/protected/perfil?payment=failed`);
  }
}