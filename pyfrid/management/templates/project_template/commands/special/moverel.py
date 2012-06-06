

from pyfrid.commands.special import BaseMoverelCommand
from pyfrid.webapp.commands.special.moverel import MoverelCommandWebRouter

class MoverelCommand(BaseMoverelCommand):
    alias="moverel"
    webrouter=MoverelCommandWebRouter
    webscript="commands/special/moverel.js"
    
   