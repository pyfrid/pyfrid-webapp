Pyfrid.{{webclass}}= Ext.extend(Ext.FormPanel, {
	initComponent:function() {
	    this.time_field = new Ext.form.TextField({
	    	fieldLabel: "Time [sec]",
	        emptyText:'Type a value...',
	        allowBlank: false,
	        width: 300
	    });
		Ext.apply(this,{
		    bodyStyle:'padding:5px 5px 0',
			items:[this.time_field]
		});
		Pyfrid.{{webclass}}.superclass.initComponent.apply(this, arguments);
		this.time_field.on("valid",function(form,field){this.fireEvent("cmdchanged",this.generateCommand());},this);
   },
   generateCommand:function(){
	   var time=this.time_field.getValue();
	   if (time=='')
		   return ''
	   cmd=this.objname+' '+time;
	   return cmd;
   },
   updateData:function(){},
   clearCommand:function(){
   		this.time_field.setValue('');
   }
});