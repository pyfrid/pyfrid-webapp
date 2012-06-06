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
#

import os
import pyfrid

class WebRegistryError(Exception): pass    

class WebRegistry(object):
    
    def __init__(self, project_path):
        self._routers={}
        self._info={}
        self._scriptsbases=[]
        self._scripts=[]
        self._css=[]
        self._project_path=project_path
       
    def register(self, obj):
        router=getattr(obj, "webrouter", None)
        webscript=getattr(obj, "webscript", "")
        routerobj=None
        if router!=None:
            if obj.alias in self._routers:
                raise WebRegistryError("Duplicate object '{0}'".format(obj))
            try:
                routerobj=router(obj)
            except Exception, err:
                raise WebRegistryError("Error while creating router: {0}".format(err))
            else:
                self._routers[obj.alias]=routerobj
        if webscript:
            path1=os.path.join(pyfrid.__path__[0], "webapp", "static", "js", webscript)
            path2=os.path.join(self._project_path, "webapp", "static", "js", webscript)
            if os.path.exists(path2):
                webscript=path2
            elif os.path.exists(path1):
                webscript=path1
            else:
                raise WebRegistryError("script '{0}' was not found".format(webscript))
            self._scripts.append("script/{0}".format(obj.alias))
            self._append(self._scriptsbases, getattr(obj, "webbases", []))
            self._append(self._css, getattr(obj, "webcss", []))
            self._info[obj.alias]={
                                   "webscript":webscript,
                                   "webclass" :obj.__class__.__name__,
                                   "webdata"  : routerobj.get_static_data() if routerobj!=None else {}
                                  }
            
        
    def get_router(self, name, exc=False):
        try:
            return self._routers[name]
        except KeyError:
            if exc:
                raise WebRegistryError("no router was found for '{0}'".format(name))
            return None
       
    def get_info(self, name, exc=False):
        try:
            return self._info[name]
        except KeyError:
            if exc:
                raise WebRegistryError("no webinfo was found for '{0}'".format(name))
            return None
    
    def _append(self, holder, items=[]):
        if items:
            holder.extend([i for i in items if i not in holder])
    
    @property    
    def scripts(self):
        return self._scripts[:]
    
    @property
    def bases(self):
        return self._scriptsbases[:]
    
    @property
    def css(self):
        return self._css[:]
    
    def iterrouters(self):
        for name, router in self._routers.iteritems():
            yield(name, router)
            
    def clear(self):
        self._routers={}
        self._info={}
        self._scriptsbases=[]
        self._scripts=[]
        self._css=[]
           
        
        