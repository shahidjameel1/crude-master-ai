-- CRUDE-MASTER AI Database Schema
-- Supabase PostgreSQL Schema for Trading System

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- STRATEGIES TABLE
-- ============================================
CREATE TABLE strategies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL, -- 'ict_fvg', 'smc_liquidity', 'hybrid', 'custom'
    description TEXT,
    parameters JSONB NOT NULL DEFAULT '{}', -- Strategy-specific parameters
    is_active BOOLEAN DEFAULT true,
    weight DECIMAL(5, 2) DEFAULT 1.0, -- Weight in ensemble (1.0 = neutral)
    
    -- Performance tracking
    total_trades INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    total_profit_points DECIMAL(10, 2) DEFAULT 0,
    max_drawdown_points DECIMAL(10, 2) DEFAULT 0,
    sharpe_ratio DECIMAL(10, 4),
    win_rate DECIMAL(5, 2),
    
    -- Evolution tracking
    generation INTEGER DEFAULT 1,
    parent_strategy_id UUID REFERENCES strategies(id),
    mutation_history JSONB DEFAULT '[]',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- TRADES TABLE
-- ============================================
CREATE TABLE trades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    strategy_id UUID REFERENCES strategies(id) ON DELETE SET NULL,
    
    -- Trade details
    direction VARCHAR(10) NOT NULL, -- 'LONG' or 'SHORT'
    entry_price DECIMAL(10, 2) NOT NULL,
    entry_time TIMESTAMP WITH TIME ZONE NOT NULL,
    exit_price DECIMAL(10, 2),
    exit_time TIMESTAMP WITH TIME ZONE,
    
    -- Risk management
    stop_loss DECIMAL(10, 2) NOT NULL,
    take_profit DECIMAL(10, 2) NOT NULL,
    position_size INTEGER NOT NULL, -- Number of lots
    risk_reward_ratio DECIMAL(5, 2),
    
    -- Performance
    profit_loss_points DECIMAL(10, 2),
    profit_loss_amount DECIMAL(12, 2),
    status VARCHAR(20) DEFAULT 'OPEN', -- 'OPEN', 'CLOSED', 'STOPPED'
    
    -- Context & Learning
    entry_reason TEXT, -- Human-readable entry logic
    market_condition JSONB, -- {trend: 'bullish', volatility: 'high', session: 'morning'}
    timeframe_bias JSONB, -- {daily: 'bullish', 1h: 'neutral', 15m: 'bullish'}
    patterns_detected JSONB, -- [{'type': 'fvg', 'confidence': 0.85}, ...]
    chart_snapshot_url TEXT, -- Screenshot of entry chart
    
    -- Mode tracking
    trading_mode VARCHAR(20) DEFAULT 'demo', -- 'demo', 'paper', 'live'
    
    -- Order IDs (for Angel One)
    angel_order_id VARCHAR(50),
    angel_exchange_order_id VARCHAR(50),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- MARKET DATA TABLE (Cached OHLCV)
-- ============================================
CREATE TABLE market_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol VARCHAR(50) NOT NULL DEFAULT 'CRUDEOIL', -- MCX symbol
    timeframe VARCHAR(10) NOT NULL, -- '1m', '5m', '15m', '1h', '1D'
    
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    open DECIMAL(10, 2) NOT NULL,
    high DECIMAL(10, 2) NOT NULL,
    low DECIMAL(10, 2) NOT NULL,
    close DECIMAL(10, 2) NOT NULL,
    volume BIGINT DEFAULT 0,
    
    -- Technical indicators (pre-calculated)
    indicators JSONB DEFAULT '{}', -- {rsi: 65.2, macd: {...}, atr: 42.3}
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(symbol, timeframe, timestamp)
);

-- Index for fast lookups
CREATE INDEX idx_market_data_symbol_timeframe_timestamp 
ON market_data(symbol, timeframe, timestamp DESC);

