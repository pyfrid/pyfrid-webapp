Pyfrid.ModuleManager= Ext.extend(Pyfrid.BaseTreeGridManager, {
	router:null,
	initComponent:function() {
		Ext.apply(this,{
			iconCls:"default-module-icon",
			region: 'west',
			title: 'Modules',
			collapsible: true,
	        split: true,
	        width: 350, 
	        minSize: 100,
	        maxSize: 800,
	        animate: false
		});
		Pyfrid.ModuleManager.superclass.initComponent.apply(this, arguments);
    },
    updateData:function(){
    	this.router.get_modules_data(function(resp){
    		if (resp!=null) this.updateTree(resp);
    	},this)
    }
});
