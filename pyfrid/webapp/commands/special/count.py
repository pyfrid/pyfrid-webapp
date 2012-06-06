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

from pyfrid.webapp.core.router import BaseTreeWebRouter
from pyfrid.webapp.core.objtree import DeviceNode, BaseObjectTree

class CountDeviceNode(DeviceNode):
    
    def __call__(self):
        data=super(CountDeviceNode, self).__call__()
        data["units"]="sec"
        data["value"]=0
        return data   

class CountObjectTree(BaseObjectTree):
    object_node=CountDeviceNode

class CountCommandWebRouter(BaseTreeWebRouter):
    trees_info=[(CountObjectTree, BaseTreeWebRouter.devices_iterator, "")]
    
    