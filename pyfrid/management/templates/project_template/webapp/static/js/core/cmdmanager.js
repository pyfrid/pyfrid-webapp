Pyfrid.CommandManager= Ext.extend(Ext.Panel, {
	router:null,
	initComponent:function() {
	    this.exec_flag=true;
		this.history_store=new Ext.data.ArrayStore({
	        fields: [
	          'command'
	        ],
	        data: []
	    });
	    this.cmdcombo = new Ext.form.ComboBox({
	    	scope: this,
	    	id: 'command-combo',
	        store: this.history_store,
	        displayField:'command',
	        typeAhead: false,
	        mode: 'local',
	        triggerAction: 'all',
	        emptyText:'Type a command...',
	        selectOnFocus:false,
	        validateOnBlur: false,
	        //width: 500,
	        flex:1
	        
	    });
	    this.execute_btn=new Ext.Button({
	    	scope:this,
			text:'Run',
			iconCls:'run-command-icon',
			handler: function(){
	   			this.executeCmd();
			}
		});
		this.validate_btn=new Ext.Button({
	    	scope:this,
			text:'Try',
			iconCls:'simulate-command-icon',
			handler: function(){
	   			this.validateCmd();
			}
		});
		this.pause_btn=new Ext.Button({
	    	scope:this,
			text:'Pause',
			iconCls:'pause-command-icon',
			handler: function(){
			}
		});
	    var stop_btn=new Ext.Button({
	    	scope:this,
			text:'',
			iconCls:'stop-command-icon',
			handler: function(){
				this.stopCommand();
			}
		});
	    var clear_btn=new Ext.Button({
			text:'',
			scope:this,
			iconCls:'cancel-command-icon',
			handler: function(){
				this.clearCommand();
			}
		});
		var blank_panel=new Ext.Panel({
			id:'blank-panel',
			autoEl:{tag: 'img',src: "project_static/images/logo.png"},
			title: '',
			updateData:function(){},
			clearCommand:function(){}
		});
		Ext.apply(this,{
		    id: "command-manager",
		    iconCls:"default-command-icon",
			layout: 'card',
			region: 'center',
		    title: 'Command manager',
		    activeItem: 0,
		    tbar: new Ext.Toolbar({
		        layout: 'hbox',
		        layoutConfig: {
	            	align:'middle'
	        	},
		    	items: [clear_btn,"-",this.cmdcombo,"-", this.validate_btn,"-",this.execute_btn,"-",stop_btn]
		    }),
		    items: blank_panel
		});
		Pyfrid.CommandManager.superclass.initComponent.apply(this, arguments);
		this.cmdcombo.on("keyup",function(cb,e){
			if (e.getKey()==e.ENTER){
				this.executeCmd();
			}
		},this);
   },
   addCommand:function(obj){
   	    this.add(obj);
   	    obj.updateData();
   		obj.on("cmdchanged",function(cmd){this.setCommand(cmd)},this);
   },
   activateCommand:function(id){
		var l=this.getLayout();
		if (l!==null){
			l.setActiveItem(id);
			var activeItem=l.activeItem;
			if (activeItem!==null){
				this.setTitle("Command manager - "+activeItem.objname);
				this.setCommand(activeItem.generateCommand());
			}
		}
   },
   executeCmd:function(){
   	   var cmd=this.getCommand();
	   if (!this.exec_flag){
		   Ext.Msg.show({
			   title:'Execution failed',
			   msg: "Execution of "+cmd+" failed. There is another command running",
			   buttons: Ext.Msg.OK,
			   icon: Ext.MessageBox.ERROR
		   });
		   return;
	   }
	   this.router.execute(cmd,function(){
		   		this.history_store.suspendEvents();
		   if (cmd)
			   this.history_store.loadData([[cmd]],true);
		   this.history_store.resumeEvents();
	   },this);
	   this.clearCommand();
   },
   validateCmd:function(){
   	   var cmd=this.getCommand();
	   if (!this.exec_flag){
		   Ext.Msg.show({
			   title:'Validation failed',
			   msg: "Validation of "+cmd+" failed. There is another command running",
			   buttons: Ext.Msg.OK,
			   icon: Ext.MessageBox.ERROR
		   });
		   return;
	   }
	   this.router.validate(cmd);
   },
   disableExecution:function(){
	   this.execute_btn.disable();
	   this.validate_btn.disable();
	   this.exec_flag=false;
   },
   enableExecution:function(){
	   this.execute_btn.enable();
	   this.validate_btn.enable();
	   this.exec_flag=true;
   },
   getCommand: function(){
	   var cmd=this.cmdcombo.getValue();
	   cmd=cmd==null?'':cmd;
	   return cmd;
   },
   stopCommand:function(){
   	  this.router.stop(); 
   },
   setCommand:function(cmd){
	  this.cmdcombo.setValue(cmd);
   },
   clearCommand: function(){
	   this.cmdcombo.clearValue();
	   this.getLayout().activeItem.clearCommand();
   }
});