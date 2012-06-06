

from pyfrid.commands.system import BaseSetCommand
from pyfrid.webapp.commands.system.set import SetCommandWebRouter

class SetCommand(BaseSetCommand):
    alias="set"
    webrouter=SetCommandWebRouter
    webscript="commands/system/set.js"
    