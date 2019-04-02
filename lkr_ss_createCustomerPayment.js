function createCustomerPayment() {
	nlapiLogExecution('DEBUG', '***** START *****', 'createCustomerPayment');
	
	var context = nlapiGetContext();
	var idJE = context.getSetting('SCRIPT', 'custscript_journal_entry_id');
	var arrJELines = [];

	/*===============
	 Enter JE record
	================*/
	var recJE = nlapiLoadRecord('journalentry', idJE);
	nlapiLogExecution('DEBUG', 'createCustomerPayment', 'Load JE: ' + idJE);
	nlapiLogExecution('DEBUG', 'createCustomerPayment', 'JE Line Count: ' + recJE.getLineItemCount('line'));
	
	// Loop through Lines sublist
	for (i = 1; i <= recJE.getLineItemCount('line'); i++) {
	
		// Continue if this is a Credit line
		if (recJE.getLineItemValue('line', 'credit', i)) {			
			// Add Customer ID and Invoice ID to array
			arrJELines = addValsToArray(recJE, i, arrJELines)
		}
		else {
			// Do not count Debit line
			// Do nothing
		}
	}
	
	/*============================
	Create Customer Payment record
	=============================*/
	doCustomerPayment(recJE, arrJELines, idJE);
	
	nlapiLogExecution('DEBUG', '***** END *****', 'createCustomerPayment');
}

function addValsToArray(recJE, index, arrJE) {	
	var idCust = '';
	var docNum = '';
	var intSearch = '';
	var intID = '';
	var f = [];
	
	// Get Customer ID
	idCust = recJE.getLineItemValue('line', 'entity', i); 

	// Get Document # 
	docNum = recJE.getLineItemValue('line', 'custcol_invoice_id', index)
	
	// Continue only if Customer ID or Invoice ID are not empty
	if (docNum != null && idCust != null) {
		// Add search filters
		f[0] = new nlobjSearchFilter('numbertext', null, 'is', docNum);
		f[1] = new nlobjSearchFilter('mainline', null, 'is', 'T');
			
		// Perform search to get Internal ID
		intSearch = nlapiSearchRecord('invoice', null, f, new nlobjSearchColumn('internalid'));
		
		// If Invoice is found
		if (intSearch != null) {
			arrJE.push(idCust); // Add Customer ID to array
			nlapiLogExecution('DEBUG', 'addValsToArray', 'Customer ID: ' + idCust);
			
			intID = intSearch[0].getValue('internalid'); // Get value of Invoice ID
			arrJE.push(intID); // Add Invoice ID to array
			nlapiLogExecution('DEBUG', 'addValsToArray', 'Document Number: ' + docNum + ' | Internal ID: ' + intID);
		}
		// If no matching Invoice is found
		else {
			nlapiLogExecution('DEBUG', 'addValsToArray', 'No matching internal ID for Document Number ' + docNum);
		}
	}
	else {
		nlapiLogExecution('DEBUG', 'addValsToArray', 'Data not added to arrJELines. Check JE Line ' + index + ' | Customer ID: ' + idCust + ', Invoice ID: ' + docNum);
	}
	
	return arrJE;
}

