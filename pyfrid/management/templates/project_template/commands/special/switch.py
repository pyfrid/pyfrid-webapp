

from pyfrid.commands.special.switch import BaseSwitchCommand
from pyfrid.webapp.commands.special.switch import SwitchCommandWebRouter

class SwitchCommand(BaseSwitchCommand):
    alias="switch"
    
    webrouter=SwitchCommandWebRouter
    webscript="commands/special/switch.js"
    