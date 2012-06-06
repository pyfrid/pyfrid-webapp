Pyfrid.{{webclass}}= Ext.extend(Pyfrid.BaseTreeGridCommandInterface,{
	editorField: new Ext.form.ComboBox({
		xtype : 'combobox',
		typeAhead: true,
		triggerAction: 'all',
		lazyRender:true,
		mode: 'local',
		store: new Ext.data.ArrayStore({
	        fields: [
	            'name',
	            'value'
	        ],
			data: [["True", "True"], ["False", "False"]]
		}),
		valueField: 'value',
		displayField: 'name'
	})
});
