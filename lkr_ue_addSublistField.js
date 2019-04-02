function beforeLoad_test(type, form, request) {
	var execContext = nlapiGetContext().getExecutionContext();
	
	// Run only in user interface
	if (execContext == 'userinterface') {
		var custcolAccount = form.getSubList('recmachcustrecord_parent_link').addField('custpage_test', 'select', 'Test');
		nlapiLogExecution('DEBUG', 'Before Load', 'Custom sublist added');
	}
}
