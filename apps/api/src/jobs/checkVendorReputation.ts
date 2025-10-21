import { Vendor } from '../models/Vendor';
import { getVendorReputationMetrics } from '../services/reputationMetrics';
import { 
	evaluateEscalation, 
	createVendorAction, 
	expireSuspensions,
	getVendorActions 
} from '../services/vendorEscalation';
import { logger } from '@nearbybazaar/lib';

/**
 * Scheduled job to check all active vendors' reputation
 * and send warnings or trigger suspensions
 */
export async function checkVendorReputations() {
	logger.info('Starting vendor reputation check job');
	
	try {
		// First, expire any temporary suspensions that have passed
		const expiredCount = await expireSuspensions();
		logger.info(`Expired ${expiredCount} temporary suspensions`);
		
		const activeVendors = await Vendor.find({ status: 'active' }).select('_id name email');
		
		let warningsSent = 0;
		let suspensionsTriggered = 0;
		let blocksTriggered = 0;
		
		for (const vendor of activeVendors) {
			const vendorId = (vendor as any)._id.toString();
			const vendorName = (vendor as any).name;
			
			// Get current metrics
			const metrics = await getVendorReputationMetrics(vendorId, 30);
			
			// Evaluate against escalation rules
			const escalation = evaluateEscalation(metrics);
			
			if (escalation.shouldAct && escalation.actionType) {
				// Check if vendor already has this action
				const existingActions = await getVendorActions(vendorId, false);
				const hasActiveAction = existingActions.some(
					a => a.actionType === escalation.actionType && a.status === 'active'
				);
				
				if (!hasActiveAction) {
					// Create the action
					await createVendorAction(
						vendorId,
						escalation.actionType,
						escalation.reason,
						metrics,
						'system'
					);
					
					logger.warn(`Created ${escalation.actionType} for vendor ${vendorName} (${vendorId})`);
					console.log('Reason:', escalation.reason);
					console.log('Metrics:', metrics);
					
					// Count by action type
					if (escalation.actionType === 'warning') {
						warningsSent++;
					} else if (escalation.actionType === 'temp_suspend') {
						suspensionsTriggered++;
					} else if (escalation.actionType === 'permanent_block') {
						blocksTriggered++;
					}
					
					// TODO: Send email notification to vendor and admin
				} else {
					logger.info(`Vendor ${vendorName} already has active ${escalation.actionType}`);
				}
			}
		}
		
		logger.info('Vendor reputation check completed');
		console.log('Check results:', {
			totalChecked: activeVendors.length,
			expiredSuspensions: expiredCount,
			warningsSent,
			suspensionsTriggered,
			blocksTriggered,
		});
		
		return {
			totalChecked: activeVendors.length,
			expiredSuspensions: expiredCount,
			warningsSent,
			suspensionsTriggered,
			blocksTriggered,
		};
	} catch (error: any) {
		logger.error('Error in vendor reputation check job');
		console.error(error);
		throw error;
	}
}
