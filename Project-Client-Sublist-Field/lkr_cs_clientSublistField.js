/* pageInit_setCustomerCol
 * - Disables standard 'Client' sublist field so that user cannot use it for input
 * - Copies value from 'Client' to 'Enter Client' for existing records
*/
function pageInit_setCustomerCol(type) {
	var logTitle = 'pageInit_setCustomerCol';
	
	// Disable standard Client sublist field
	nlapiDisableLineItemField('item', 'customer', true);
	nlapiLogExecution('DEBUG', logTitle, 'type: ' + type + ' | standard Client sublist field disabled');
	
	if (type == 'edit') {
		nlapiLogExecution('DEBUG', logTitle, 'Add "Enter Client" column values');
		
		// If Subsidiary is not empty
		if (nlapiGetFieldValue('subsidiary') != '') {
			// Add Client and Project records
			addCustomerValues('customer');
			addCustomerValues('job');
		}
		
		nlapiLogExecution('DEBUG', 'Item sublist count', nlapiGetLineItemCount('item'));
		// Loop through each item
		for (i = 1; i <= nlapiGetLineItemCount('item'); i++) {
			nlapiLogExecution('DEBUG', logTitle, 'Line ' + i + ' | Customer: ' + nlapiGetLineItemValue('item', 'customer', i));
			
			nlapiSelectLineItem('item', i);
			// Copy value from standard 'Client' sublist field to custom 'Enter Client' sublist field
			nlapiSetCurrentLineItemValue('item', 'custpage_customer', nlapiGetLineItemValue('item', 'customer', i));
			nlapiCommitLineItem('item');
		}
	}
}

/* validateField_Item
 * - Adds values to 'Enter Client' sublist field on record creation
*/
function validateField_Item(type, name, linenum) {
	var logTitle = 'validateField_Item';
	
	// Will only execute on create. Add values to 'Enter Client' sublist field.
	if (type == 'item' && linenum == 1 && nlapiGetFieldValue('subsidiary') != '' && name != 'custpage_customer' && nlapiGetCurrentLineItemValue('item', 'custpage_customer') == '') {
		// Add Client and Project records
		addCustomerValues('customer');
		addCustomerValues('job');
		return true;
	}
	return true;
}

/* addCustomerValues
 * - Creates Client and Project search to get values for 'Enter Client' sublist field
*/
function addCustomerValues(recType) {
	var logTitle = 'addCustomerValues';
		
	// Create search filters
	var srchFilter = [];
	srchFilter.push(new nlobjSearchFilter('isinactive', null, 'is', 'F'));
	srchFilter.push(new nlobjSearchFilter('subsidiary', null, 'is', nlapiGetFieldValue('subsidiary')));
	
	// If record is Project, add Allow Expenses = T as filter
	if (recType == 'job') {
		srchFilter.push(new nlobjSearchFilter('allowexpenses', null, 'is', 'T'));
	}
	
	// Create search columns
	var srchCols = [];
	srchCols.push(new nlobjSearchColumn('entityid'));
	
	// If record is Project, add the following columns
	if (recType == 'job') {
		srchCols.push(new nlobjSearchColumn('customer'));
		srchCols.push(new nlobjSearchColumn('companyname'));
	}
	
	// Execute search
	var valsToAdd = nlapiSearchRecord(recType, null, srchFilter, srchCols);
	
	// Add results to 'Enter Client' sublist field
	for (var i = 0; i < valsToAdd.length; i++) {
		// Get record ID
		var colID = valsToAdd[i].getValue('entityid');
		
		// If record is Project, get the following columns
		if (recType == 'job') {
			var colParent = valsToAdd[i].getText('customer');
			var colName = valsToAdd[i].getValue('companyname');
		}
		
		// Input the search results as values to the 'Enter Client' field
		if (recType == 'customer') {
			nlapiInsertLineItemOption('item', 'custpage_customer', valsToAdd[i].getId(), colID);
		}
		else {
			nlapiInsertLineItemOption('item', 'custpage_customer', valsToAdd[i].getId(), colID + ' ' + colParent + ' ' + colName);
		}
	}
	
	// Add final blank value to custom Enter Client column
	nlapiInsertLineItemOption('item', 'custpage_customer', 'null', '');
	
	nlapiLogExecution('DEBUG', logTitle, recType + ' values added');
}
