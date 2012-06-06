from pyfrid.modules.system.app import BaseApplicationModule
from pyfrid.webapp.modules.system.app import ApplicationWebRouter

class ApplicationModule(BaseApplicationModule):
    
    alias="application"
    webrouter=ApplicationWebRouter
    webscript="modules/system/app.js"
    
    def status(self):
        return super(ApplicationModule, self).status()   