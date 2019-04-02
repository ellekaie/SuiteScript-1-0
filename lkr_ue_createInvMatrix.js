function beforeSubmit_createInv(type) {

	var logTitle = "beforeSubmit_createInv";

	//********************************
	// Create a Parent Matrix Item
	//********************************

	var matrixParent = nlapiCreateRecord('inventoryitem');
	matrixParent.setFieldValue('itemid', 'Tumbler'); 
	matrixParent.setFieldValue('matrixtype','PARENT');

	// Define the Item's options
	var valColor = [1, 2, 3, 4]; 
	matrixParent.setFieldValue('custitem_tumbler_color', valColor);

	var valSize = [1, 2, 3]; 
	matrixParent.setFieldValue('custitem_tumbler_size', valSize);

	nlapiLogExecution('DEBUG', logTitle, 'valColor: ' + valColor + ' | valSize: ' + valSize);
	nlapiLogExecution('DEBUG', logTitle, 'custitem_tumbler_color: ' + matrixParent.getFieldValues('custitem_tumbler_color') + ' | valSize: ' + matrixParent.getFieldValues('custitem_tumbler_size'));

	matrixParentId = nlapiSubmitRecord(matrixParent);

	nlapiLogExecution('DEBUG', logTitle, 'matrixParentId: ' + matrixParentId);

	//********************************
	// Create a Child Matrix Item
	//********************************

	// Get attributes from Parent record
	var mtxParent = nlapiLoadRecord('inventoryitem', matrixParentId);

	var parentColor = mxParent.getFieldValues('custitem_tumbler_color');
	var parentSize = mxParent.getFieldValues('custitem_tumbler_size');

	var parentColorName = mxParent.getFieldTexts('custitem_tumbler_color');
	var parentSizeName = mxParent.getFieldTexts('custitem_tumbler_size');

	nlapiLogExecution('DEBUG', logTitle, 'parentColor: ' + parentColor + ' | parentSize: ' + parentSize);

	var matrixChild = nlapiCreateRecord('inventoryitem'); 
	matrixChild.setFieldValue('matrixtype','CHILD'); 
	matrixChild.setFieldValue('parent', matrixParentId);

	nlapiLogExecution('DEBUG', logTitle, 'parentColor.length: ' + parentColor.length + ' | parentSize.length: ' + parentSize.length);

	for(idColor = 0; idColor < parentColor.length; idColor++) {
		for(idSize = 0; idSize < parentSize.length; idSize++) {

			// matrixChild.setFieldValue('itemid','Tumbler Tall-Green'); 
			matrixChild.setFieldValue('itemid', 'Tumbler ' + parentColorName[idColor] + '-' + parentSizeName[idSize]); 
			nlapiLogExecution('DEBUG', logTitle, 'parentColorName[idColor]: ' + parentColorName[idColor] + ' | ' + 'parentSizeName[idSize]: ' + parentSizeName[idSize]);

			//matrixChild.setFieldValue('matrixoptioncustitem_tumbler_color',1)
			matrixChild.setFieldValue('matrixoptioncustitem_tumbler_color', parentColor[idColor]);
			nlapiLogExecution('DEBUG', logTitle, 'parentColor[idColor]: ' + parentColor[idColor]);

			//matrixChild.setFieldValue('matrixoptioncustitem_tumbler_size',1)
			matrixChild.setFieldValue('matrixoptioncustitem_tumbler_size', parentSize[idSize]);
			nlapiLogExecution('DEBUG', logTitle, 'parentSize[idSize]: ' + parentSize[idSize]);

			matrixChildId = nlapiSubmitRecord(matrixChild);
			nlapiLogExecution('DEBUG', logTitle, 'matrixChildId: ' + matrixChildId);
		}
	}
}
