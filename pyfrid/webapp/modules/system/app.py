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

from pyfrid.webapp.core.router import BaseObjectWebRouter, authenticated
from pyfrid.webapp.core.objtree import DevicePositionTree, ModuleStatusTree, BaseObjectTree

class InfoObjectNode(object):
    
    def __init__(self,obj):
        self.obj=obj
        
    def __call__(self):
        webclass=self.obj.__class__.__name__
        return {
             "name":self.obj.name,
             "alias": self.obj.alias,
             "webclass":  webclass,
             "type":"object"
        }

class InfoCommandNode(InfoObjectNode):
        
    def __call__(self):
        data=super(InfoCommandNode, self).__call__()
        data["type"]="command"
        return data

class InfoDeviceNode(InfoObjectNode):
        
    def __call__(self):
        data=super(InfoDeviceNode, self).__call__()
        data["type"]="device"
        return data

class InfoModuleNode(InfoObjectNode):
        
    def __call__(self):
        data=super(InfoModuleNode, self).__call__()
        data["type"]="module"
        return data
     
class InfoGroupNode(list):
    
    def __init__(self,name):
        self.name=name
                
    def __call__(self):
        _children=[item() for item in self]
        children=filter(lambda x: bool(x),_children)
        return {         
            "name":     self.name,
            "children": children,
            "type":     "group"
        }
    
class InfoCommandTree(BaseObjectTree):
    object_node=InfoCommandNode
    group_node=InfoGroupNode

class InfoDeviceTree(BaseObjectTree):
    object_node=InfoDeviceNode
    group_node=InfoGroupNode
    
class InfoModuleTree(BaseObjectTree):
    object_node=InfoModuleNode
    group_node=InfoGroupNode
    
class ApplicationWebRouter(BaseObjectWebRouter):
    """..."""
    
    def __init__(self, *args, **kwargs):
        super(ApplicationWebRouter, self).__init__(*args, **kwargs)
        self.devices_tree=DevicePositionTree(self, ApplicationWebRouter.devices_iterator)
        self.modules_tree=ModuleStatusTree(self, ApplicationWebRouter.modules_iterator)
        self.commands_info_tree = InfoCommandTree (self, ApplicationWebRouter.commands_menu_iterator )
        self.devices_info_tree  = InfoDeviceTree  (self, ApplicationWebRouter.devices_menu_iterator  )
        self.modules_info_tree  = InfoModuleTree  (self, ApplicationWebRouter.modules_menu_iterator  ) 
        
    def devices_iterator(self):
        for name,obj in self.obj.iterate_devices(permission="view", byname=True):
            yield (name,obj)
            
    def commands_iterator(self):
        for name,obj in self.obj.iterate_commands(permission="view", byname=True):
            yield (name,obj)
            
    def modules_iterator(self):
        for name,obj in self.obj.iterate_sysmods(permission="view", byname=True):
            yield (name, obj)
        for name,obj in self.obj.iterate_modules(permission="view", byname=True):
            yield (name, obj)
    
    def devices_menu_iterator(self):
        for name,obj in self.obj.iterate_devices(permission="view", byname=True):
            if getattr(obj, "webscript",None)!=None: yield (name,obj)
            
    def commands_menu_iterator(self):
        for name,obj in self.obj.iterate_commands(permission="view", byname=True):
            if getattr(obj, "webscript",None)!=None: yield (name,obj) 
            
    def modules_menu_iterator(self):
        for name,obj in self.obj.iterate_modules(permission="view", byname=True):
            if getattr(obj, "webscript",None)!=None: yield (name,obj) 
    
    def get_devices_data(self, handler):
        return self.devices_tree()
                    
    def get_modules_data(self, handler):
        return self.modules_tree()
        
    def get_log_data(self, handler):
        return self.obj.logger_module.get_messages()
    
    def get_device_status(self, handler, devname):
        dev=self.obj.get_device(devname, byname=True, exc=False)
        if dev!=None: return dev.call_status()
        
    def get_device_settings(self, handler, devname):
        dev=self.obj.get_device(devname, byname=True, exc=False)
        res=[]
        if dev!=None: 
            for sname, sobj in dev.iterate_settings(permission="get"):
                res.append((sname, getattr(dev, sname), sobj.units))
        return res
        
    def logout(self,handler):
        auth=handler.get_current_user()
        if self.obj.logout(*auth):
            handler.set_secure_cookie("user", "")
            handler.set_secure_cookie("pass", "")
            return True
        return False
    
    def login(self,handler,login,passw):
        if login==None: login,passw=handler.get_current_user()
        if self.obj.login(login,passw):
            handler.set_secure_cookie("user", login if login!=None else "")
            handler.set_secure_cookie("pass", passw if passw!=None else "")
            return True
        return False
    
    def stop(self,handler):
        with authenticated(handler, self.obj):
            self.obj.call_stop()
    
    def execute(self,handler, code):
        with authenticated(handler, self.obj):
            self.obj.execute_code(code)
        
    def validate(self,handler, code):
        with authenticated(handler, self.obj):
            self.obj.validate_code(code)
    
    def get_static_data(self):  
        return {
            "commandsinfo":self.commands_info_tree(),
            "devicesinfo": self.devices_info_tree(),
            "modulesinfo": self.modules_info_tree()
        }    
        