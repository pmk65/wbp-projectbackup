/**
 * Project Backup
 *
 * Backup Project files when changing between projects or exiting editor.
 * Uses /-Zip for creating archives (Must be installed on system)
 * <https://7-zip.org/>
 *
 * Also uses SnoreToast for generating Windoes Toast Notifications.
 * <https://github.com/KDE/snoretoast>
 *
 * @category  WeBuilder Plugin
 * @package   Project Backup
 * @author    Peter Klein <pmk@io.dk>
 * @copyright 2018
 * @license   http://www.freebsd.org/copyright/license.html  BSD License
 * @version   1.0
 */

/**
 * [CLASS/FUNCTION INDEX of SCRIPT]
 *
 *     55   function ReadProjectBackupFile()
 *     96   function CopyProjectBackupFile(Sender)
 *    115   function EditProjectBackupFile(Sender)
 *    134   function CreateProjectBackup(Sender)
 *    145   function CreateArchive(mode)
 *    206   function Quote(str)
 *    217   function SnoreToast(message)
 *    231   function ReplaceMarkers(str)
 *    278   function CopyFile(source, destination, overwrite)
 *    293   function OnBeforeSelectProject(Sender)
 *    302   function OnReady()
 *    311   function OnExit()
 *    323   function OnDisabled()
 *    332   function OnEnabled()
 *    341   function OnInstalled()
 *
 * TOTAL FUNCTIONS: 15
 * (This index is automatically created/updated by the WeBuilder plugin "DocBlock Comments")
 *
 */

/**
 * Flag for detecting if exit signal is caused by disabling plugin or exiting editor
 *
 * @var pluginAction
 */
var pluginAction = false;

/**
 * Read and process ProjectBackup.ini from current project root
 *
 * @return void
 */
function ReadProjectBackupFile() {

    var projectPath = Script.ProjectSettings.SelectedProjectRoot;
    var projectBackupFile = projectPath + "\\ProjectBackup.ini";

    // Silent exit if no ProjectBackup.ini is present
    if (FileExists(projectBackupFile) == false) return;

    // Read the ProjectBackup.ini file
    var projectsIni = new TIniFile(projectBackupFile);
    var section = "ProjectBackup";
    if (!projectsIni.SectionExists(section)) {
        SnoreToast("Error: Invalid ProjectBackup.ini format");
        delete projectsIni;
        return;
    }

    var backupPath = projectsIni.ReadString(section, "BackupPath", "");
    var backupName = ReplaceMarkers(projectsIni.ReadString(section, "BackupName", ""));
    var backupFormat = projectsIni.ReadString(section, "BackupFormat", "zip");
    delete projectsIni;

    if (DirectoryExists(backupPath) == false) {
        SnoreToast("Error: Invalid backup path defined in ProjectBackup.ini");
        return;
    }
    if (backupName == "") {
        SnoreToast("Error: No backup name defined in ProjectBackup.ini");
        return;
    }

    return backupPath + backupName + "." + backupFormat;
}

/**
 * Copy default ProjectBackup.ini to current project root
 *
 * @param  object   Sender
 *
 * @return void
 */
function CopyProjectBackupFile(Sender) {

    var projectPath = Script.ProjectSettings.SelectedProjectRoot;

    if (FileExists(projectPath + "\\ProjectBackup.ini") == true) {
        if (Confirm("A ProjectBackup.ini file is already present. Overwrite it?") == false) return;
    }

    CopyFile(Script.Path + "ProjectBackup.ini", projectPath + "\\", true);

}

/**
 * Open/Edit ProjectBackup.ini from current project root
 *
 * @param  object   Sender
 *
 * @return void
 */
function EditProjectBackupFile(Sender) {

    var projectBackupFile = Script.ProjectSettings.SelectedProjectRoot  + "\\ProjectBackup.ini";
    if (FileExists(projectBackupFile) == false) {
        if (Confirm("No ProjectBackup.ini file found. Create default?") == false) return;
        CopyProjectBackupFile(Sender);
    }

    Documents.OpenDocument(projectBackupFile);

}

