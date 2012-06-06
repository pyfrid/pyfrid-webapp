

from pyfrid.commands.special import BaseSetposCommand
from pyfrid.webapp.commands.special.setpos import SetposCommandWebRouter

class SetposCommand(BaseSetposCommand):
    alias="setpos"
    webrouter=SetposCommandWebRouter
    webscript="commands/special/setpos.js"
    
   