const { execSync } = require('child_process');

function killPort(port) {
  try {
    const output = execSync(`netstat -ano | findstr :${port}`).toString();
    const lines = output.split('\n');
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 5 && parts[1].endsWith(`:${port}`)) {
        const pid = parts[parts.length - 1];
        if (pid && pid !== '0') {
          try {
            execSync(`taskkill /F /PID ${pid}`);
            console.log(`Killed PID ${pid} on port ${port}`);
          } catch (e) {}
        }
      }
    }
  } catch (err) {
    console.log(`Port ${port} is clear`);
  }
}

killPort(3000);
