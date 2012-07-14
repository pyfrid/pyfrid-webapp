Pyfrid.LogManagerStore=Ext.extend(Ext.data.GroupingStore,{
	addRecords:function(data){
		if (data!==null){
			this.loadData({results:data.length, rows:data},true);
			var sortState = this.getSortState();  
	        this.sort('time', 'DESC'); 
	        if (this.getCount() > 100) { 
	            // Find the index of the oldest (max) record. 
	            var maxIdx = this.getCount()-1; 
	            var newCnt = this.reader.jsonData.results; 
	            for (idx = maxIdx; idx > (maxIdx - newCnt); idx--) { 
	                this.remove(this.getAt(idx)); 
	            } 
	        } 
	        if ( (sortState.field != 'time') || (sortState.direction != 'DESC') ) { 
	            this.sort(sortState.field, sortState.direction);             
	        } 
		}
	}
});

Pyfrid.LogManager = Ext.extend(Ext.grid.GridPanel, {
	initComponent:function(){
		this.store=new Pyfrid.LogManagerStore({
			remoteSort:false, 
	        sortInfo:{field:'time', direction:'DESC'}, 
	        reader: new Ext.data.JsonReader({ 
	            totalProperty: "results", 
	            root: "rows",
	            fields:[
	                {name:'time'}, 
	                {name:'level'}, 
	                {name:'object'}, 
	                {name:'message'} 
	            ] 
	        }) 
		});
	
	    var cm = new Ext.grid.ColumnModel([ 
	        { header:"Time", dataIndex: 'time', width:100, renderer: this.convertTime        },
	        { header:"Level", dataIndex: 'level', width:55       }, 
	        { header:"Object", dataIndex: 'object', width:100    }, 
	        { header:"Message", width:500,  dataIndex: 'message',
		        renderer: function (val,meta, record) { 
	                      //v : value , p : cell 
	                      //var obj = record.data.object;
						  //var msg = record.data.message;
						  //var tip = 'Object: '+obj+'<br />';
						  //tip += '<br />';
						  //tip += 'Message: '+Ext.util.Format.nl2br(msg)+'<br />';
						//meta.attr = 'ext:qtip="'+tip+'" ext:qtitle="Formatted message"';
						meta.css="log-"+record.data.level;
						return val;
		        }
	        }
	    ]);
                   
	    cm.defaultSortable = true; 
	 
	    var gridView = new Ext.grid.GroupingView({}); 
	     
		Ext.apply(this,{
			region: 'south',
	        split: true,
	        height: 100,
	        collapsible: false,
	        title: 'Output',
	        frame: false,
			ds: this.store, 
        	cm: cm, 
        	title: 'Log Viewer',
        	autoExpandColumn: 3, 
        	view: gridView,
        	margins:'3 0 3 3',
            cmargins:'3 3 3 3'
		});
		
		Pyfrid.LogManager.superclass.initComponent.apply(this, arguments);
		
	},
	convertTime:function(value, metadata, record){
		return Date(value).toString();
	},
	addMessage:function(data){
		this.store.addRecords([data]);
	},
	setMessages:function(data){
		this.store.addRecords(data);
	},
	
});
