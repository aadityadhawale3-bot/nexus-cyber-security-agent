const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

async function test() {
  exec('cmd.exe /c start "" notepad');
  await new Promise(r => setTimeout(r, 2000));
  console.log('Testing close via execAsync...');
  try {
    const res = await execAsync('powershell -NoProfile -NonInteractive -Command "Get-Process -Name \'notepad\' -ErrorAction SilentlyContinue | Stop-Process -Force"');
    console.log('Close result:', res);
  } catch (err) {
    console.error('Close error:', err);
  }
}
test();
