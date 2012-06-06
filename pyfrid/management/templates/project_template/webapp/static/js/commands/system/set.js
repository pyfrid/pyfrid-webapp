Pyfrid.{{webclass}}= Ext.extend(Pyfrid.BaseTreeGridCommandInterface, {
   setEditor:function(){
	   var cfg = {
			   autoSize:true,
               shadow: false,
               completeOnEnter: true,
               cancelOnEsc: true,
               updateEl: true,
               ignoreNoChange: true
       };
	   var valueEditor = new Ext.Editor(Ext.apply({
		   scope:this,
	        listeners: {
		        scope:this,
	            complete: function(ed, value, oldValue){
                    if (this.selected_node!=null){
		   			    this.edited_nodes[this.selected_node]=value;
		   			    this.fireEvent("cmdchanged",this.generateCommand());
		   			    this.selected_node=null;
		   			}
			       }
	            },
	        field: {
	            allowBlank: false,
	            xtype: 'textfield',
	            width: 90,
	            selectOnFocus: true
	        }
	    }, cfg));
	    this.on('click', function(node,e){
	    	if (node.attributes.type != "object" && node.attributes.type != "group"){
	    		this.selected_node=node.attributes.id;
	    		var el = node.ui.getEl().firstChild;
	    		var cells=el.childNodes;
	    		valueEditor.startEdit(cells[1].firstChild);
	    	}
	    });
	    this.innerBody.on('scroll', function(){
	    	valueEditor.cancelEdit();
	    },this);
	 },
	 generateCommand:function(){
	   var config=null;
	   var node=null;
	   var objname='';
	   var cmdarray=[];
	   for (var id in this.edited_nodes){
		   node=this.getNodeById(id);
		   if (node){
		   		objname=node.parentNode.attributes.text;
		   		cmdarray.push(this.objname+' '+objname+' '+node.attributes.text + ' '+this.edited_nodes[id]);
		   }
	   }
	   var cmd=cmdarray.join('; ');
	   return cmd;
   }
});