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


from pyfrid.webapp.core.router import BaseTreeWebRouter
from pyfrid.webapp.core.objtree import BaseObjectTree, ObjectNode
from pyfrid.utils import format_value

class ObjectSettingsNode(ObjectNode):
    """..."""
    
    def __call__(self):
        data=super(ObjectSettingsNode,self).__call__()
        children=[{"id":"{0}_setting_node_{1}".format(self.obj.name,index),
                   "text": setname,
                   "value":format_value(getattr(self.obj, setname)),
                   "units":setobj.units,
                   "type":"setting-item",
                   "iconCls":"setting-item-icon",
                   "leaf":True, 
                  } 
                  for index,(setname,setobj) in enumerate(self.obj.iterate_settings(permission=["set","get"]))
        ]
        if not children: return None
        data["value"]    = ""
        data["units"]    = ""
        data["children"] = children
        data["leaf"]     = False
        data["expanded"] = False
        return data

class ObjectSettingsTree(BaseObjectTree):
    object_node=ObjectSettingsNode

class SetCommandWebRouter(BaseTreeWebRouter):
    
    def devices_iterator(self):
        for _,obj in self.obj.app.iterate_devices(permission=["view",self.obj.alias]):
            yield (obj.name,obj)
                
    def commands_iterator(self):
        for _,obj in self.obj.app.iterate_commands(permission=["view",self.obj.alias]):
            yield (obj.name,obj)
                
    def modules_iterator(self):
        for _,obj in self.obj.app.iterate_modules(permission=["view",self.obj.alias]):
            yield (obj.name,obj)
            
    trees_info=[
                (ObjectSettingsTree,  devices_iterator,  "Devices"),
                (ObjectSettingsTree,  commands_iterator, "Commands"),
                (ObjectSettingsTree,  modules_iterator,  "Modules")
               ]
                    