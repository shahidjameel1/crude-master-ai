import { SmartAPI } from "smartapi-javascript";
import { OrderSide, OrderType, OrderStatus } from "../types";

export interface OrderRequest {
    symbol: string;
    token: string;
    exchange: string;
    side: 'BUY' | 'SELL';
    type: 'MARKET' | 'LIMIT';
    quantity: number;
    price?: number;
}

export class OrderService {
    private smartApi: any;

    constructor(smartApi: any) {
        this.smartApi = smartApi;
    }

    /**
     * Place a real order via Angel One
     */
    public async placeOrder(req: OrderRequest) {
        if (!this.smartApi) {
            throw new Error('Broker connection not initialized');
        }

        console.log(`🚀 PLACING REAL ORDER: ${req.side} ${req.symbol} x ${req.quantity}`);

        try {
            const params = {
                exchange: req.exchange,
                symboltoken: req.token,
                transactiontype: req.side,
                quantity: req.quantity.toString(),
                disclosedquantity: req.quantity.toString(),
                ordertype: req.type,
                producttype: "INTRADAY",
                duration: "DAY",
                price: req.price?.toString() || "0",
                squareoff: "0",
                stoploss: "0",
                trailingstoploss: "0"
            };

            const response = await this.smartApi.placeOrder(params);

            if (response.status && response.data) {
                return {
                    success: true,
                    orderId: response.data.orderid,
                    executionPrice: req.price || 0, // Market price will be in trade book
                    timestamp: Date.now()
                };
            } else {
                throw new Error(response.message || 'Order placement failed');
            }
        } catch (error: any) {
            console.error('Order Placement Error:', error);
            throw error;
        }
    }

    /**
     * Get real-time positions
     */
    public async getPositions() {
        if (!this.smartApi) return [];
        try {
            const response = await this.smartApi.getPosition();
            return response.status ? response.data : [];
        } catch (error) {
            console.error('Failed to fetch positions:', error);
            return [];
        }
    }

    /**
     * Square Off All Positions (Emergency Kill)
     */
    public async squareOffAll() {
        console.log('🚨 EMERGENCY: Squaring off all positions...');
        const positions = await this.getPositions();

        if (!positions || positions.length === 0) {
            console.log('✅ No open positions to square off.');
            return { total: 0, squared: 0 };
        }

        let squaredCount = 0;
        for (const pos of positions) {
            const netQty = parseInt(pos.netqty);
            if (netQty !== 0) {
                const side = netQty > 0 ? 'SELL' : 'BUY';
                const qty = Math.abs(netQty);

                try {
                    await this.placeOrder({
                        symbol: pos.tradingsymbol,
                        token: pos.symboltoken,
                        exchange: pos.exchange,
                        side: side,
                        type: 'MARKET',
                        quantity: qty
                    });
                    squaredCount++;
                } catch (err) {
                    console.error(`❌ Failed to square off ${pos.tradingsymbol}:`, err);
                }
            }
        }

        return { total: positions.length, squared: squaredCount };
    }
}
