

Pyfrid.ScriptEditor=Ext.extend(Ext.Panel, {
	path: '',
	parser: 'python',
	sourceCode: '',
	fontSize: '14px',
	theme: 'eclipse',
	printMargin: false,
	highlightActiveLine: true,
	tabSize: 4,
	useSoftTabs: false,
	showInvisible: false,
	useWrapMode: false,
    
	initComponent:function(){
		this.editor=null;
		this.editorId=null;
		var me = this;
		Ext.apply(me, {
			layout: 'fit',
			border: false,
			items: new Ext.BoxComponent({autoEl: 'pre'}),
		});
		Pyfrid.ScriptEditor.superclass.initComponent.apply(this, arguments);
		me.addEvents('change');
		this.on("resize",function(){
			if(this.editor)
				this.editor.resize();
		}, this);
		this.on("activate", function(){
			if(this.editor)
				this.editor.focus();
		}, this);
		this.on("afterlayout", function(){this.initEditor()}, this);
		//this.on("afterlayout", function(){this.initEditor}, this);
	},
	
	initEditor: function()
	{
		if (this.editorId===null){
			this.editorId = this.items.keys[0];
			this.editor = ace.edit(this.editorId);
			this.setMode(this.parser);
			this.setTheme(this.theme);
			this.editor.getSession().setUseWrapMode(this.useWrapMode);
			this.editor.setShowInvisibles(this.showInvisible);
			this.setFontSize(this.fontSize);
			this.editor.setShowPrintMargin(this.printMargin);
			this.editor.setHighlightActiveLine(this.highlightActiveLine);
			this.editor.getSession().setTabSize(this.tabSize);
			this.editor.getSession().setUseSoftTabs(this.useSoftTabs);
			this.setValue(this.sourceCode);
			var me=this;
			this.editor.getSession().on('change', function()
			{
				me.fireEvent('change');
			}, me);
			this.editor.focus();
		}
	},

	setTheme: function(name)
	{
		// require("theme-" + name + ".js");
		this.editor.setTheme("ace/theme/" + name);
	},

	setMode: function(mode)
	{
		var Mode = require("ace/mode/" + mode).Mode;
		this.editor.getSession().setMode(new Mode());
	},

	getValue: function()
	{
		return this.editor.getSession().getValue();
	},

	setValue: function(value)
	{
		this.editor.getSession().setValue(value);
	},

	setFontSize: function(value)
	{
		this.editor.setFontSize(value);
	},

	undo: function()
	{
		this.editor.undo();
	},

	redo: function()
	{
		this.editor.redo();
	}
});
