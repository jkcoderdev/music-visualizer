const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

function onResize() {
    canvas.width = canvas.getBoundingClientRect().width;
    canvas.height = canvas.getBoundingClientRect().height;
}

onResize();
window.addEventListener("resize", onResize);

const audioElement = new Audio("/music/ncs.mp3");
audioElement.volume = 0.3;

if (sessionStorage.getItem("currentTime") == null) sessionStorage.setItem("currentTime", 0);
audioElement.currentTime = sessionStorage.getItem("currentTime");

const player = document.querySelector(".player");
const playButton = player.querySelector(".play");
const timeDisplay = player.querySelector(".time");
const timeBar = player.querySelector(".bar");
const volumeBar = player.querySelector(".volume");

function onChangeTimeBar(e) {
    const x = e.clientX - timeBar.getBoundingClientRect().left;
    const percent = x / timeBar.getBoundingClientRect().width;

    audioElement.currentTime = percent * audioElement.duration;
    
    const currentTime = audioElement.currentTime;
    const duration = audioElement.duration;

    sessionStorage.setItem("currentTime", currentTime);

    timeBar.style = "--position: " + currentTime / duration;
}

let timeBarPressed = false;

playButton.addEventListener("click", () => {
    if (playButton.classList.contains("playing")) audioElement.pause();
    else audioElement.play();
});

document.addEventListener("pointermove", e => {
    if (timeBarPressed) {
        onChangeTimeBar(e);
    }
});

document.addEventListener("pointerup", e => {
    timeBarPressed = false;
});

timeBar.addEventListener("pointerdown", e => {
    timeBarPressed = true;
    onChangeTimeBar(e);
});

volumeBar.addEventListener("pointerdown", () => {
    audioElement.volume = volumeBar.value / 100;
});

volumeBar.addEventListener("pointermove", () => {
    audioElement.volume = volumeBar.value / 100;
});

audioElement.addEventListener("play", () => {
    playButton.classList.add("playing");
});

audioElement.addEventListener("pause", () => {
    playButton.classList.remove("playing");
});

audioElement.addEventListener("timeupdate", () => {
    const currentTime = audioElement.currentTime;
    const duration = audioElement.duration;

    sessionStorage.setItem("currentTime", currentTime);

    timeBar.style = "--position: " + currentTime / duration;

    // Calculate the hours, minutes, and seconds for the current time and duration
    const currentHours = Math.floor(currentTime / 3600);
    const currentMinutes = Math.floor((currentTime % 3600) / 60);
    const currentSeconds = Math.floor(currentTime % 60);

    const durationHours = Math.floor(duration / 3600);
    const durationMinutes = Math.floor((duration % 3600) / 60);
    const durationSeconds = Math.floor(duration % 60);

    // Format the time strings
    // let currentTimeString = currentSeconds.toString().padStart(2, "0");
    let currentTimeString = "";

    if (currentHours > 0) {
        currentTimeString += currentHours + ":" + currentMinutes.toString().padStart(2, "0") + ":";
    } else {
        currentTimeString += currentMinutes + ":";
    }

    currentTimeString += currentSeconds.toString().padStart(2, "0");
    
    // let durationTimeString = durationSeconds.toString().padStart(2, "0");
    let durationTimeString = "";

    if (durationHours > 0) {
        durationTimeString += durationHours + ":" + durationMinutes.toString().padStart(2, "0") + ":";
    } else {
        durationTimeString += durationMinutes + ":";
    }

    durationTimeString += durationSeconds.toString().padStart(2, "0");

    timeDisplay.textContent = currentTimeString + " / " + durationTimeString;
});

audioElement.addEventListener("volumechange", () => {
    volumeBar.value = Math.round(audioElement.volume * 100);
});

function onStart() {
    audioElement.removeEventListener("play", onStart);

    const audioContext = new AudioContext();
    const source = audioContext.createMediaElementSource(audioElement);
    const analyser = audioContext.createAnalyser();
    source.connect(analyser);
    source.connect(audioContext.destination);

    analyser.fftSize = 2**Math.round(Math.log2(canvas.width / 12 * 2));

    let dataArray = new Uint8Array(analyser.frequencyBinCount);

    window.addEventListener("resize", () => {
        analyser.fftSize = 2**Math.ceil(Math.log2(canvas.width / 12 * 2));
        dataArray = new Uint8Array(analyser.frequencyBinCount);
    });
    
    analyser.minDecibels = -168;
    analyser.maxDecibels = -30;

    let lastAverage = 0;
    let lightPulse = 0;
    let lastTime = performance.now();
    function render() {
        requestAnimationFrame(render);
    
        let timeNow = performance.now();
        let deltaTime = (timeNow - lastTime) / 1000;
        lastTime = timeNow;
    
        ctx.fillStyle = "#eee";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    
        // Get frequency data
        analyser.getByteFrequencyData(dataArray);

        const bufferLength = dataArray.length;
    
        ctx.fillStyle = '#aaa';

        let averageValue = 0;
    
        // Draw visualization
        for (let i = 0; i < bufferLength; i++) {
            const value = dataArray[i] / 255;

            averageValue += value;

            ctx.fillRect(
                i / bufferLength * canvas.width,
                canvas.height - value * canvas.height,
                canvas.width / bufferLength - 2,
                value * canvas.height
            );
        }

        averageValue /= bufferLength;

        let averageIncrease = averageValue - lastAverage;
        let pulseLimit = 0.02;
        if (averageIncrease > pulseLimit) lightPulse = Math.min((averageIncrease) * 200, 1) * averageValue;

        if (lightPulse != 0) console.log(lightPulse);

        lastAverage = averageValue;

        ctx.fillStyle = `hsla(${(averageValue * 2 + performance.now() / 1000 * 360 / 30) % 360}, ${100 - 100 * lightPulse}%, ${50 + 30 * lightPulse}%, 0.5)`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillRect(0, canvas.height - averageValue * canvas.height, canvas.width, averageValue * canvas.height);

        lightPulse -= deltaTime * 4 / lightPulse;
        lightPulse = Math.max(lightPulse, 0);
    }
    render();
}

audioElement.addEventListener("play", onStart);