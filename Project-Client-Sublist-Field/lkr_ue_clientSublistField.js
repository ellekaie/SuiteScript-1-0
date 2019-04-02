/* beforeLoad_addCustomerColumn
 * - Adds custom 'Enter Client' sublist field on UI context
*/
function beforeLoad_addCustomerColumn(type, form) {
	var logTitle = 'beforeLoad_addCustomerColumn';
	var execContext = nlapiGetContext().getExecutionContext();
	
	// Run only in user interface
	if (execContext == 'userinterface') {
		// Add custom sublist field, 'Enter Client'
		form.getSubList('item').addField('custpage_customer', 'select', 'Enter Client');
		nlapiLogExecution('DEBUG', logTitle, 'type: ' + type + ' | Custom Customer column added');
	} 
}

/* beforeSubmit_copyCustomerColumnVal
 * - Copies values from 'Enter Client' sublist field to standard 'Client' sublist field
*/
function beforeSubmit_copyCustomerColumnVal(type) {
	var logTitle = 'beforeSubmit_copyCustomerColumnVal';
	var execContext = nlapiGetContext().getExecutionContext();
	
	// Run only in user interface
	if (execContext == 'userinterface') {
		try {
			// Get number of Item lines
			var itemCount = nlapiGetLineItemCount('item');
			nlapiLogExecution('DEBUG', 'itemCount', itemCount);
			
			for (var i = 0; i < nlapiGetLineItemCount('item'); i++) {
				// Get value of 'Enter Client' sublist field
				var colCustID = nlapiGetLineItemValue('item', 'custpage_customer', i+1);
				
				if (colCustID != null) {
					nlapiLogExecution('DEBUG', 'colCustID', colCustID);
					// Copy value of 'Enter Client' to standard 'Client' sublist field
					nlapiSetLineItemValue('item', 'customer', i+1, colCustID);
				}
				else {
					// If 'Enter Client' is empty, make 'Client' empty as well
					nlapiSetLineItemValue('item', 'customer', i+1, '');
				}
			}
			nlapiLogExecution('DEBUG', logTitle, 'Customer sublist values copied');			
		}
		catch(e) {
			throw e.toString();
		}
	}
}

/* afterSubmit_checkExportToOpenAir
 * - Checks Export to OpenAir column if Bill is approved
*/
function afterSubmit_checkExportToOpenAir(type) {
	var logTitle = 'afterSubmit_checkExportToOpenAir';
	nlapiLogExecution('DEBUG', '***** START *****', logTitle);
	
	var recId = nlapiGetRecordId();
	nlapiLogExecution('DEBUG', logTitle, 'Record Id: ' + recId);
	
	// Do not process if newly created record
	if (recId != -1) {
		var recVb = nlapiLoadRecord('vendorbill', recId);
		
		// If Vendor Bill is approved
		if (recVb.getFieldValue('approvalstatus') == 2) {
			
			var itemCount = recVb.getLineItemCount('item');
			nlapiLogExecution('DEBUG', logTitle, 'Item Line Count: ' + itemCount);
			
			// Continue if Items sublist is not empty
			if (itemCount != 0) {
				var recProj = '';
				var lineAmt = '';
				
				// Loop through Items 
				for (i = 1; i <= itemCount; i++) {
					
					// Get Project ID
					var idProj = recVb.getLineItemValue('item', 'customer', i)
					
					// Check if Export to OpenAir is not checked and Client is not empty
					if (recVb.getLineItemValue('item', 'custcol_oa_export_to_openair', i) == 'F' &&
						idProj != '') {
							
						recProj = nlapiLoadRecord('job', idProj);
						
						// Check if Project has Export to OpenAir checked
						if (recProj.getFieldValue('custentity_oa_export_to_openair') == 'T') {
							// Check Export to OpenAir
							recVb.setLineItemValue('item', 'custcol_oa_export_to_openair', i, 'T');
							// Copy Amount to OpenAir Rate
							lineAmt = recVb.getLineItemValue('item', 'amount', i);
							recVb.setLineItemValue('item', 'custcol_oa_po_rate', i, lineAmt);
						}
						else {
							nlapiLogExecution('DEBUG', logTitle, 'Project id ' + idProj + ' has Export to OpenAir unchecked');
						}
					}
					else {
						nlapiLogExecution('DEBUG', logTitle, 'Check Project or Export to OpenAir columns on Item Line ' + i);
					}
				}
				nlapiSubmitRecord(recVb);
			}
		}
	}
	nlapiLogExecution('DEBUG', '***** END *****', logTitle);
}
