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
import inspect
import os
import sys
import json
import uuid
import base64
from types import ListType

import tornado.web
import tornado.websocket
import tornado.httpserver
import tornado.ioloop
from pyfrid.utils.odict import odict
from optparse import make_option

import pyfrid
from pyfrid.utils import splitall, copytree
from pyfrid.management.core.command import CommandError
from pyfrid.management.core.project.appcmd import BaseApplicationCommand
from pyfrid.webapp.core.registry import WebRegistry

class BaseRequestHandler(tornado.web.RequestHandler):
    """Base class for all type of requests"""
    
    def get_current_user(self):
        """Every request contains user and password which are encrypted and saved in browser cookies after authentication.
        This function decrypt user and password and returns as a tuple.
        """
        return (self.get_secure_cookie("user"), self.get_secure_cookie("pass"))
   
class MainRequestHandler(BaseRequestHandler):
    """This is a class for a main request handler of a GET type. This handler renders index.html file substituting 
    *index_args* arguments which are a returned by the property of web application."""
                           
    def get(self):
        try:
            index_path=os.path.join(self.application.webapp_project_path,"static","index.html")
            self.render(index_path, **self.application.index_args)
        except Exception:
            traceback.print_exc()
            raise tornado.web.HTTPError(403)

class RemoteRequestHandler(BaseRequestHandler):
    """Base class for remote request handler. This handler is a part of RPC protocol, communication protocol between
    web-interface part which is running in users's browser and web-server. This request handler reads the request body and
    invokes *process_remote_request* function of web-application object."""
    
    def post(self):
        try:
            self.set_header("Content-Type", "application/javascript")
            direct_request=json.loads(self.request.body)
            result=self.application.process_remote_request(self,direct_request)
            self.write(result)
        except Exception:
            traceback.print_exc()
            raise tornado.web.HTTPError(403) 

class ScriptRequestHandler(BaseRequestHandler):
    """This is a request handler which renders .js files which correspond to commands, devices and modules.
    Each javascript file expects several template parameters like *webscript* - full address of the script, *webclass* -
    name of the class, which is normally the same as python class of the object and *webdata* - static data for this interface.
    This static data is returned by *get_static_data* of the web-router.
    """
    def get(self, name):
        try:
            self.set_header("Content-Type", "application/javascript")
            info=self.application.get_script_info(name)
            self.render(info["webscript"],    
                        webclass=info["webclass"],
                        **info["webdata"]
                       )
        except Exception:
            traceback.print_exc()
            raise tornado.web.HTTPError(403)
        
class AppEventHandler(tornado.websocket.WebSocketHandler):
    """Class for application events handler, websocket handler which, when opened, connects system module's signals
    to appropriate slots. This slot functions send messages to the application interface
     which reacts on them in different ways."""
    
    def open(self):
        self.application.appmod.auth_module.after_login_signal.connect(self.on_user_changed)
        self.application.appmod.auth_module.after_logout_signal.connect(self.on_user_changed)
        self.application.appmod.vm_module.before_execute_signal.connect(self.on_command_active)
        self.application.appmod.vm_module.after_execute_signal.connect(self.on_command_finished)
        self.application.appmod.vm_module.before_validate_signal.connect(self.on_command_active)
        self.application.appmod.vm_module.after_validate_signal.connect(self.on_command_finished)
        self.application.appmod.logger_module.info_record_signal.connect(self.on_logmessage)
        self.application.appmod.logger_module.warning_record_signal.connect(self.on_logmessage)
        self.application.appmod.logger_module.error_record_signal.connect(self.on_logmessage)
        self.application.appmod.logger_module.exception_record_signal.connect(self.on_logmessage)
        if self.application.appmod.busy: self.on_command_active()
        
    def on_user_changed(self, *args, **kwargs):
        try:
            self.write_message({"event":"userchanged"})
        except:
            traceback.print_exc()
        
    def on_command_finished(self, *args, **kwargs):
        try:
            self.write_message({"event":"cmdfinished"})
        except:
            traceback.print_exc()
        
    def on_command_active(self, *args, **kwargs):
        try:
            self.write_message({"event":"cmdactive"})
        except:
            traceback.print_exc()
        
    def on_logmessage(self, record,  **kwargs):
        try:
            self.write_message({"event":"logmessage",
                                "time":record.created,
                                "level":record.levelname,
                                "object":record.object,
                                "user": record.user,
                                "message":record.msg
            })
        except:
            traceback.print_exc()
            
    def on_close(self):
        self.application.appmod.auth_module.after_login_signal.disconnect(self.on_user_changed)
        self.application.appmod.auth_module.after_logout_signal.disconnect(self.on_user_changed)
        self.application.appmod.vm_module.before_execute_signal.disconnect(self.on_command_active)
        self.application.appmod.vm_module.after_execute_signal.disconnect(self.on_command_finished)
        self.application.appmod.vm_module.before_validate_signal.disconnect(self.on_command_active)
        self.application.appmod.vm_module.after_validate_signal.disconnect(self.on_command_finished)
        self.application.appmod.logger_module.info_record_signal.disconnect(self.on_logmessage)
        self.application.appmod.logger_module.warning_record_signal.disconnect(self.on_logmessage)
        self.application.appmod.logger_module.error_record_signal.disconnect(self.on_logmessage)
        self.application.appmod.logger_module.exception_record_signal.disconnect(self.on_logmessage)
      
