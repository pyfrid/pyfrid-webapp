Pyfrid.OpenDialog= Ext.extend(Pyfrid.CascadeWindow, {
	openFn: null,
	initComponent: function() {
	    this.store = new Ext.data.ArrayStore({
	        fields: [
	           {name: 'file'},
	           {name: 'date'},
	        ]
	    });
	    // create the Grid
	    this.grid = new Ext.grid.GridPanel({
	    	scope:this,
	        store: this.store,
	        columns: [
	            {header: 'Filename', width: 300, sortable: true, dataIndex: 'file'},
	            {header: 'Date', width: 100, sortable: true,  dataIndex: 'date'}
	        ],
	        title: ''   
	    });
	    var openBtn=new Ext.Button({text:"Open",handler:this.openMacro,scope:this});
	    var cancelBtn=new Ext.Button({text:"Cancel",handler:this.close,scope:this});
	    Ext.apply(this,{
	    	layout: 'fit',
	    	items:this.grid,
	    	width: 450,
	    	height: 300,
	    	buttons:[openBtn,cancelBtn],
	    	title: "Open macro..."
	    });
		Pyfrid.OpenDialog.superclass.initComponent.apply(this, arguments);
		this.addEvents("fileselected");
	},
	onShow:function(){
	    Pyfrid.OpenDialog.superclass.onShow.apply(this, arguments);
	    if (this.openFn!==null)
	        this.openFn(function(resp){
	        	this.store.loadData(resp);
	        },this);
	},
	openMacro:function(){
		var record=this.grid.getSelectionModel().getSelected();
		if (record!==null){
        	this.fireEvent("fileselected",record.data.file);
        	this.close();
        }
	}
});

