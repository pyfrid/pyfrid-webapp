

from pyfrid.commands.special import BaseMoveCommand
from pyfrid.webapp.commands.special.move import MoveCommandWebRouter

class MoveCommand(BaseMoveCommand):
    alias="move"
    webrouter=MoveCommandWebRouter
    webscript="commands/special/move.js"
    
   