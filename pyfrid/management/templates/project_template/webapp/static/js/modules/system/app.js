
Pyfrid.LoginPanel=Ext.extend(Ext.form.FormPanel,{
	router: null,
	initComponent:function() {
		this.loginField=new Ext.form.TextField({
				fieldLabel:'Username',
				allowBlank:true,
				defaultValue: "guest"
		});
		this.passwordField=new Ext.form.TextField({
				fieldLabel:'Password',
				allowBlank:true,
				inputType:'password',
				defaultValue: "guest"
		});
		this.loginBtn=new Ext.Button({
			scope:this,
			text:'Login',
			handler: this.doLogin
		});
		Ext.apply(this,{ 
        	labelWidth:80,
        	frame:false, 
			monitorValid:true,
			bodyStyle: 'padding:10px 10px 0;',
	        defaults: {
	            anchor: '95%',
	            allowBlank: false,
	            selectOnFocus: true,
	            msgTarget: 'side'
	        },
			items:[this.loginField,this.passwordField],
        	buttons:[this.loginBtn], 
        	layout:'form',
        	keys: [
		        { key: [Ext.EventObject.ENTER], scope:this, handler: function() {
	                    this.doLogin()
	                }
            	}
        	]
    	});
		Pyfrid.LoginPanel.superclass.initComponent.apply(this, arguments);
		this.addEvents("loginerror");
	},
	doLogin:function(){
		if (!this.getForm().isValid()) {
            return;
        }
        var login=this.loginField.getValue();
        var pass=this.passwordField.getValue();
        this.router.login(login,pass,function(resp){
         	if (!resp) this.fireEvent("loginerror");
         	else window.location.reload();
         }, this); 
    }
});

Pyfrid.LoginWindow=Ext.extend(Ext.Window,{
	router:null,
	initComponent:function() {
        this.formPanel=new Pyfrid.LoginPanel({router: this.router});
    	Ext.apply(this,{
    	    modal:   true,
    	    layout:  'fit',
    	    title:   'Please Login',
    	    iconCls: 'login-window-icon',
    		items:   [this.formPanel],
    		width:   280,
    		height:  150
    	});
		Pyfrid.LoginWindow.superclass.initComponent.apply(this, arguments);
		this.formPanel.on("loginerror", this.onLoginError);
	},
	onLoginError:function(){
		Ext.MessageBox.show({
			title: 'Authentication error',
			msg: "Login failed. Login or password are incorrect",
			buttons: Ext.MessageBox.OK,
			icon: Ext.MessageBox.ERROR
		});	
	}
});