Pyfrid.{{webclass}}= Ext.extend(Pyfrid.BaseCommandInterface, {
    defaultFilename:"untitled.m",
	initComponent:function() {
	    this.macroEdited=false;
	    this.filenameItem=new Ext.Toolbar.TextItem();
            this.filename='';
	    this.editor=new Pyfrid.ScriptEditor({
	    	id:"macro-editor",
	    	sourceCode:''
	    });
        this.openMacroBtn=new Ext.Button({
        	text: "Open",
	    	scope: this,
	    	iconCls:'open-macro-icon',
	    	handler: this.openMacro
	    });  
	    this.saveMacroBtn=new Ext.Button({
	    	text: "Save",
	    	scope: this,
	    	iconCls:'save-macro-icon',
	    	handler: this.saveMacro
	    });
	    this.newMacroBtn=new Ext.Button({
	    	text: "New",
	    	scope: this,
	    	iconCls:'new-macro-icon',
	    	handler: this.newMacro
	    });
	    this.undoBtn=new Ext.Button({
	    	text: "Undo",
	    	scope: this,
	    	iconCls:'undo-macro-icon',
	    	handler: this.undoMacro
	    });
	    this.redoBtn=new Ext.Button({
	    	text: "Redo",
	    	scope: this,
	    	iconCls:'redo-macro-icon',
	    	handler: this.redoMacro
	    });
	    Ext.apply(this,{
	    	layout:'fit',
	    	enableKeyEvents: true,
	    	items: [this.editor],
	    	tbar: new Ext.Toolbar({
	    		items: [this.newMacroBtn, this.openMacroBtn, this.saveMacroBtn,"-",this.undoBtn, this.redoBtn]
	    	}),
	    	bbar: new Ext.Toolbar({items:[this.filenameItem]})
	    });
		Pyfrid.{{webclass}}.superclass.initComponent.apply(this, arguments);
		
		this.addEvents("macrosaved","macrochanged","macroopened","macronew");
        this.setFilename(this.defaultFilename);
		this.editor.on("change",function(){
			this.fireEvent("macrochanged");
		},this);
		this.on("macrosaved",this.onMacroSaved,this);
		this.on("macrochanged",this.onMacroChanged,this);
		this.on("macroopened",this.onMacroOpened,this);
		this.on("macronew",this.onMacroNew,this);
		this.saveMacroBtn.disable();
   },
   onMacroChanged:function(){
   		this.macroEdited=true;
	    this.saveMacroBtn.enable();
	    this.fireEvent("cmdchanged","");
   },
   onMacroSaved:function(fn){
        this.setFilename(fn);
   		this.macroEdited=false;
	    this.saveMacroBtn.disable();
	    this.fireEvent("cmdchanged",this.generateCommand());
   },
   onMacroOpened:function(fn){
   	   this.setFilename(fn);
   	   this.macroEdited=false;
   	   this.saveMacroBtn.disable();
   	   this.fireEvent("cmdchanged",this.generateCommand());
   },
   onMacroNew:function(){
       this.setFilename(this.defaultFilename);
   	   this.macroEdited=false;
   	   this.saveMacroBtn.disable();
   	   this.fireEvent("cmdchanged","");
   },
   openMacro:function(){
        if (this.macroEdited)
			Ext.Msg.show({
			    scope:this,
   				title:'Save Changes?',
   				msg: 'You are closing a macro that has unsaved changes. Would you like to save your changes?',
   				buttons: Ext.Msg.YESNO,
   				fn: function(btn){
   					if (btn=="yes") {
   						this.saveMacro();
   					}
   				},
   				icon: Ext.MessageBox.QUESTION
			});
		else{
			this.openMacroDialog();
		}
   		
   },
   openMacroDialog:function(){
   	  var w=new Pyfrid.OpenDialog({scope:this,openFn:this.router.get_macro_list, title: "Choose macro..."});
   	  w.on("fileselected",this.loadMacro,this);
   	  w.show();
   },
   loadMacro:function(fn){
		if (fn!='')
			this.router.open_macro(fn,function(resp){
        		this.editor.setValue(resp);
        		this.fireEvent("macroopened",fn);
        	},this);
   },
   saveMacroPrompt:function(){
   		 	Ext.Msg.prompt('Save', 'Please enter filename:', function(btn, fn){
    		 		if (btn == 'ok'){
    		    		this.saveMacroIfExist(fn);	
    		 		}
                  },this);
   },
   saveMacro:function(){
                if (this.filename!=this.defaultFilename)
                    this.saveMacroIfExist(this.filename);
                else
   		    this.saveMacroPrompt();
   },		    
   saveMacroIfExist:function(fn){
    		    this.router.macro_exist(fn,function(resp){
    		    	if (resp){
    		    		Ext.Msg.show({
						    scope:this,
			   				title:'Overwrite?',
			   				msg: 'Macro exists. Would you like to overwrite?',
			   				buttons: Ext.Msg.YESNO,
			   				fn: function(btn){
			   					if (btn=="no") {
			   						this.saveMacroPrompt();
			   					}
			   					else
			   						this.saveRequest(fn);
			   				},
			   				icon: Ext.MessageBox.QUESTION
						});
    		    	}
    		    	else
    		    		this.saveRequest(fn);
    		    },this);
   },
   saveRequest:function(fn){
   		var code=this.editor.getValue();
		this.router.save_macro(fn, code, function(resp){
			if (resp!==null){
				this.fireEvent("macrosaved",fn);
			}
		},this);
   },
   newMacro:function(){
   	   if (this.macroEdited)
			Ext.Msg.show({
			    scope:this,
   				title:'Save Changes?',
   				msg: 'You are closing a macro that has unsaved changes. Would you like to save your changes?',
   				buttons: Ext.Msg.YESNO,
   				fn: function(btn){
   					if (btn=="no") {
   						this.editor.setValue('');
   						this.fireEvent("macronew");
   					}
   					else
   						this.saveMacro();
   				},
   				icon: Ext.MessageBox.QUESTION
			});
		else{
			this.editor.setValue('');
   			this.fireEvent("macronew");
		}
			
   },
   setFilename:function(fn){
        this.filename=fn;
   		this.filenameItem.setText("Filename: "+fn);
   		this.fireEvent("cmdchanged",this.generateCommand(),this);
   },
   generateCommand:function(){
    	if (this.filename!=this.defaultFilename)
   			return "macro "+"\""+this.filename+"\"";
   		return '';
   },
   clearCommand:function(){
   },
   undoMacro:function(){
   		this.editor.undo();
   },
   redoMacro:function(){
   		this.editor.redo();
   }
});
