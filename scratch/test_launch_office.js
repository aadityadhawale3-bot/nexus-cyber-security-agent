const { spawn, execSync } = require('child_process');

function launch(target) {
  const child = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', `Start-Process '${target}'`], {
    detached: true,
    stdio: 'ignore'
  });
  child.unref();
}

console.log("Launching Excel...");
launch('shell:AppsFolder\\Microsoft.Office.EXCEL.EXE.15');

setTimeout(() => {
  try {
    const res = execSync('powershell -NoProfile -Command "Get-Process -Name EXCEL -ErrorAction SilentlyContinue | Select-Object Id, ProcessName; Stop-Process -Name EXCEL -Force -ErrorAction SilentlyContinue"').toString();
    console.log("Detected & Stopped Excel:", res);
  } catch (err) {
    console.error("Check failed:", err.message);
  }
}, 2000);
