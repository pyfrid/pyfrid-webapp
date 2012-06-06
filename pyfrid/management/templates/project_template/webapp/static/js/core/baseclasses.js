Ext.ns("Pyfrid");
Ext.ns("Pyfrid.router");

var noeditNodeTypes = {
	"group" : 0
};
var objectNodeTypes = {
	"device" :  0,
	"command" : 1,
	"module" :  2,
	"object" :  3
};

var BaseAbstractObjectInterface = function() {} // abstract class

Ext.apply(BaseAbstractObjectInterface.prototype, {
	objname :"",
	router:null,
	updateData : function() {
	},
	clearData : function() {
	}
});

var BaseAbstractCommandInterface = function() {
} // abstract class

Ext.apply(BaseAbstractCommandInterface.prototype, {
	generateCommand : function() {}
});

Ext.applyIf(BaseAbstractCommandInterface.prototype,
		BaseAbstractObjectInterface.prototype);

Pyfrid.BaseCommandInterface = Ext.extend(Ext.Panel, {
	initComponent : function() {
		Pyfrid.BaseCommandInterface.superclass.initComponent.apply(this, arguments);
		this.addEvents('cmdchanged');
	}
});

Ext.applyIf(Pyfrid.BaseCommandInterface.prototype, BaseAbstractCommandInterface.prototype);		
		
var BaseAbstractDeviceInterface = function() {} // abstract class

Ext.applyIf(BaseAbstractDeviceInterface.prototype,
		BaseAbstractObjectInterface.prototype);

Pyfrid.BaseDeviceInterface = Ext.extend(Ext.Panel, {
	initComponent : function() {
		Pyfrid.BaseDeviceInterface.superclass.initComponent.apply(this,
				arguments);
	}
});

Ext.applyIf(Pyfrid.BaseDeviceInterface.prototype, BaseAbstractDeviceInterface.prototype);

var BaseAbstractModuleInterface = function() {} // abstract class

Ext.applyIf(BaseAbstractModuleInterface.prototype,
		BaseAbstractObjectInterface.prototype);

Pyfrid.BaseModuleInterface = Ext.extend(Ext.Panel, {
	initComponent : function() {
		Pyfrid.BaseModuleInterface.superclass.initComponent.apply(this,arguments);
	}
});

Ext.applyIf(Pyfrid.BaseModuleInterface.prototype, BaseAbstractModuleInterface.prototype);

Pyfrid.TreeFilter = Ext.extend(Ext.tree.TreeFilter, {
	filterBy : function(fn, scope, startNode) {
		startNode = startNode || this.tree.root;
		if (this.autoClear) {
			this.clear();
		}
		var af = this.filtered, rv = this.reverse;
		var f = function(n) {
			if (n === startNode) {
				return true;
			}
			if (af[n.id]) {
				return false;
			}
			var m = fn.call(scope || n, n);
			if (!m || rv) {
				var p = n.parentNode;
				if ((p == startNode) || (p.id in af)) {
					af[n.id] = n;
					n.ui.hide();
				}
				return true;
			} else {
				n.ui.show();
				var p = n.parentNode;
				while (p && p !== this.root) {
					p.ui.show();
					p = p.parentNode;
				}
				return true;
			}
			return true;
		};
		startNode.cascade(f);
		if (this.remove) {
			for (var id in af) {
				if (typeof id != "function") {
					var n = af[id];
					if (n && n.parentNode) {
						n.parentNode.removeChild(n);
					}
				}
			}
		}
	}

});