function doCustomerPayment(recJE, arrJELines, idJE) {
	nlapiLogExecution('DEBUG', '*****', 'doCustomerPayment');
	
	var context = nlapiGetContext();
	var recCustPay = null;
	var isApplyChecked = false;
	var indexInv = '';
	var myGovernanceThreshold = 500;
	var numCust = arrJELines.length / 2;
	
	nlapiLogExecution('DEBUG', 'doCustomerPayment', 'Number of Customer IDs: ' + numCust);
	
	if (numCust != 0) {
		for (indexCust = 0; indexCust < numCust; indexCust++) {
			nlapiLogExecution('DEBUG', 'doCustomerPayment', 'Current Customer Index: ' + indexCust);
					
			// Set Customer
			// [indexCust*2] - Customer ID is placed at even indeces [0, 2, 4, ...] in arrJELines
			var custID = arrJELines[indexCust*2]; 
			
			// Create Customer Payment and check JE in Credits sublist
			recCustPay = prepareCustomerPayment(recCustPay, custID, idJE); 
			
			// Check Invoices sublist
			if (recCustPay.getLineItemCount('apply') != null) {
				nlapiLogExecution('DEBUG', 'doCustomerPayment', 'Apply Line Count: ' + recCustPay.getLineItemCount('apply'));
				
				for (indexApply = 1; indexApply <= recCustPay.getLineItemCount('apply'); indexApply++){
					
					// Internal ID of Invoice in arrJELines is stored after Customer ID (indexCust*2), thus the +1 after indexCust*2
					indexInv = indexCust * 2 + 1;
					
					if (indexInv != '') {
						// Check if current Invoice in the Invoices sublist can be found in arrJELines[indexCust*2+1]
						if (recCustPay.getLineItemValue('apply', 'doc', indexApply) == arrJELines[indexInv]) {
							recCustPay.setLineItemValue('apply', 'apply', indexApply, 'T'); //
							isApplyChecked = true;
							nlapiLogExecution('DEBUG', 'doCustomerPayment', 'Apply Line Index: ' + indexApply + ' | Invoice: ' + arrJELines[indexInv] + ' | Invoice found in arrJELines');
							break;
						}
					}
					else {
						break;
					}
				}
			}
			else {
				nlapiLogExecution('DEBUG', 'doCustomerPayment', 'Invoice sublist empty for Customer '  + custID + ', no more Invoices to check.');
				break;
			}
			
			if (isApplyChecked) {
				nlapiSubmitRecord(recCustPay);
				nlapiLogExecution('DEBUG', 'doCustomerPayment', 'Customer Payment for Customer ' + custID + ' submitted');
				isApplyChecked = false;
			}
				
			if (context.getRemainingUsage() < myGovernanceThreshold) {
				setRecoveryPoint();
				recCustPay = null;
				recJE = null;
				checkGovernance();
			}	
		}
	}
	else {
		nlapiLogExecution('DEBUG', 'doCustomerPayment', 'No Customer Payment to process.');
	}
}

function prepareCustomerPayment(recCustPay, custID, idJE) {	
	// Create Customer Payment
	recCustPay = nlapiTransformRecord('customer', custID, 'customerpayment');
	recCustPay.setFieldValue('customer', custID); 
	
	// Check Credits sublist
	nlapiLogExecution('DEBUG', 'prepareCustomerPayment', 'Create Customer Payment for Customer ' + custID + 
		' | Credit Line Count: ' + recCustPay.getLineItemCount('credit'));
	for (indexCred = 1; indexCred <= recCustPay.getLineItemCount('credit'); indexCred++){
		
		// Check if JE is equal to Journal Entry ID set on Script Deployment
		if (recCustPay.getLineItemValue('credit', 'doc', indexCred) == idJE) {
			recCustPay.setLineItemValue('credit', 'apply', indexCred, 'T');
			nlapiLogExecution('DEBUG', 'prepareCustomerPayment', 'Credit Line Index: ' + indexCred + ' | Credit marked');
			break;
		}
	}

	return recCustPay;
}

function setRecoveryPoint() {
	nlapiLogExecution('DEBUG', '*****', 'setRecoveryPoint');
    var state = nlapiSetRecoveryPoint(); //100 point governance
    if (state.status == 'SUCCESS') return; //we successfully create a new recovery point
    if (state.status == 'RESUME') //a recovery point was previously set, we are resuming due to some unforeseen error
    {
        nlapiLogExecution('ERROR', 'setRecoveryPoint', 'Resuming script because of ' + state.reason + ' |  Size = ' + state.size);
        handleScriptRecovery();
    } 
	else if (state.status == 'FAILURE') //we failed to create a new recovery point
    {
        nlapiLogExecution('ERROR', 'setRecoveryPoint', 'Failed to create recovery point. Reason = ' + state.reason + ' | Size = ' + state.size);
        handleRecoveryFailure(state);
    }
}

function checkGovernance() {
	nlapiLogExecution('DEBUG', '*****', 'checkGovernance');
    var context = nlapiGetContext();
	
    var state = nlapiYieldScript();
		
	if (state.status == 'FAILURE') {
		nlapiLogExecution('ERROR', 'checkGovernance', 'Failed to yield script, exiting: Reason = ' + state.reason + ' | Size = ' + state.size);
		throw 'Failed to yield script';
	} 
	else if (state.status == 'RESUME') {
		nlapiLogExecution('AUDIT', 'checkGovernance', 'Resuming script because of ' + state.reason + ' |  Size = ' + state.size);
		return true;
	}
	else {
		return false;
	}
	// state.status will never be SUCCESS because a success would imply a yield has occurred.  The equivalent response would be yield
}
