const { spawn } = require("child_process");

function launchUrl(url) {
  const p = spawn("powershell", ["-NoProfile", "-NonInteractive", "-Command", `Start-Process '${url.replace(/'/g, "''")}'`], {
    detached: true,
    stdio: "ignore"
  });
  p.unref();
  console.log("Launched url:", url);
}

launchUrl("https://www.google.com/maps/dir/?api=1&destination=mumbai");