-- ============================================
-- PERFORMANCE METRICS TABLE
-- ============================================
CREATE TABLE performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL UNIQUE,
    
    -- Daily metrics
    total_trades INTEGER DEFAULT 0,
    winning_trades INTEGER DEFAULT 0,
    losing_trades INTEGER DEFAULT 0,
    daily_pnl_points DECIMAL(10, 2) DEFAULT 0,
    daily_pnl_amount DECIMAL(12, 2) DEFAULT 0,
    
    -- Risk metrics
    max_drawdown_points DECIMAL(10, 2) DEFAULT 0,
    largest_win_points DECIMAL(10, 2) DEFAULT 0,
    largest_loss_points DECIMAL(10, 2) DEFAULT 0,
    
    -- Ratios
    win_rate DECIMAL(5, 2),
    profit_factor DECIMAL(10, 4),
    sharpe_ratio DECIMAL(10, 4),
    expectancy DECIMAL(10, 4),
    
    -- Session info
    trading_hours DECIMAL(5, 2), -- Hours actively traded
    market_regime VARCHAR(20), -- 'trending', 'ranging', 'volatile'
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- AUDIT LOGS TABLE
-- ============================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    action_type VARCHAR(50) NOT NULL, -- 'TRADE_PLACED', 'MODE_CHANGED', 'STRATEGY_UPDATED'
    user_id VARCHAR(100), -- 'system' or actual user
    description TEXT NOT NULL,
    
    -- Context
    metadata JSONB DEFAULT '{}',
    severity VARCHAR(20) DEFAULT 'INFO', -- 'INFO', 'WARNING', 'ERROR', 'CRITICAL'
    
    -- IP tracking (for security)
    ip_address INET,
    user_agent TEXT
);

-- Index for audit queries
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_action_type ON audit_logs(action_type);

-- ============================================
-- NEWS EVENTS TABLE (High-Impact Events)
-- ============================================
CREATE TABLE news_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_time TIMESTAMP WITH TIME ZONE NOT NULL,
    event_name VARCHAR(200) NOT NULL,
    impact VARCHAR(20) DEFAULT 'HIGH', -- 'LOW', 'MEDIUM', 'HIGH'
    
    -- Auto-pause trading
    pause_before_minutes INTEGER DEFAULT 30,
    pause_after_minutes INTEGER DEFAULT 60,
    
    -- Event details
    currency VARCHAR(10) DEFAULT 'USD',
    category VARCHAR(50), -- 'OPEC', 'EIA', 'FED', 'INVENTORY'
    actual_value DECIMAL(15, 4),
    forecast_value DECIMAL(15, 4),
    previous_value DECIMAL(15, 4),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for upcoming events
CREATE INDEX idx_news_events_time ON news_events(event_time DESC);

-- ============================================
-- SYSTEM STATE TABLE (Singleton for current state)
-- ============================================
CREATE TABLE system_state (
    id INTEGER PRIMARY KEY DEFAULT 1,
    
    -- Current mode
    trading_mode VARCHAR(20) DEFAULT 'demo',
    is_trading_enabled BOOLEAN DEFAULT false,
    
    -- Daily tracking
    current_date DATE DEFAULT CURRENT_DATE,
    daily_pnl_points DECIMAL(10, 2) DEFAULT 0,
    trades_today INTEGER DEFAULT 0,
    consecutive_losses INTEGER DEFAULT 0,
    
    -- Session
    session_start_time TIMESTAMP WITH TIME ZONE,
    last_trade_time TIMESTAMP WITH TIME ZONE,
    
    -- Safety
    is_paused BOOLEAN DEFAULT false,
    pause_reason TEXT,
    
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure only one row
    CONSTRAINT single_row CHECK (id = 1)
);

-- Insert initial state
INSERT INTO system_state (id) VALUES (1) ON CONFLICT DO NOTHING;

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to relevant tables
CREATE TRIGGER update_strategies_updated_at BEFORE UPDATE ON strategies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trades_updated_at BEFORE UPDATE ON trades
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_performance_updated_at BEFORE UPDATE ON performance_metrics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_state_updated_at BEFORE UPDATE ON system_state
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (Optional)
-- ============================================
-- Enable RLS for production security
-- ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can view their own trades" ON trades FOR SELECT USING (true);

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE strategies IS 'Trading strategy definitions with performance tracking and evolution';
COMMENT ON TABLE trades IS 'All trades with full context for learning and analysis';
COMMENT ON TABLE market_data IS 'Cached OHLCV data from Angel One for backtesting';
COMMENT ON TABLE performance_metrics IS 'Daily aggregated performance for reporting';
COMMENT ON TABLE audit_logs IS 'Security and action tracking for compliance';
COMMENT ON TABLE news_events IS 'Economic calendar events that pause trading';
COMMENT ON TABLE system_state IS 'Current system state (singleton table)';
