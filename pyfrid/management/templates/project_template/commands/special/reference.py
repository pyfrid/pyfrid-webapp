

from pyfrid.commands.special import BaseReferenceCommand
from pyfrid.webapp.commands.special.reference import ReferenceCommandWebRouter

class ReferenceCommand(BaseReferenceCommand):
    alias="reference"
    webrouter=ReferenceCommandWebRouter
    webscript="commands/special/reference.js"
    
   