import { 
  WebpayPlus, 
  Options, 
  Environment, 
  IntegrationCommerceCodes, 
  IntegrationApiKeys 
} from 'transbank-sdk';
import { createClient } from '@/lib/supabase/server';

// 1. Inicializamos Transbank a prueba de balas.
// Verificamos si estamos en producción real.
const isProduction = process.env.TBK_ENVIRONMENT === 'production';

// Si es producción, usa tus variables reales (TBK_COMMERCE_CODE, etc.)
// Si es integración (pruebas), usa las credenciales maestras oficiales del SDK que nunca fallan.
const tx = new WebpayPlus.Transaction(
  new Options(
    isProduction ? process.env.TBK_COMMERCE_CODE! : IntegrationCommerceCodes.WEBPAY_PLUS,
    isProduction ? process.env.TBK_API_KEY! : IntegrationApiKeys.WEBPAY,
    isProduction ? Environment.Production : Environment.Integration
  )
);

export async function createPaymentOrder(params: {
  userId: string;
  amount: number; // En pesos CLP
  plan: 'monthly' | 'annual';
  returnUrl: string;
}) {
  try {
    // 1. Crear IDs únicos para la orden y la sesión
    const buyOrder = `O-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const sessionId = `S-${params.userId}-${Date.now()}`;

    // 2. Crear la transacción en Transbank
    const response = await tx.create(
      buyOrder,
      sessionId,
      params.amount,
      params.returnUrl
    );

    // 3. Guardar la intención de pago en Supabase (estado: 'pending')
    const supabase = await createClient();
    await supabase.from('subscriptions').insert({
      user_id: params.userId,
      plan: 'premium',
      status: 'pending',
      transbank_order_id: buyOrder,
      transbank_token: response.token,
      amount: params.amount,
    });

    return {
      token: response.token,
      url: response.url,
      buyOrder,
    };
  } catch (error) {
    console.error('Error creando orden en Transbank:', error);
    throw error;
  }
}

export async function confirmPayment(token: string) {
  try {
    // 1. Confirmar pago en Transbank
    const response = await tx.commit(token);

    if (response.response_code === 0 && response.status === 'AUTHORIZED') {
      // 2. Si el pago es exitoso, actualizar la BD
      const supabase = await createClient();
      
      // Actualizar estado a 'active'
      await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // +30 días
        })
        .eq('transbank_token', token);

      // Otorgar créditos infinitos
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('user_id')
        .eq('transbank_token', token)
        .single();

      if (sub) {
        await supabase.from('ai_credits').upsert({
          user_id: sub.user_id,
          balance: 999999, // Infinito
        });
      }

      return { success: true, response };
    } else {
      throw new Error(`Pago rechazado o fallido`);
    }
  } catch (error) {
    console.error('Error confirmando pago en Transbank:', error);
    throw error;
  }
}