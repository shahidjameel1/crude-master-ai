declare global {
    interface Window {
        TradingView: {
            widget: new (config: TradingViewWidgetConfig) => void;
        };
    }
}

interface TradingViewWidgetConfig {
    symbol: string;
    interval: string;
    timezone: string;
    theme: 'light' | 'dark';
    style: string;
    locale: string;
    toolbar_bg: string;
    enable_publishing: boolean;
    hide_side_toolbar: boolean;
    allow_symbol_change: boolean;
    container_id: string;
    studies?: string[];
    disabled_features?: string[];
    enabled_features?: string[];
    overrides?: Record<string, any>;
    width?: string | number;
    height?: string | number;
}

export { };
