const useTimeRangeCheckbox = document.getElementById("useTimeRange");
const videoUrlInput = document.getElementById("videoUrl");
const startTimeInput = document.getElementById("startTime");
const endTimeInput = document.getElementById("endTime");
const selectDirBtn = document.getElementById("select-dir-btn");
const savePathDisplay = document.getElementById("savePath");
const downloadBtn = document.getElementById("downloadBtn");
const logContainer = document.getElementById("log-container");

let outputPath = "";

useTimeRangeCheckbox.addEventListener("change", () => {
	const isEnabled = useTimeRangeCheckbox.checked;
	startTimeInput.disabled = !isEnabled;
	endTimeInput.disabled = !isEnabled;
});

selectDirBtn.addEventListener("click", async () => {
	const selectedPath = await window.electronAPI.selectDirectory();
	if (selectedPath) {
		outputPath = selectedPath;
		savePathDisplay.textContent = outputPath;
	}
});

downloadBtn.addEventListener("click", () => {
	const url = videoUrlInput.value;
	const startTime = startTimeInput.value;
	const endTime = endTimeInput.value;
	const useTimeRange = useTimeRangeCheckbox.checked;

	if (!url || !outputPath) {
		alert("영상 주소와 저장 위치를 모두 선택해주세요!");
		return;
	}

	if (useTimeRange && (!startTime || !endTime)) {
		alert("시간 구간을 모두 입력해주세요!");
		return;
	}

	logContainer.textContent = "";
	downloadBtn.disabled = true;

	const downloadArgs = {
		url,
		outputPath,
		useTimeRange,
		startTime,
		endTime,
	};

	window.electronAPI.runYtdlp(downloadArgs);
});

window.electronAPI.onLogUpdate((logMessage) => {
	if (logMessage.includes("\r")) {
		const currentLog = logContainer.textContent;
		const lastNewlineIndex = currentLog.lastIndexOf("\n");

		const baseLog =
			lastNewlineIndex === -1
				? ""
				: currentLog.substring(0, lastNewlineIndex + 1);

		logContainer.textContent = baseLog + logMessage.replace(/\r/g, "");
	} else {
		logContainer.textContent += logMessage;
	}

	logContainer.scrollTop = logContainer.scrollHeight;

	if (
		logMessage.includes("완료되었습니다") ||
		logMessage.includes("종료되었습니다")
	) {
		downloadBtn.disabled = false;
	}
});
