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
import os
import stat
import time
from pyfrid.webapp.core.router import BaseObjectWebRouter, authenticated
    
class MacroCommandWebRouter(BaseObjectWebRouter):
    
    def get_macro_list(self, handler):
        with authenticated(handler, self.obj.app):
            curdir=self.obj.macropath
            file_list=[]
            for fn in os.listdir(curdir):
                path=os.path.join(curdir,fn)
                if os.path.isfile(path):
                    file_stats = os.stat(path)
                    file_list.append([fn,time.strftime("%m/%d/%Y %I:%M:%S %p",time.localtime(file_stats[stat.ST_MTIME]))])
            return file_list
    
    def macro_exist(self, handler, fn):
        with authenticated(handler, self.obj.app):
            path=os.path.abspath(os.path.join(self.obj.macropath,fn))
            if os.path.exists(path):
                return True
            return False
    
    def save_macro(self, handler, fn, code):
        with authenticated(handler, self.obj.app):
            path=os.path.abspath(os.path.join(self.obj.macropath,fn))
            if os.path.exists(path):
                self.obj.warning("File '{0}' will be overwritten".format(path))
            with open(path,"w") as fd:
                fd.write(code)
            return fn 
    
    def open_macro(self, handler, fn):
        with authenticated(handler, self.obj.app):
            path=os.path.abspath(os.path.join(self.obj.macropath,fn))
            with open(path,"r") as fd:
                code=fd.read()
            return code
