const fs = require('node:fs');
const path = require('node:path');

const LOGS_DIR = path.join(__dirname, '../logs');
console.log(LOGS_DIR);
// Buat folder jika belum ada
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}
class Logger {
    static #write(fileName, guildId, prefix, msg) {
        const timestamp = new Date().toLocaleString('id-ID');
        const filePath = path.join(LOGS_DIR, fileName);
        const logMessage = `[${timestamp}] [${guildId}] ${prefix} ${msg}\n`;
        fs.appendFile(filePath, logMessage, 'utf8', (err) => {
            if (err) console.error('Gagal menulis log:', err);
        });
    }
    static info(guildId, msg) {
        console.log(`[INFO] ${msg}`);
        this.#write("app.info.log", guildId, "[INFO]", msg);
    }
    static error(guildId, msg) {
        console.log(`[ERROR] ${msg}`);
        this.#write("app.error.log", guildId, "[ERROR]", msg);
    }
    static void(guildId, punishment ,msg) {
        console.log(`[VOID] ${msg}`);
        this.#write("app.void.log", guildId, `[VOID] [${punishment.toUpperCase()}]`, msg);
    }
}

module.exports = {
    Logger
};