class WebApplication(tornado.web.Application):
    """Web application class is inherited from the standard tornado Application. WebApplication class initializes web registry, request handlers
     and routers for remote method execution."""
    
    def __init__(self, project_path, project_name, appmod):
        self.project_name=project_name
        self.project_path=project_path
        self._appmod=appmod
        self._webregistry=WebRegistry(project_path)
                
        self.webapp_project_path = os.path.join( project_path,             "webapp" )
        self.static_project_path = os.path.join( self.webapp_project_path, "static" )
        self.script_project_path = os.path.join( self.static_project_path, "js"     )
        #iterating over objects and creating routers
        
        self.update_registry()
        
        #initialize handlers
        self._handlers = []
        self._handlers.append((r"/", MainRequestHandler))
        
        self._handlers.append((r"/script/([A-Za-z0-9_]+)", ScriptRequestHandler))
        
        self._handlers.append((r"/remote", RemoteRequestHandler))
        self._handlers.append((r"/websocket", AppEventHandler))
        self._handlers.append((r"/project_static/(.*)", tornado.web.StaticFileHandler, {"path":self.static_project_path}))
        
        super(WebApplication,self).__init__(self._handlers,
                                            cookie_secret=base64.b64encode(uuid.uuid4().bytes + uuid.uuid4().bytes))
        
        self.appmod.auth_module.after_login_signal.connect(self.update_registry)
        self.appmod.auth_module.after_logout_signal.connect(self.update_registry)
        
    def update_registry(self, *args, **kwargs):
        """This function updates a registry of web application. This registry contains information about class names, paths to js files
        and routers. This update happens at initialization of web application and on
        login or logout of user. In the latter case the web interface of application must be reconstructed according to user permissions.
        """
        self._webregistry.clear()
        self._webregistry.register(self._appmod)
        for _, obj in self._appmod.iterate_commands(["view", "execute"]):
            self._webregistry.register(obj)
        for _, obj in self._appmod.iterate_devices ("view"):
            self._webregistry.register(obj)
        for _, obj in self._appmod.iterate_modules ("view"):
            self._webregistry.register(obj)
                                        
    def get_provider_code(self, url=r"/remote", timeout=0, namespace='Pyfrid.router'):
        """returns a javascript code of the direct reauest provider. This code is substituted to index.html template."""
        actions={}
        for name,inst in self._webregistry.iterrouters():
            methods = []
            for mname, mvalue in inspect.getmembers(inst):
                if mname.startswith("_"): continue
                if inspect.ismethod(mvalue):
                    args = inspect.getargspec(mvalue)[0]
                    if "handler" in args:
                        args.remove("self")
                        args.remove("handler")
                        arglen = len(args)
                        methods.append({"name":mname, "len":arglen})
            actions[name]=methods
        config = {
            "type": "remoting",
            "url": url,
            "actions": actions
        }
        if timeout:
            config["timeout"] = timeout
        if namespace:
            config["namespace"] = namespace
        return config
    
    def _process_request(self,handler,request):
        return self._webregistry.get_router(request["action"], exc=True)(handler,request)
    
    def process_remote_request(self,handler,request):
        """This function processes a remote request. It is invoked by the remote request handler."""
        if type(request)!=ListType:    
            return json.dumps(self._process_request(handler,request))
        else:
            return json.dumps([self._process_request(handler,req) for req in request])

    def get_script_info(self, name):
        """..."""
        return self._webregistry.get_info(name, exc=True)

    @property
    def index_args(self):
        """..."""
        return {
            "css":self._webregistry.css,    
            "bases":self._webregistry.bases,
            "scripts"    :self._webregistry.scripts,
            "provider_code":self.get_provider_code(),
            "proj_name":self.project_name,
            "appclass":self._appmod.__class__.__name__,
            "appalias":self._appmod.alias
        }
    
    @property
    def appmod(self):
        """..."""
        return self._appmod
        
                
class WebAppCommand(BaseApplicationCommand):            
    """Class for the web application command."""
         
    name='webapp'
    descr = "Starts the web application"
    args = ""
    option_list=[
        make_option("-p", "--port", dest="port", type="int", default=8888, help="Interface port"),
    ]
        
    def preloop(self, *args, **kwargs):
        """..."""
        webapp_path=os.path.join(self.projpath, "webapp")
        if not os.path.exists(webapp_path):
            self.info("Your application doesn't have 'webapp' folder. Copying necessary files...")
            import pyfrid.management.templates.project_template.webapp as project_webapp
            copytree(project_webapp.__path__[0], os.path.join(self.projpath,"webapp"))
        import zipfile
        static_path=os.path.join(webapp_path, "static")
        for f in os.listdir(static_path):
            if f.endswith('.zip'):
                with zipfile.ZipFile(os.path.join(static_path, f)) as mz:
                    mz.extractall(static_path)
        return True
                    
    def mainloop(self, *args, **options):
        """..."""
        try:
            sys.stdout.write("Starting webserver at 127.0.0.1:{0}...\n".format(options["port"]))
            app=WebApplication(self.projpath, self.projname, self.appmod)
            http_server = tornado.httpserver.HTTPServer(app)
            http_server.listen(options["port"])
            tornado.ioloop.IOLoop.instance().start()
        except KeyboardInterrupt:
            self.info("The server was interrupted...".format(options["port"])) 
            
    def postloop(self, *args, **kwargs):
        """..."""
        self.appmod.call_shutdown()
        