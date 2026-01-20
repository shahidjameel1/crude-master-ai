declare module 'smartapi-javascript' {
    export class SmartAPI {
        constructor(config: { api_key: string });
        generateSession(clientCode: string, password: string, totp: string): Promise<any>;
        getCandleData(params: any): Promise<any>;
    }
    export class WebSocketV2 {
        constructor(config: { jwttoken: string, apikey: string, clientcode: string, feedtype: string });
        connect(): Promise<any>;
        on(event: string, callback: (data: any) => void): void;
    }
}