/**
 * Manually trigger creation of Project Backup
 *
 * @param  object   Sender
 *
 * @return void
 */
function CreateProjectBackup(Sender) {
    CreateArchive(true);
}

/**
 * Create backup archive using 7-Zip commandline version
 *
 * @param  boolean   mode true if manually triggered
 *
 * @return void
 */
function CreateArchive(mode) {

    var bMode = StrToBool(Script.ReadSetting("AutoBackup", "1"));
    // Silent exit if not manually triggered when AutoBackup is false
    if ((bMode == false) && (mode != true)) return;

    // 7zip command line
    var zPath = Script.ReadSetting("Location of 7z", "");
    if (!FileExists(zPath)) {
        SnoreToast("Error: 7z.exe not found!");
        return;
    }
    zPath = Quote(zPath);

    // Get the backup archive path/name based on info from ProjectBackup.ini file
    var archiveName = Quote(ReadProjectBackupFile());

    var spRoot =  Quote(Script.ProjectSettings.SelectedProjectRoot + "\\");
    var spExcludeFilters = Script.ProjectSettings.SelectedProjectExcludeFilters;
    var spFileTypes = Script.ProjectSettings.SelectedProjectFileTypes;

    // Build exclude part of 7-Zip switches
    var exclude = "";
    var SL = new TStringList;
    SL.Text = spExcludeFilters;
    for (var i=0; i< SL.Count; i++) {
        if (RegexMatch(SL[i], "\\\\(\\*\\.)?\\*$", false) != "") {
            // Folder - recursive
            exclude += " -xr!" + Quote(RegexReplace(SL[i], "\\\\(\\*\\.)?\\*$", "", false));
        }
        else {
            // File
            exclude += " -x!" + Quote(SL[i]);
        }
    }
    delete SL;

    if (exclude != "") {
        Quote(RegexReplace(exclude, "\"","\"\"",false));
    }

    // Build Include/FileType list
    //var include = RegexReplace(spFileTypes, ";", " ", false);
    //include = RegexReplace(include, "\*\.\*", "*", false);
    var include = "*";

   var cmd = Quote(Script.Path + "projectbackup.cmd") + " " + spRoot + " " + zPath + " " + archiveName + " " + Quote(include) + " " + exclude;

    var WSO = CreateOleObject("WScript.Shell");
    //WSO.run("cmd.exe /K \""+ cmd + "\"", 1);
    WSO.run("cmd.exe /C \""+ cmd + "\"", 0);

}

/**
 * Wrap doublequotes around string
 *
 * @param  string   str
 *
 * @return string
 */
function Quote(str) {
    return "\"" + str + "\"";
}
/**
 * Sends Windows Toast Notification using SnoreToast executable
 * https://github.com/KDE/snoretoast
 *
 * @param  string   message
 *
 * @return void
 */
function SnoreToast(message) {
    var snoreToast = Quote(Script.Path + "SnoreToastGui.exe");
    var title = Quote("Webuilder Project Backup");
    var image = Quote(Script.Path + "webuilder.png");
    ExecuteCommand(snoreToast + " -t " + title + " -m " + Quote( message) + " -p " + image, res);
}

/**
 * Replace markers with values
 *
 * @param  string   str String containing markers
 *
 * @return string
 */
