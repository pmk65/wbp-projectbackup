# webuilder-projectbackup
Plugin for Blumentals WeBuilder/RapidPHP/RapidCCC/HTMLPad editors

This is a plugin for the following editors:

Webuilder: http://www.webuilderapp.com/<br/>
RapidPHP: http://www.rapidphpeditor.com/<br/>
RapidCSS: https://www.rapidcsseditor.com/<br/>
HTMLPad: https://www.htmlpad.net/


#### Function:
Creates backup archive of Project files. Plugin can be triggered manually from menu item or automatically when switching projects or closing editor.

**How it works:**
A special file named *ProjectBackup.ini* must be present in the root of the project. This file contains information on where to store the backup and the backup name and format. This file can be created/edited through plugin menu items.
When the plugin is triggered, it will start a background shell task at low priority. This task then creates the backup archive and sends back a Windows toast notification when done.

**Configuration:**
In the Plugin Manager options, you can disable/enable the auto backup feature globally. Also you can set the path to 7-Zip here.

**Requirements:**
For the plugin to work, you need [7-Zip](https://www.7-zip.org/) installed on your system.
For sending Windows toast notifications, [SnoreToast](https://github.com/KDE/snoretoast) is used. (included in plugin.)


#### Installation:
1) Download plugin .ZIP file.
2) Open editor and select "Plugins -> Manage Plugins" from the menu.
3) Click "Install" and select the .ZIP file you downloaded in step 1.
