import { FusionPayGateway } from './fusionpay';
import { PaymidGateway } from './paymid';
import { EPayGateway } from './epay';
import { CregisGateway } from './cregis';
import { ManualCryptoGateway } from './manual';
import { PaymentGateway } from './types';

/**
 * Payment Gateway Registry
 * Centralized management of all payment gateways
 */
class PaymentGatewayRegistry {
    private gateways: Map<string, PaymentGateway>;

    constructor() {
        this.gateways = new Map();
        this.registerGateways();
    }

    private registerGateways() {
        const fusionpay = new FusionPayGateway();
        const paymid = new PaymidGateway();
        const epay = new EPayGateway();
        const cregis = new CregisGateway();
        const manual = new ManualCryptoGateway();

        this.gateways.set('fusionpay', fusionpay);
        this.gateways.set('paymid', paymid);
        this.gateways.set('epay', epay);
        this.gateways.set('cregis', cregis);
        this.gateways.set('manual_crypto', manual);
    }

    getGateway(name: string): PaymentGateway | undefined {
        return this.gateways.get(name.toLowerCase());
    }

    getAllGateways(): string[] {
        return Array.from(this.gateways.keys());
    }
}

// Singleton instance
export const paymentGatewayRegistry = new PaymentGatewayRegistry();

export { FusionPayGateway, PaymidGateway, EPayGateway, CregisGateway };
export * from './types';
