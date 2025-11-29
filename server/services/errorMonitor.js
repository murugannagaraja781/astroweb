/**
 * ErrorMonitor Service
 * Automatically detects runtime errors and provides troubleshooting alerts.
 */

class ErrorMonitor {
    constructor() {
        this.errorPatterns = [
            {
                pattern: /Mongo.*Error|connection.*refused|authentication.*failed/i,
                type: "DATABASE_ERROR",
                fix: "Check MONGO_URI in .env. Ensure your IP is whitelisted in MongoDB Atlas.",
            },
            {
                pattern: /EADDRINUSE/i,
                type: "PORT_CONFLICT",
                fix: "Port is already in use. Kill the process using the port or change PORT in .env.",
            },
            {
                pattern: /swisseph/i,
                type: "DEPENDENCY_ERROR",
                fix: "Swisseph module missing. Run 'npm install swisseph' or use mock data (default behavior).",
            },
            {
                pattern: /jwt.*expired/i,
                type: "AUTH_ERROR",
                fix: "Token expired. User needs to re-login.",
            },
            {
                pattern: /cors|access-control-allow-origin/i,
                type: "CORS_ERROR",
                fix: "Check CLIENT_URL in .env matches your frontend URL exactly.",
            },
        ];
    }

    analyze(error) {
        const msg = error.message || error.toString();
        const match = this.errorPatterns.find((p) => p.pattern.test(msg));

        return {
            type: match ? match.type : "UNKNOWN_ERROR",
            message: msg,
            fix: match ? match.fix : "Check server logs for stack trace. Ensure all env vars are set.",
            stack: error.stack,
            timestamp: new Date().toISOString(),
        };
    }

    log(error, context = "System") {
        const analysis = this.analyze(error);

        console.error("\n🚨 ================== AUTO-TROUBLESHOOT ALERT ================== 🚨");
        console.error(`❌ TYPE:    ${analysis.type}`);
        console.error(`📍 CONTEXT: ${context}`);
        console.error(`💬 ERROR:   ${analysis.message}`);
        console.error(`💡 FIX:     ${analysis.fix}`);
        console.error("---------------------------------------------------------------------");
        if (analysis.stack) {
            console.error(analysis.stack.split("\n")[1] || analysis.stack); // Print first line of stack
        }
        console.error("=====================================================================\n");
    }

    start() {
        // Catch unhandled promise rejections
        process.on("unhandledRejection", (reason, promise) => {
            this.log(reason, "Unhandled Promise Rejection");
        });

        // Catch uncaught exceptions
        process.on("uncaughtException", (error) => {
            this.log(error, "Uncaught Exception");
            // Optional: process.exit(1) if critical, but we want to keep running if possible
        });

        console.log("🛡️  Automated Error Monitor Active");
    }
}

module.exports = new ErrorMonitor();
