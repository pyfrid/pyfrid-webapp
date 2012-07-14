Pyfrid.ModuleManager= Ext.extend(Pyfrid.BaseTreeGridManager, {
	router:null,
	initComponent:function() {
		Ext.apply(this,{
			iconCls:"default-module-icon",
			region: 'west',
			title: 'Modules',
			collapsible: false,
	        split: true,
	        width: 350, 
	        animate: false,
	        margins:'3 0 3 3',
            cmargins:'3 3 3 3'
		});
		Pyfrid.ModuleManager.superclass.initComponent.apply(this, arguments);
    },
    updateData:function(){
    	this.router.get_modules_data(function(resp){
    		if (resp!=null) this.updateTree(resp);
    	},this)
    }
});
