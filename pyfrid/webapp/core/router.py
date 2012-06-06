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

from types import ListType
from contextlib import contextmanager
                      
class BaseWebRouter(object):    
    
    def __init__(self, obj):
        self._obj=obj
        
    @property
    def obj(self):
        return self._obj
        
    def exception_response(self, message, where):
        return {
            'type'    :'exception',
            'message' : message,
            'where'   : where
        }
        
    def __call__(self, request_handler, request):
        # Decode the request data
        tid=request.get('tid',"")
        action = request.get('action',"")
        method = request.get('method',"")
        data   = request.get('data')
        if not method:
            return self.exception_response("no method specified for action '{0}'".format(action), "router call")
        try:
            _targetfn = getattr(self, method)
        except AttributeError:
            return self.exception_response("unknown method '{0}' for action '{1}'".format(method, action), "router call")
        if data is None: data=[]
        # Finally, call the target method, passing in the data
        result=None
        try:
            result = _targetfn(request_handler,*data)
        except Exception, err:
            return self.exception_response(str(err), "router call") 
        return {
            'type'  :'rpc',
            'tid'   : tid,
            'action': action,
            'method': method,
            'result': result
        }
        
    def get_static_data(self):
        return {}


@contextmanager
def authenticated(handler, appmod):
    login, _=handler.get_current_user()
    if login!=appmod.auth_module.current_login:
        raise Exception("You are not authenticated...")
    yield
            
class BaseObjectWebRouter(BaseWebRouter):
    
    def __init__(self, *args, **kwargs):
        super(BaseObjectWebRouter, self).__init__(*args, **kwargs)
    
    def get_description(self, handler):
        return self.obj.descr
    
    def get_data(self,handler):
        pass

class BaseTreeWebRouter(BaseObjectWebRouter):
    
    trees_info=None
    
    def __init__(self,*args, **kwargs):
        super(BaseTreeWebRouter,self).__init__(*args, **kwargs)
        assert self.trees_info!=None, "None trees"
        assert type(self.trees_info)==ListType, "trees must have list type"
        self._trees=[]
        for klass, iterator, root_name in self.trees_info:
            self._trees.append(klass(self, iterator, root_name))
    
    def devices_iterator(self):
        for _,obj in self.obj.app.iterate_devices(permission=["view",self.obj.alias]):
            if obj.can(self.obj.alias):
                yield (obj.name,obj)
                
    def commands_iterator(self):
        for _,obj in self.obj.app.iterate_commands(permission=["view",self.obj.alias]):
            if obj.can(self.obj.alias):
                yield (obj.name,obj)
                
    def modules_iterator(self):
        for _,obj in self.obj.app.iterate_modules(permission=["view",self.obj.alias]):
            if obj.can(self.obj.alias):
                yield (obj.name,obj)
                
    def system_iterator(self):
        for _,obj in self.obj.app.iterate_sysmods(permission=["view",self.obj.alias]):
            if obj.can(self.obj.alias):
                yield (obj.name,obj)
    
    def get_data(self,handler):
        if len(self._trees)==1: return self._trees[0](False)
        res=[]
        for tr in self._trees:
            if len(tr.root): res.append(tr(True))
        return res
