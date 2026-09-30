const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const OFFICE_PATHS = {
  excel: [
    "C:\\Program Files\\Microsoft Office\\root\\Office16\\EXCEL.EXE",
    "C:\\Program Files (x86)\\Microsoft Office\\root\\Office16\\EXCEL.EXE",
    "C:\\Program Files\\Microsoft Office\\Office16\\EXCEL.EXE",
  ],
  powerpoint: [
    "C:\\Program Files\\Microsoft Office\\root\\Office16\\POWERPNT.EXE",
    "C:\\Program Files (x86)\\Microsoft Office\\root\\Office16\\POWERPNT.EXE",
    "C:\\Program Files\\Microsoft Office\\Office16\\POWERPNT.EXE",
  ],
  word: [
    "C:\\Program Files\\Microsoft Office\\root\\Office16\\WINWORD.EXE",
    "C:\\Program Files (x86)\\Microsoft Office\\root\\Office16\\WINWORD.EXE",
    "C:\\Program Files\\Microsoft Office\\Office16\\WINWORD.EXE",
  ],
  paint: [
    path.join(process.env.LOCALAPPDATA || "C:\\Users\\USER\\AppData\\Local", "Microsoft\\WindowsApps\\mspaint.exe"),
    "C:\\Windows\\System32\\mspaint.exe",
  ],
  notepad: [
    "C:\\Windows\\System32\\notepad.exe",
  ],
};

for (const [app, paths] of Object.entries(OFFICE_PATHS)) {
  const found = paths.find(p => fs.existsSync(p));
  console.log(`${app}: found = ${found || 'NONE'}`);
}
