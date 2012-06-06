

from pyfrid.commands.special import BaseCountCommand
from pyfrid.webapp.commands.special.count import CountCommandWebRouter

class CountCommand(BaseCountCommand):
    alias="count"
    webrouter=CountCommandWebRouter
    webscript="commands/special/count.js"
    
    