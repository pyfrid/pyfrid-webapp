Introduction
============

This is a package which adds web application base classes and management tools to PyFRID.
The graphical user interface part is written in Javascript using ExtJS_ framework from Sencha_ .
Web application package brings the following functionality:

* *webapp* management tool which will initilaize your application and will start the web-server.
* routers - wrapper classes for your commands, devices and modules. 
  These classes play a role of a layer between JS interface of an object and its server-side implementation.
* JS files for system commands and modules 

Prerequisites
-------------

PyFRID web application package needs **PyFRID** to be installed, it also depends on tornado_ web server.

.. _tornado: http://www.tornadoweb.org/
.. _ExtJS: http://www.sencha.com/products/extjs/
.. _Sencha: http://www.sencha.com/ 
