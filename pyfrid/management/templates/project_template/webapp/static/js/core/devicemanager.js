Pyfrid.DevStatGridPanel=Ext.extend(Ext.grid.GridPanel, {
	initComponent:function(){
		this.statusStore = new Ext.data.ArrayStore({
				fields : [{name : 'parameter'},
						  {name : 'value'},
						  {name : 'units'}
						  ]
		});
		var gridView = new Ext.grid.GridView({
				onLoad : Ext.emptyFn,
				listeners : {
					beforerefresh : function(v) {
										v.scrollTop = v.scroller.dom.scrollTop;
										v.scrollHeight = v.scroller.dom.scrollHeight;
									},
					refresh : function(v) {
							v.scroller.dom.scrollTop = v.scrollTop
							+ (v.scrollTop == 0
							? 0
							: v.scroller.dom.scrollHeight
							- v.scrollHeight);
					}
				}
		});
		Ext.apply(this,{
			region : 'center',
			store : this.statusStore,
			columns : [{
						header : 'Parameter',
						width : 130,
						sortable : true,
						dataIndex : 'parameter',
						css: "font-weight: bold; font-size: 16px"
					}, {
						header : 'Value',
						width : 70,
						sortable : false,
						dataIndex : 'value'
					}, {
						header : 'Units',
						width : 50,
						sortable : false,
						dataIndex : 'units'
					}],
			title : '',
			view : gridView
		});	
		Pyfrid.DevStatGridPanel.superclass.initComponent.apply(this,arguments);
	},
	loadData:function(data){
		this.statusStore.loadData(data);
	}
});

Pyfrid.StatusWindow = Ext.extend(Pyfrid.PollingWindow, {
	deviceName:"",
	initComponent : function() {
		this.statusGrid=new Pyfrid.DevStatGridPanel();
		this.settingsGrid=new Pyfrid.DevStatGridPanel();
		this.tabPanel = new Ext.TabPanel({
    		activeTab: 0,
		    items: [{
		        title: 'Status',
		        items: this.statusGrid,
		        layout: 'fit'
		    },{
		        title: 'Settings',
		        items: this.settingsGrid,
		        layout: 'fit'
		    }],
		});
		Ext.apply(this,{
			updateFn:this.updateData,
			iconCls : "status-window-icon",
			items: this.tabPanel,
			layout:'fit',
			height:250,
			width: 350
		});
		Pyfrid.StatusWindow.superclass.initComponent.apply(this,arguments);
		this.updateStatus();
		this.updateSettings();
	},
	updateData:function(){
		var activeTab = this.tabPanel.getActiveTab();
		var activeTabIndex = this.tabPanel.items.findIndex('id', activeTab.id);
		if (activeTabIndex==0)
			this.updateStatus();
		else
			this.updateSettings();
	},
	updateSettings:function(){
		this.router.get_device_settings(this.deviceName, 
			function(resp){
				if (resp) this.settingsGrid.loadData(resp);
			}, this);
	},
	updateStatus:function(){
		this.router.get_device_status(this.deviceName, 
			function(resp){
				if (resp) this.statusGrid.loadData(resp);
			}, this);
	}
});


Pyfrid.DeviceManager = Ext.extend(Pyfrid.BaseTreeGridManager, {
			initComponent : function() {
//				this.status_windows = {};
				Ext.apply(this, {
							iconCls : "default-device-icon",
							region : 'east',
							title : 'Devices',
							id : 'device-manager',
							collapsible : true,
							split : true,
							width : 350,
							minSize : 100,
							maxSize : 800,
							animate : false
						});
				Pyfrid.DeviceManager.superclass.initComponent.apply(this,
						arguments);
				this.on('click', this.showStatus);
			},
			showStatus : function(node, e) {
				if (node.attributes.type in objectNodeTypes) {
					var devname = node.attributes.text;
	/*				if (devname in this.status_windows) {
						this.status_windows[devname].show();
					} else {*/
						var win = new Pyfrid.StatusWindow({
									deviceName : devname,
									title : "Status for " + devname,
									router: this.router
								});
						//this.status_windows[devname] = win;
						/*win.on("beforeClose", 
						function() {
								delete(this.status_windows[win.devname]);
						}, this);*/
						win.show();
					//}
				}
			},
			updateData : function() {
				this.router.get_devices_data(function(tree) {
					        if (tree!==null) this.updateTree(tree);
						}, this);
			}
		});