Pyfrid.BaseTreeGridPanel = Ext.extend(Ext.ux.tree.TreeGrid, {
	initComponent : function() {
		this.filter = new Pyfrid.TreeFilter(this);
		this.filterField = new Ext.form.TextField();
		this.clearFilterBtn = new Ext.Button({
			text : '',
			iconCls : 'clear-filter-icon'
		});
		Ext.apply(this, {
					lines : false,
					columnResize : true,
					enableSort : false,
					enableHdMenu : false,
					autoScroll : false,
					animate : false,
					rootVisible : false,
					useArrows : true,
					reserveScrollOffset : false,
					loader : null,
					root : new Ext.tree.AsyncTreeNode(),
					tbar : new Ext.Toolbar({
								scope : this,
								defaults : {
									scope : this
								},
								items : [this.filterField,
										this.clearFilterBtn, '-', {
											text : '',
											handler : this.expandAll,
											iconCls : "expand-all-icon"
										}, {
											text : '',
											handler : this.collapseAll,
											iconCls : "collapse-all-icon"
										}

								]
							}),
					columns : [{
								header : 'Name',
								dataIndex : 'text',
								width : 150
							}, {
								header : 'Value',
								width : 90,
								dataIndex : 'value',
								align : 'center',
							}, {
								header : 'Units',
								width : 40,
								dataIndex : 'units'
							}]
				});
		Pyfrid.BaseTreeGridPanel.superclass.initComponent.apply(
				this, arguments);

		this.filterField.on("valid", function() {
					var val = this.filterField.getRawValue();
					var re = new RegExp('.*' + val + '.*', 'i');
					this.filter.clear();
					this.filter.filter(re, "text");
				}, this);
		this.clearFilterBtn.on("click", function() {
					this.filter.clear();
					this.filterField.setValue("");
				}, this);
	},
	getNodeValue : function(node, colindex) {
		var el = node.ui.getEl().firstChild;
		var cells = el.childNodes;
		return cells[colindex].firstChild.innerHTML;
	},
	setNodeValue : function(node, colindex, value) {
		var el = node.ui.getEl().firstChild;
		var cells = el.childNodes;
		return cells[colindex].firstChild.innerHTML = value;
	},
	updateTree: function(tree){
		if (this.root.childNodes.length == 0) {
						var root = new Ext.tree.AsyncTreeNode({
									expanded : true,
									children : tree
								});
						this.setRootNode(root);
					} else
						this.updateNode(this.root, tree);
	},
	updateNode : function(node, tree) {
		for (var i = 0; i < node.childNodes.length; i++) {
			var child = node.childNodes[i];
			child.attributes.value = tree[i].value;
			child.attributes.units = tree[i].units;
			child.attributes.iconCls = tree[i].iconCls;
			this.refreshNodeColumns(child);
			trch = tree[i].children != null ? tree[i].children : [];
			this.updateNode(child, trch);
		}
	},
	refreshNodeColumns : function(n) {
		var t = n.getOwnerTree();
		var a = n.attributes;
		var cols = t.columns;
		var el = n.ui.getEl().firstChild; // <div class="x-tree-el">
		var cells = el.childNodes;
		for (var i = 1, len = cols.length; i < len; i++) {
			var d = cols[i].dataIndex;
			var v = (a[d] != null) ? a[d] : '';
			if (cols[i].renderer) v = cols[i].renderer(v);
			cells[i].firstChild.innerHTML = v;
		}
	},
	restoreNode: function(node){
       for (var i=0;i<node.childNodes.length;i++){
    	   var child=node.childNodes[i];
		   this.refreshNodeColumns(child);
    	   this.restoreNode(child,trch);
       }       
	}
});

Pyfrid.BaseTreePanel = Ext.extend(Ext.tree.TreePanel, {
	initComponent : function() {
		this.selected_nodes = [];
		this.filter = new Pyfrid.TreeFilter(this);
		this.filterField = new Ext.form.TextField();
		this.clearFilterBtn = new Ext.Button({
			text : '',
			iconCls : 'clear-filter-icon'
		});
		Ext.apply(this, {
			autoScroll : true,
			animate : false,
			rootVisible : false,
			useArrows : true,
			reserveScrollOffset : false,
			loader : null,
			root : new Ext.tree.AsyncTreeNode(),
			tbar : new Ext.Toolbar({
				scope : this,
				defaults : {
					scope : this
				},
				items : [this.filterField,
						this.clearFilterBtn, '-', {
							text : '',
							handler : this.expandAll,
							iconCls : "expand-all-icon"
						}, {
							text : '',
							handler : this.collapseAll,
							iconCls : "collapse-all-icon"
						}

				]

			})
		});
		Pyfrid.BaseTreePanel.superclass.initComponent.apply(this, arguments);
		this.on("checkchange", function(node, checked) {
			if (checked) {
				this.selected_nodes.push(node.attributes.text);
			} else {
				var i = this.selected_nodes.indexOf(node.attributes.text);
				if (i >= 0)
					this.selected_nodes.splice(i, 1);
			}
			this.fireEvent("cmdchanged", this.generateCommand());
		});
		this.filterField.on("valid", function() {
			var val = this.filterField.getRawValue();
			var re = new RegExp('.*' + val + '.*', 'i');
			this.filter.clear();
			this.filter.filter(re, "text");
		}, this);
		this.clearFilterBtn.on("click", function() {
			this.filter.clear();
			this.filterField.setValue("");
		}, this);
	},
	updateTree: function(tree){
		var root = new Ext.tree.AsyncTreeNode({
			expanded : true,
			children : tree
		});
		this.setRootNode(root);
	},
	uncheckNode : function(node) {
		for (var i = 0; i < node.childNodes.length; i++) {
			node.childNodes[i].ui.toggleCheck(false);
			this.uncheckNode(node.childNodes[i]);
		}
	}
});

Pyfrid.BaseTreeCommandInterface = Ext.extend(Pyfrid.BaseTreePanel, {
	initComponent : function() {
		Pyfrid.BaseTreeCommandInterface.superclass.initComponent.apply(this, arguments);
		this.addEvents('cmdchanged');
	},
	updateData : function() {
		this.router.get_data(function(tree) {
			if (tree!=null) this.updateTree(tree);
		}, this);
	},
	generateCommand : function() {
		cmd = '';
		for (var i = 0; i < this.selected_nodes.length; i++) {
			var name = this.selected_nodes[i];
			cmd += ' ' + name;
		}
		if (cmd != '') {
			return this.objname + ' ' + cmd;
		}
		return '';
	},
	clearCommand:function(){
		this.selected_nodes = [];
		this.uncheckNode(this.root);
	}
});

