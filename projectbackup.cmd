@REM Create ziparchive using 7-Zip
@REM Usage: projectbackup.cmd [pathtobackup] [pathtozip] [archivename] [includepattern] [excludeswitches]
@ECHO OFF
SET _cdpath=%1
SET _zipcmd=%2
SET _archive=%3
SET _include=%~4
SET _exclude=%~5

IF "%~5"=="" GOTO createarchive
SET "_exclude=%_exclude:""="%"

:createarchive
cd /D %_cdpath%
IF %ERRORLEVEL% NEQ 0 GOTO pathnotfound

%~dps0SnoreToastGui.exe -t "WebBuilder Project Backup" -m "Starting backup task" -p "%~dps0WeBuilder.png"

start "ProjectBackup" /D %_cdpath% /low /b /w %_zipcmd% a %_archive% -spf %_include% %_exclude%
IF %ERRORLEVEL% NEQ 0 GOTO error

SET _message=Backup archive created sucessfully
GOTO done

:error
SET _message=Error creating backup archive
GOTO done

:pathnotfound
SET _message=Error: Project path \"%_cdpath%\" not found

:done
%~dps0SnoreToastGui.exe -t "WebBuilder Project Backup" -m "%_message%" -p "%~dps0WeBuilder.png"
