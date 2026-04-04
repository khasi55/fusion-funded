
import { PaymentGateway, CreateOrderParams, CreateOrderResponse, WebhookData } from './types';

/**
 * Manual Crypto Payment Gateway
 * Displays a wallet address/QR and requires admin approval
 */
export class ManualCryptoGateway implements PaymentGateway {
    name = 'manual_crypto';

    async createOrder(params: CreateOrderParams): Promise<CreateOrderResponse> {
        // For manual crypto, we don't redirect to a 3rd party.
        // We return a "success" with a local payment URL or just flag it as manual.
        return {
            success: true,
            gatewayOrderId: `MANUAL-${params.orderId}`,
            // The frontend will handle showing the QR code based on this gateway name
            paymentUrl: `/payment/manual-crypto?orderId=${params.orderId}`
        };
    }

    async verifyWebhook(headers: any, body: any): Promise<boolean> {
        // Manual payments don't have standard webhooks.
        // Approval is done via the admin portal.
        return false;
    }

    parseWebhookData(body: any): WebhookData {
        return {
            orderId: body.orderId,
            paymentId: body.paymentId || body.utr,
            status: 'pending',
            amount: body.amount,
            metadata: body.metadata
        };
    }
}
