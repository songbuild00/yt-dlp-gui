const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const { spawn } = require("child_process");

function createWindow() {
	const mainWindow = new BrowserWindow({
		width: 800,
		height: 800,
		webPreferences: {
			preload: path.join(__dirname, "preload.js"),
			// 주의: 보안상의 이유로 nodeIntegration은 false로 유지하고 preload를 사용합니다.
			contextIsolation: true,
			nodeIntegration: false,
		},
	});

	mainWindow.loadFile("index.html");
}

app.whenReady().then(() => {
	createWindow();

	app.on("activate", function () {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
});

app.on("window-all-closed", function () {
	if (process.platform !== "darwin") app.quit();
});

ipcMain.handle("dialog:openDirectory", async () => {
	const { canceled, filePaths } = await dialog.showOpenDialog({
		properties: ["openDirectory"],
	});
	if (!canceled) {
		return filePaths[0];
	}
});

ipcMain.on(
	"run-yt-dlp",
	(event, { url, startTime, endTime, outputPath, useTimeRange }) => {
		const isDev = !app.isPackaged;
		const ytdlpPath = isDev
			? path.join(__dirname, "bin/yt-dlp")
			: path.join(process.resourcesPath, "bin/yt-dlp");

		const ffmpegPath = isDev
			? path.join(__dirname, "bin/ffmpeg")
			: path.join(process.resourcesPath, "bin/ffmpeg");

		const args = [];

		if (useTimeRange && startTime && endTime) {
			args.push("--download-sections", `*${startTime}-${endTime}`);
		}

		args.push(
			"--ffmpeg-location",
			ffmpegPath,
			"-f",
			"bestvideo*+bestaudio/best",
			"--cookies-from-browser",
			"chrome",
			"--recode-video",
			"mov",
			"-P",
			outputPath,
			url
		);

		event.sender.send("log-update", "다운로드를 시작합니다...\n");
		event.sender.send("log-update", `명령어: yt-dlp ${args.join(" ")}\n\n`);

		const ytdlp = spawn(ytdlpPath, args);

		ytdlp.stdout.on("data", (data) => {
			event.sender.send("log-update", data.toString());
		});

		ytdlp.stderr.on("data", (data) => {
			const message = data.toString();
			if (message.toUpperCase().includes("ERROR")) {
				event.sender.send("log-update", `[오류] ${message}`);
			} else {
				event.sender.send("log-update", message);
			}
		});

		ytdlp.on("close", (code) => {
			if (code === 0) {
				event.sender.send(
					"log-update",
					"\n🎉 다운로드가 성공적으로 완료되었습니다."
				);
			} else {
				event.sender.send(
					"log-update",
					`\n❌ 프로세스가 오류와 함께 종료되었습니다 (코드: ${code}).`
				);
			}
		});
	}
);
