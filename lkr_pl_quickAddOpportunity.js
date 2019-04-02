function opp_quick_add_portlet(portlet, column)
{
	portlet.setTitle('Opportunity - Quick Add');

	var instr = portlet.addField('custpage_text', 'text', '');
	instr.setDisplayType('inline');
	instr.setDefaultValue('Add field values, press SAVE to continue.');

	var opp_title = portlet.addField('custpage_title', 'text', 'NAME OF OVERALL PROJECT');
	opp_title.setMandatory(true);

	var opp_class = portlet.addField('custpage_class', 'select', 'OPPORTUNITY CLASS', 'classification');
	opp_class.setMandatory(true);

	var opp_status = portlet.addField('custpage_status', 'select', 'STATUS', 'customerstatus');
	opp_status.setMandatory(true);

	var opp_exp_close = portlet.addField('custpage_exp_close', 'date', 'EXPECTED CLOSE');
	opp_exp_close.setMandatory(true);

	var opp_region = portlet.addField('custpage_region', 'select', 'REGION', 'customlist_dev_opp_mdf_region_list');
	opp_region.setMandatory(true);

	var opp_state = portlet.addField('custpage_state', 'select', 'STATE', 'customlist_state_list');
	opp_state.setMandatory(true);

}
