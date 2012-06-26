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
    """A base class for the web router, a wrapper of an object which, when being called
    by specific request handler, first reads request attributes with the name of the method to be called and its arguments,
    checks the validity of these attributes, executes this method and returns its result.    
    """
    
    def __init__(self, obj):
        """Initializes web router with object *obj*, which is normally a command, device or a module."""
        self._obj=obj
        
    @property
    def obj(self):
        """Returns reference to the object."""
        return self._obj
        
    def exception_response(self, message, where):
        """Returns dictionary with exception information."""
        return {
            'type'    :'exception',
            'message' : message,
            'where'   : where
        }
        
    def __call__(self, request_handler, request):
        """Web router caller function.
        """
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
        """This function returns the static data of object interface.
        The static data is a dictionary with an information for object template, .js file."""
        return {}


@contextmanager
def authenticated(handler, appmod):
    """Context manager which checks if user, which info is in the request handler, is currently logged in."""
    login, _=handler.get_current_user()
    if login!=appmod.auth_module.current_login:
        raise Exception("You are not authenticated...")
    yield
            
            
class BaseObjectWebRouter(BaseWebRouter):
    """A base class of a web router for a command, a device or a module."""
    
    def __init__(self, *args, **kwargs):
        super(BaseObjectWebRouter, self).__init__(*args, **kwargs)
    
    def get_description(self, handler):
        """Returns object description"""
        return self.obj.descr
    
    def get_data(self,handler):
        """This is an abstract function which returns data corresponding to object."""
        pass


class BaseTreeWebRouter(BaseObjectWebRouter):
    """A base class of a special web router which returns tree data."""
    
    #: attribute which contains a description of trees types (class, iterator, root_name)
    trees_info=None
    
    def __init__(self, *args, **kwargs):
        super(BaseTreeWebRouter,self).__init__(*args, **kwargs)
        assert self.trees_info!=None, "None trees"
        assert type(self.trees_info)==ListType, "trees must have list type"
        self._trees=[]
        for klass, iterator, root_name in self.trees_info:
            self._trees.append(klass(self, iterator, root_name))
    
    def devices_iterator(self):
        """Standard iterator over all visible devices. The permission check also includes object alias."""
        for _,obj in self.obj.app.iterate_devices(permission=["view",self.obj.alias]):
            if obj.can(self.obj.alias):
                yield (obj.name,obj)
                
    def commands_iterator(self):
        """Standard iterator over all visible commands. The permission check also includes object alias."""
        for _,obj in self.obj.app.iterate_commands(permission=["view",self.obj.alias]):
            if obj.can(self.obj.alias):
                yield (obj.name,obj)
                
    def modules_iterator(self):
        """Standard iterator over all visible modules. The permission check also includes object alias."""
        for _,obj in self.obj.app.iterate_modules(permission=["view",self.obj.alias]):
            if obj.can(self.obj.alias):
                yield (obj.name,obj)
                
    def system_iterator(self):
        """Standard iterator over all visible system modules. The permission check also includes object alias."""
        for _,obj in self.obj.app.iterate_sysmods(permission=["view",self.obj.alias]):
            if obj.can(self.obj.alias):
                yield (obj.name,obj)
    
    def get_data(self,handler):
        """This function returns a result from all trees"""
        if len(self._trees)==1: return self._trees[0](False)
        res=[]
        for tr in self._trees:
            if len(tr.root): res.append(tr(True))
        return res
