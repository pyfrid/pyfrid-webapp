

from pyfrid.commands.system import BaseInitCommand
from pyfrid.webapp.commands.system.init import InitCommandWebRouter

class InitCommand(BaseInitCommand):
    alias="initialize"
    webrouter=InitCommandWebRouter
    webscript="commands/system/init.js"
    