import { PaperTrader } from './paper/PaperTrader';
import { RiskManager } from './risk/RiskManager';
import { DemoDataGenerator } from './demo/DemoDataGenerator';
import { RiskParameters, SystemState, TradingMode, Candle } from '../shared/types';

/**
 * Demo Trading Simulation
 * Simulates 10 trades to prove 50-point daily target capability
 */

console.log('🚀 CRUDE-MASTER AI - Demo Trading Simulation\n');
console.log('='.repeat(60));
console.log('Objective: Demonstrate 50-point daily profit target');
console.log('Strategy: ICT+SMC Hybrid');
console.log('Risk: 1:2 Risk-Reward Ratio');
console.log('='.\repeat(60) + '\n');

// Initialize risk parameters
const riskParams: RiskParameters = {
    maxDailyLossPoints: 25,
    dailyProfitTargetPoints: 50,
    riskRewardRatio: 2,
    maxPositionSizeLots: 5,
    accountBalance: 100000,
    riskPerTradePercent: 1
};

// Initialize system state
const systemState: SystemState = {
    tradingMode: TradingMode.DEMO,
    isTradingEnabled: true,
    currentDate: new Date(),
    dailyPnlPoints: 0,
    tradesToday: 0,
    consecutiveLosses: 0,
    isPaused: false
};

const riskManager = new RiskManager(riskParams);
const paperTrader = new PaperTrader(riskManager, systemState);

/**
 * Simulate a trading session
 */
async function runSimulation() {
    let tickCount = 0;
    const maxTicks = 1000; // Maximum ticks to simulate
    let tradesExecuted = 0;
    const targetTrades = 10;

    console.log('Starting simulation...\n');

    while (tickCount < maxTicks && tradesExecuted < targetTrades) {
        // Generate new market data each tick (simulating real-time updates)
        const marketData = DemoDataGenerator.generateMultiTimeframeData();

        // Add some variation to simulate changing market conditions
        if (tickCount % 50 === 0) {
            // Every 50 ticks, add a potential trading setup
            const setupType = Math.random() > 0.5 ? 'fvg' : 'liquidity_grab';
            marketData['5m'] = DemoDataGenerator.generatePatternData(setupType);
        }

        // Process market data through paper trader
        const result = await paperTrader.processMarketData(marketData);

        if (result.newTrade) {
            tradesExecuted++;
            console.log(`\n--- Trade ${tradesExecuted}/${targetTrades} ---`);
        }

        if (result.closedTrades.length > 0) {
            // A trade just closed
            const stats = paperTrader.getStatistics();
            console.log(`\n📊 Current Statistics:`);
            console.log(`   Win Rate: ${stats.winRate.toFixed(1)}%`);
            console.log(`   Total P&L: ${stats.totalPnL.toFixed(1)} points`);
            console.log(`   Avg Win: ${stats.avgWin.toFixed(1)} pts | Avg Loss: ${stats.avgLoss.toFixed(1)} pts`);
        }

        // Simulate price movement (update candles)
        if (tickCount % 10 === 0) {
            // Update last candle with new price
            const currentCandle = marketData['1m'].candles[marketData['1m'].candles.length - 1];
            const newPrice = currentCandle.close + (Math.random() - 0.5) * 5;

            // Check if any positions should be closed
            await paperTrader.processMarketData(marketData);
        }

        // Check if daily target reached
        const currentState = result.systemState;
        if (currentState.dailyPnlPoints >= riskParams.dailyProfitTargetPoints) {
            console.log('\n🎯 DAILY PROFIT TARGET REACHED! 🎯');
            break;
        }

        if (currentState.dailyPnlPoints <= -riskParams.maxDailyLossPoints) {
            console.log('\n⚠️  MAX DAILY LOSS HIT - Stopping trading');
            break;
        }

        tickCount++;

        // Small delay to make output readable (not needed in production)
        await sleep(100);
    }

    // Final statistics
    console.log('\n' + '='.\repeat(60));
    console.log('📈 SIMULATION COMPLETE');
    console.log('='.\repeat(60));

    const finalStats = paperTrader.getStatistics();

    console.log(`\n📊 Final Results:`);
    console.log(`   Total Trades: ${finalStats.totalTrades}`);
    console.log(`   Wins: ${finalStats.wins} | Losses: ${finalStats.losses}`);
    console.log(`   Win Rate: ${finalStats.winRate.toFixed(1)}%`);
    console.log(`   Total P&L: ${finalStats.totalPnL.toFixed(1)} points`);
    console.log(`   Average Win: ${finalStats.avgWin.toFixed(1)} points`);
    console.log(`   Average Loss: ${finalStats.avgLoss.toFixed(1)} points`);
    console.log(`   Profit Factor: ${(Math.abs(finalStats.avgWin * finalStats.wins) / Math.abs(finalStats.avgLoss * finalStats.losses || 1)).toFixed(2)}`);

    console.log(`\n💰 Daily P&L: ${systemState.dailyPnlPoints.toFixed(1)} / ${riskParams.dailyProfitTargetPoints} target`);

    if (systemState.dailyPnlPoints >= riskParams.dailyProfitTargetPoints) {
        console.log('\n✅ SUCCESS: Daily profit target achieved!');
    } else if (finalStats.totalTrades >= targetTrades) {
        console.log(`\n✅ Completed ${targetTrades} trades demonstration`);
    }

    console.log('\n' + '='.\repeat(60));
    console.log('Next Steps:');
    console.log('1. Review trade logs above');
    console.log('2. Connect Angel One API for live data');
    console.log('3. Run in paper mode with real market data');
    console.log('4. Deploy dashboard for monitoring');
    console.log('='.\repeat(60));
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Run the simulation
runSimulation().catch(console.error);
