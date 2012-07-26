#  Copyright 2012 Denis Korolkov
#
#   Licensed under the Apache License, Version 2.0 (the "License");
#   you may not use this file except in compliance with the License.
#   You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#   Unless required by applicable law or agreed to in writing, software
#   distributed under the License is distributed on an "AS IS" BASIS,
#   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#   See the License for the specific language governing permissions and
#   limitations under the License.


import traceback
from pyfrid.utils import format_value

class ObjectTreeException(Exception): pass

class GroupNode(list):
    """A class for group tree node. Being called it returns the following dictionary::
    
                    {
                    "id":"{0}_group_node".format(self.name),         
                    "text":     self.name,
                    "children": children,
                    "type":     "group",
                    "leaf":     False,
                    "expanded": True,
                    "iconCls": "default-group-icon",
                    "cls": "default-group-cls"
                    },
    where *children* is a list of all nodes which belong to this group including other groups too.
    """
    
    def __init__(self, name):
        """initializes group object with the name *name*."""
        self.name=name
                
    def __call__(self):
        _children=[item() for item in self]
        children=filter(lambda x: bool(x),_children)
        return {
                    #"id":"{0}_group_node".format(self.name),         
                    "text":     self.name,
                    "children": children,
                    "type":     "group",
                    "leaf":     False,
                    "expanded": True,
                    "iconCls": "default-group-icon",
                    "cls": "default-group-cls"
        }

    
class ObjectNode(object):
    """A default class for any object. Its caller returns the following dictionary::
    
             {
             "id":"{0}_object_node".format(self.obj.alias),
             "group":getattr(self.obj, "group", ""),
             "text":self.obj.name,
             "type":"object",
             "leaf":True,
             "checked":False,
             "iconCls": "default-object-icon",
             "cls": "default-object-cls"
             }
     """
    def __init__(self,obj):
        """initializes node object with *obj* attribute which is a reference to a command, a device or a module"""
        self.obj=obj
        
    def __call__(self):
        return {
             "id":"{0}_object_node".format(self.obj.alias),
             "group":getattr(self.obj, "group", ""),
             "text":self.obj.name,
             "type":"object",
             "leaf":True,
             "checked":False,
             "iconCls": "default-object-icon",
             "cls": "default-object-cls" 
        }  
    
class CommandNode(ObjectNode):
    """A class for a  command node. Its caller executes *ObjectNode* caller function and changes several attributes. """
    
    def __call__(self):
        data=super(CommandNode,self).__call__()
        data["id"]="{0}_command_node".format(self.obj.alias),
        data["type"]="command"
        data["iconCls"]= "default-command-icon"
        data["cls"]    = "default-command-cls"
        return data
    
    
class DeviceNode(ObjectNode):
    """A class for a  device node. Its caller executes *ObjectNode* caller function and changes several attributes. """
    
    def __call__(self):
        data=super(DeviceNode,self).__call__()
        data["id"]="{0}_device_node".format(self.obj.alias),
        data["type"]="device"
        data["iconCls"]= "default-device-icon"
        data["cls"]    = "default-device-cls"
        return data

class ModuleNode(ObjectNode):
    """A class for a module node. Its caller executes *ObjectNode* caller function and changes several attributes. """
    
    def __call__(self):
        data=super(ModuleNode,self).__call__()
        data["type"]="module"
        data["iconCls"]= "default-module-icon"
        data["cls"]    = "default-module-cls" 
        return data        

class DevicePositionNode(DeviceNode):
    """This node is used by device manager router. The caller function returns additionally to a *DeviceNode* caller
    current position and units"""
    
    def __call__(self):
        data=super(DevicePositionNode,self).__call__()
        pos=self.obj.call_position()
        data["units"]=self.obj.units
        data["value"]=format_value(pos)
        return data    
    
class ModuleStatusNode(ModuleNode):
    """A class for a module status used by modules-manager router. Its caller parses a module status and adds it to returned dictionary."""
    
    def __call__(self):
        data=super(ModuleStatusNode,self).__call__()
        status=self.obj.call_status()
        if not status: return None
        data["children"]=[{"id":"{0}_{1}".format(data["id"],index),
                           "text":item[0],
                           "value":format_value(item[1], string_qoutes=False),
                           "units":item[2],
                           "leaf":True,
                           "iconCls":"module-status-icon"
                           } for index,item in enumerate(status)
                        ]
        data["leaf"]=False
        data["expanded"]=True 
        return data    

     
class BaseObjectTree(object):
    """This is a base class for trees."""
    
    #: used node class for objects
    object_node = ObjectNode
    
    #: used node class for groups
    group_node   = GroupNode
    
    
    def __init__(self, instance, iterator, root_name="root"):
        """..."""
        self.root_name=root_name
        self.root=None
        self._instance=instance
        self._iterator=iterator
        self.init_tree()
    
    def init_tree(self):
        """..."""
        self.root=self.group_node(self.root_name)
        for _, obj in self._iterator(self._instance):
            group=getattr(obj,"group","")
            if not group: 
                self.root.append(self.object_node(obj))
            else:
                grlist=group.strip().split("/")
                root=None
                try:
                    node=self.object_node(obj)
                    cl=node()
                    if cl!=None:
                        for gr in grlist:
                            parent=self.lookup_group(gr, root)
                            if parent==None: root=self.add_group(gr,root)
                            else: root=parent
                        root=root if root!=None else self.root        
                        root.append(node)
                except Exception:
                    traceback.print_exc()
                    raise
                
    def lookup_group(self,name,root=None):
        """..."""
        root=self.root if root==None else root
        if isinstance(root,self.group_node):
            if root.name==name:
                return root
            else:
                for leaf in root:
                    node=self.lookup_group(name, leaf)
                    if node: return node
        return None
                        
    def add_group(self,name,root=None):
        """..."""
        root=self.root if root==None else root
        n=self.group_node(name)
        if n!=None: root.append(n)
        return n 
                
    def __call__(self,root=False):
        """..."""
        tree=self.root()
        if not root:
            return tree["children"]
        else:
            return tree
        
class DeviceObjectTree(BaseObjectTree):
    """..."""
    object_node=DeviceNode

class CommandObjectTree(BaseObjectTree):
    """..."""
    object_node=CommandNode
    
class ModuleObjectTree(BaseObjectTree):
    """..."""
    object_node=ModuleNode

class DevicePositionTree(BaseObjectTree):
    """..."""
    object_node=DevicePositionNode

class ModuleStatusTree(BaseObjectTree):
    """..."""
    object_node=ModuleStatusNode

    