function ReplaceMarkers(str) {

    var dt = Now;

    // Project name
    str = Replace(str, "%p", Script.ProjectSettings.SelectedProjectName);

    // Day
    str = Replace(str, "%d", FormatDateTime("dd", dt));
    // Month
    str = Replace(str, "%m", FormatDateTime("mm", dt));
    // Month - Text format
    str = Replace(str, "%M", FormatDateTime("mmm", dt));
   // Year
    str = Replace(str, "%y", FormatDateTime("yy", dt));
   // Year - Long format
    str = Replace(str, "%Y", FormatDateTime("yyyy", dt));

    // Hours
    str = Replace(str, "%h", FormatDateTime("hh", dt));
    // Minutes
    str = Replace(str, "%n", FormatDateTime("nn", dt));
   // Seconds
    str = Replace(str, "%s", FormatDateTime("ss", dt));

    return str;

}

/**
 * Copy one or more files from one location (the source) to another (destination).
 *
 * If source contains wildcard characters or destination ends with a path separator (\),
 * it is assumed that destination is an existing folder in which to copy matching files.
 * Otherwise, destination is assumed to be the name of a file to create. In either case,
 * three things can happen when an individual file is copied.
 * If destination does not exist, source gets copied. This is the usual case.
 * If destination is an existing file, an error occurs if overwrite is false. Otherwise,
 * an attempt is made to copy source over the existing file.
 * If destination is a directory, an error occurs.
 *
 * @param  string   source location of one or more files to be copied
 * @param  string   destination location to where one or more files in source will be copied
 * @param  bool     overwrite True allows the overwriting of existing files in the destination
 *
 * @return void
 */
function CopyFile(source, destination, overwrite) {
    var FSO = CreateOleObject("Scripting.FileSystemObject");
    if (FSO.FileExists(source)) {
        FSO.CopyFile(source, destination, overwrite);
    }
}

/**
 * project_before_select callback function.
 * Fired after a new project have been selected, but before old project is unloaded.
 *
 * @param  object   Sender
 *
 * @return void
 */
function OnBeforeSelectProject(Sender) {
    CreateArchive(false);
}

/**
 * Signal triggered when plugin/editor is loaded
 *
 * @return void
 */
function OnReady() {
    if (pluginAction) pluginAction = false;
}

/**
 * Signal triggered when exiting plugin/editor
 *
 * @return void
 */
function OnExit() {
    if (pluginAction) pluginAction = false;
    else {
        CreateArchive(false);
    }
}

/**
 * Signal triggered when plugin is disabled through Plugin Manager.
 *
 * @return void
 */
function OnDisabled() {
    pluginAction = true;
}

/**
 * Signal triggered when plugin is enabled through Plugin Manager.
 *
 * @return void
 */
function OnEnabled() {
    pluginAction = true;
}

/**
 * Signal triggered when plugin is installed through Plugin Manager.
 *
 * @return void
 */
function OnInstalled() {
    Alert("Project Backup 1.0 by Peter Klein installed sucessfully!");
}

// Signals for plugin setup
Script.ConnectSignal("installed", "OnInstalled");

// Signals to detect change of Project etc.
Script.ConnectSignal("project_before_select", "OnBeforeSelectProject");
Script.ConnectSignal("ready", "OnReady");
Script.ConnectSignal("exit", "OnExit");
Script.ConnectSignal("disabled", "OnDisabled");
Script.ConnectSignal("enabled", "OnEnabled");

// Action for displaying GUI
var bmp = new TBitmap, act;
LoadFileToBitmap(Script.Path + "project-backup-icon1.png", bmp);
act = Script.RegisterAction("Project Backup", "Create Project Backup", "", "CreateProjectBackup");
Actions.SetIcon(act, bmp);
LoadFileToBitmap(Script.Path + "project-backup-icon2.png", bmp);
act = Script.RegisterAction("Project Backup", "Copy default \"ProjectBackup.ini\" to project root", "", "CopyProjectBackupFile");
Actions.SetIcon(act, bmp);
LoadFileToBitmap(Script.Path + "project-backup-icon3.png", bmp);
act = Script.RegisterAction("Project Backup", "Edit \"ProjectBackup.ini\" from project root", "", "EditProjectBackupFile");
Actions.SetIcon(act, bmp);
delete bmp;