Pyfrid.{{webclass}} = Ext.extend(Ext.Panel,{
            interval: 2000,
	    	initComponent:function() {
	    		var ws = new WebSocket("ws://" + window.document.location.host+"/websocket");
	    		var me=this;
          		ws.onmessage = function(evt) {
          			var data=JSON.parse(evt.data);
          			if (data!==null){
         				var en=data.event;
          				if (en!==null) me.fireEvent(en, data);
          			}
          		};
          		
          		ws.onclose = function() {
          			//alert("ERROR!!! The connection to event handler was closed. The application will restart");
					//window.location.reload();
          		};
	    		
	    		this.interfaces=Object();
	    		this.commandsInfo = {{commandsinfo}}
	    		this.devicesInfo  = {{devicesinfo}}
	    		this.modulesInfo  = {{modulesinfo}}
	    		this.module_manager=  new Pyfrid.ModuleManager({router: this.router});
	    		this.device_manager=  new Pyfrid.DeviceManager({router: this.router});
	    		this.log_manager=     new Pyfrid.LogManager({router: this.router});
	    		this.command_manager= new Pyfrid.CommandManager({router: this.router});
	    		this.statusbar=new Ext.ux.StatusBar({
	                defaultText: ''
	    		});
	    		this.toolbar=new Ext.Toolbar();
	    		this.commandPanel=new Ext.Panel({
	    			scope:this,
	    			layout:'border',
	    			region:'center',
	    			items:[this.command_manager]
	    		});
	    	    Ext.apply(this,{
	    	    	id: 'main-panel',
	    	    	layout: 'border',
	    	    	bbar:  this.statusbar,
	    	    	tbar:  this.toolbar,
	    	    	items: [
	    	    			this.commandPanel,
	    	    			this.module_manager,
	    	    			this.device_manager,
	    	    			this.log_manager
	    	    		   ]
	    	    });
	    		this.initInterfaces(this.commandsInfo);
	    		this.toolbar.add({xtype: 'tbseparator'});
	    		this.initInterfaces(this.devicesInfo);
	    		this.toolbar.add({xtype: 'tbseparator'});
	    		this.initInterfaces(this.modulesInfo);
	    		this.toolbar.add("->");
	    		this.router.login(null,null,function(resp){
	    			if (resp)
	    				this.toolbar.add({
	    					text: 'Logout',
	    					cls:"logout-btn-cls",
	    					handler:function(){
	    						this.router.logout();
	    					},
	    					scope:this
	    				});
	    			else{
	    				this.toolbar.add({
	    					text: 'Login',
	    					cls:"login-btn-cls",
	    					handler:function(){
	    						new Pyfrid.LoginWindow({router:this.router}).show();
	    					},
	    					scope:this
	    				});
	    				new Pyfrid.LoginWindow({router:this.router}).show();
	    			}
	    			this.toolbar.add("-")
	    			this.addPyfridIcon();
	    		},this);
	    		
	    		
	    	    Pyfrid.{{webclass}}.superclass.initComponent.apply(this, arguments);
	    	    
	    	    this.router.get_log_data(function(data){this.log_manager.setMessages(data)},this);
	    	    
	    	    this.addEvents("userchanged", "cmdactive", "cmdfinished", "activate_interface");
	    	    
	    	    this.on("activate_interface",function(id, type){
	    	    	this.activateInterface(id, type);
	    	    }, this);
	    	    
	    	    this.on("cmdactive", function(){
	    	    	this.command_manager.disableExecution();
	    	    }, this);
	    	    
	    	    this.on("cmdfinished",function(){
	    	    	this.command_manager.enableExecution();
	    	    }, this);
	    	    
	    	    this.on("userchanged",function(){
	    	    	alert("User chnaged. The application will restart");
					window.location.reload();
	    	    }, this);
	    	    
	    	    this.on("logmessage", function(data){
	    	    	this.log_manager.addMessage(data);
	    	    }, this);
	    	    
	    		this.update_task=Ext.TaskMgr.start({
	    			scope: this,
	    			interval: this.interval,
	    			run: function(){
	    				this.device_manager.updateData();
	    				this.module_manager.updateData();
	    			}
	    		});
	    		this.addCopyright();
	    },
	    addPyfridIcon:function(){
	    	this.toolbar.add({
				xtype: 'box',
				html: '<a href="http://escape-app.net/pyfrid" target="_blank"> <img height="10" src="/project_static/images/pyfrid-small.png" /></a>'
        	});
        	this.toolbar.doLayout();
	    },
	    addCopyright:function(){
	    	this.statusbar.add("->")
	    	this.statusbar.add({
				xtype: 'box',
				html: '&copy; Design and development: <a href="mailto:dkor2005@gmail.com" target="_blank">Denis Korolkov</a>'
        	});
        	this.statusbar.doLayout();
	    },
	    initInterfaces:function(info){
			for (var i=0;i<info.length;i++){
				var item=info[i];
				if (item.type!="group"){
					var id=this.createInterface(item);
					this.toolbar.add(new Ext.Button({
						scope:this,
						text:item.name,
						iconCls: item.iconCls,
						item_id: id,
	    				item_type: item.type,
						handler: function(btn){
							this.fireEvent("activate_interface", btn.item_id, btn.item_type);
						}
					}));
				}
				else{
					var menu=new Ext.menu.Menu();
					this.addInterfaceItem(item.children, menu);
					this.toolbar.add(new Ext.Button({
						text:item.name,
						iconCls: item.iconCls,
						menu: menu
					}));
				}
			}
	    },
	    addInterfaceItem:function(info, root_menu){
	    	for (var i=0;i<info.length;i++){
	    		var item=info[i];
	    		if (item.type=="group"){
	    			var menu=new Ext.menu.Menu();
	    			this.addInterfaceItem(item.children, menu);
	    			root_menu.addItem({text:item.name,iconCls:item.iconCls,menu:menu}); 
	    		}else{
					var id=this.createInterface(item);
	    			root_menu.addItem({
    					scope:this,
    					text:item.name,
    					iconCls:item.iconCls,
    					item_id: id,
    					item_type: item.type,
    					handler: function(item){
							this.fireEvent("activate_interface", item.item_id, item.item_type);
						}
	    			});
	    		}
	    	}
	    },
		onLoginClick:function(){
			var w=new Pyfrid.LoginWindow();
			w.show();
		},
		onLogoutClick:function(){
			Pyfrid.router[objalias].logout(function(resp){
				if (resp) window.location.reload();
			});
		},
		createInterface:function(info){
			var webclass=Pyfrid[info.webclass];
			console.log(Pyfrid);
			var webrouter=Pyfrid.router[info.alias];
 			var id=info.alias+"-"+info.type+"-interface";
			if (info.type=="command"){
 				var obj=new webclass({id:id, objname:info.name, router:webrouter});
 				this.on("cmdfinished", function(){
 					obj.updateData();
 				});
 				this.command_manager.addCommand(obj);
 			}
 			else{
 				var obj=new webclass({id:id, objname:info.name, router:webrouter});
	   			this.interfaces[id]=obj;
 			}
 			return id;
		},
		activateInterface:function(id, type){
			if (type=="command"){
 				this.command_manager.activateCommand(id);
 			}
 			else{
 				if (id in this.interfaces){
 					this.interfaces[id].show();
 				}
 			}
		}
});
