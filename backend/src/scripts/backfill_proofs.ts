
import { supabaseAdmin } from '../lib/supabase';

async function backfillProofs() {
    console.log('🚀 Starting Payment Proof Backfill...');

    // 1. Fetch orders that are PAID but missing proof_image
    // We strictly look for manual orders from the last month
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const { data: orders, error: fetchError } = await supabaseAdmin
        .from('payment_orders')
        .select('order_id, metadata, proof_image')
        .eq('status', 'paid')
        .gte('created_at', oneMonthAgo.toISOString())
        .is('proof_image', null);

    if (fetchError) {
        console.error('❌ Failed to fetch orders:', fetchError);
        return;
    }

    console.log(`🔍 Found ${orders?.length || 0} paid orders missing proof_image.`);

    if (!orders || orders.length === 0) return;

    // 2. List files in 'proofs' bucket
    console.log('📦 Scanning "proofs" storage bucket...');
    const { data: files, error: storageError } = await supabaseAdmin
        .storage
        .from('proofs')
        .list('', { limit: 1000 });

    if (storageError) {
        console.error('❌ Failed to list storage bucket:', storageError);
        return;
    }

    console.log(`📂 Found ${files?.length || 0} files in bucket.`);

    // 3. Match and Backfill
    let linkedCount = 0;
    for (const order of orders) {
        // Look for any file that starts with this order_id
        // Frontend uses `${orderId}-${Math.random()}.${fileExt}`
        const matchingFile = files.find(f => f.name.startsWith(order.order_id));

        if (matchingFile) {
            console.log(`✨ Found match for ${order.order_id}: ${matchingFile.name}`);
            
            // Get public URL
            const { data: { publicUrl } } = supabaseAdmin
                .storage
                .from('proofs')
                .getPublicUrl(matchingFile.name);

            // Update order
            const updatedMetadata = {
                ...(order.metadata || {}),
                proof_url: publicUrl,
                proofUrl: publicUrl
            };

            const { error: updateError } = await supabaseAdmin
                .from('payment_orders')
                .update({ 
                    proof_image: publicUrl,
                    metadata: updatedMetadata
                })
                .eq('order_id', order.order_id);

            if (updateError) {
                console.error(`❌ Failed to update order ${order.order_id}:`, updateError);
            } else {
                console.log(`✅ Successfully linked proof for ${order.order_id}`);
                linkedCount++;
            }
        }
    }

    console.log(`\n🎉 Backfill complete! Linked ${linkedCount} proofs.`);
}

backfillProofs().catch(console.error);
