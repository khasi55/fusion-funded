import { RulesService } from '../services/rules-service';

async function verify() {
    console.log('🔍 Testing HFT Rule Resolution...');
    
    // Case 1: GRP3 (Phase 1) with generic "Phase 1" type
    const rules1 = await RulesService.getRules('MBULGE\\contest\\grp3', 'Phase 1');
    console.log('\n--- Case 1: GRP3 + "Phase 1" ---');
    console.log('Daily Loss %:', rules1.max_daily_loss_percent);
    console.log('Expected: 7');
    
    // Case 2: GRP4 (Funded) with generic "Phase 1" type
    const rules2 = await RulesService.getRules('MBULGE\\contest\\grp4', 'Phase 1');
    console.log('\n--- Case 2: GRP4 + "Phase 1" ---');
    console.log('Daily Loss %:', rules2.max_daily_loss_percent);
    console.log('Expected: 7');

    // Case 3: Generic Account (Lite)
    const rules3 = await RulesService.getRules('demo\\S\\1-SF', 'Phase 1');
    console.log('\n--- Case 3: Generic Lite + "Phase 1" ---');
    console.log('Daily Loss %:', rules3.max_daily_loss_percent);
    console.log('Expected: 5');

    if (rules1.max_daily_loss_percent === 7 && rules2.max_daily_loss_percent === 7) {
        console.log('\n✅ VERIFICATION PASSED: HFT accounts correctly resolve to 7% drawdown.');
    } else {
        console.error('\n❌ VERIFICATION FAILED: Drawdown resolution is incorrect.');
    }
}

verify();
