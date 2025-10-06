const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
	selectDirectory: () => ipcRenderer.invoke("dialog:openDirectory"),
	runYtdlp: (args) => ipcRenderer.send("run-yt-dlp", args),
	onLogUpdate: (callback) =>
		ipcRenderer.on("log-update", (_event, value) => callback(value)),
});