Ext.applyIf(Pyfrid.BaseTreeCommandInterface.prototype, Pyfrid.BaseCommandInterface.prototype);
	
Pyfrid.BaseTreeGridCommandInterface = Ext.extend(Pyfrid.BaseTreeGridPanel, {
	editorField:new Ext.form.TextField({
		
	}),
	initComponent : function() {
		this.edited_nodes = {};
		this.selected_node = null;
		this.editor = new Ext.Editor(this.editorField,{
			scope : this,
			listeners : {
				scope : this,
				complete : this.editorComplete
			},
			autoSize : true,
			shadow : false,
			completeOnEnter : true,
			cancelOnEsc : true,
			updateEl : true,
			ignoreNoChange : true
		});
		
		Pyfrid.BaseTreeGridCommandInterface.superclass.initComponent.apply(this,arguments);
		this.on('afterrender', this.initEditor);
		this.addEvents('cmdchanged');
	},
	initEditor:function(){
		this.on('click', function(node, e) {
				if (!(node.attributes.type in noeditNodeTypes)) {
					this.selected_node = node.attributes.id;
					var el = node.ui.getEl().firstChild;
					var cells = el.childNodes;
					this.editor.startEdit(cells[1].firstChild);
				}
			}, this);
		this.innerBody.on('scroll', function() {
					this.editor.cancelEdit();
			}, this);
	},
	editorComplete:function(ed, value, oldValue) {
		if (this.selected_node != null) {
			this.edited_nodes[this.selected_node] = value;
			this.fireEvent("cmdchanged", this.generateCommand());
			this.selected_node = null;
		}
	},
	generateCommand : function() {
		cmd = '';
		for (var id in this.edited_nodes) {
			node = this.getNodeById(id);
			if (node)
				cmd += ' ' + node.attributes.text + ' ' + this.edited_nodes[id];
		}
		if (cmd != '') {
			return this.objname + ' ' + cmd;
		}
		return cmd;
	},
	clearCommand : function() {
		this.selected_node_id = null;
		this.edited_nodes = [];
		this.restoreNode(this.root);
	},
	updateData:function(){
    	this.router.get_data(function(tree){
    		this.updateTree(tree);
    	},this);
    }

});

Ext.applyIf(Pyfrid.BaseTreeGridCommandInterface.prototype, Pyfrid.BaseCommandInterface.prototype);

Pyfrid.BaseTreeGridManager = Ext.extend(Pyfrid.BaseTreeGridPanel, {
	updateData:function(){
    	this.router.get_data(function(tree){
    		this.updateTree(tree);
    	},this);
    }

});

Pyfrid.CascadeWindow = Ext.extend(Ext.Window, {
	cascadeOnFirstShow : true,
	beforeShow : function() {
		delete this.el.lastXY;
		delete this.el.lastLT;
		if (this.x === undefined || this.y === undefined) {
			var xy = this.el.getAlignToXY(this.container, 'c-c');
			var pos = this.el.translatePoints(xy[0], xy[1]);
			this.x = this.x === undefined ? pos.left : this.x;
			this.y = this.y === undefined ? pos.top : this.y;
			if (this.cascadeOnFirstShow) {
				var prev;
				this.manager.each(function(w) {
					if (w == this) {
						if (prev) {
							var o = (typeof this.cascadeOnFirstShow == 'number')
									? this.cascadeOnFirstShow
									: 20;
							var p = prev.getPosition();
							this.x = p[0] + o;
							this.y = p[1] + o;
						}
						return false;
					}
					if (w.isVisible())
						prev = w;
				}, this);
			}
		}
		this.el.setLeftTop(this.x, this.y);

		if (this.expandOnShow) {
			this.expand(false);
		}

		if (this.modal) {
			Ext.getBody().addClass("x-body-masked");
			this.mask.setSize(Ext.lib.Dom.getViewWidth(true), Ext.lib.Dom.getViewHeight(true));
			this.mask.show();
		}
	}
});

Pyfrid.PollingWindow = Ext.extend(Pyfrid.CascadeWindow, {
	interval: 2000,
	router:null,
	updateFn:null,
	initComponent : function() {
		Pyfrid.PollingWindow.superclass.initComponent.apply(this,arguments);
		this.on("show", function(this_window){Ext.TaskMgr.start(this_window.update_task);});
		this.on("close", function(this_window){Ext.TaskMgr.stop(this_window.update_task);});
		this.update_task = {
			scope : this,
			run : this.updateFn,
			interval : this.interval
		}
	}
});
