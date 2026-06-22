/* ==========================
   PISBEAT FLOW JOURNAL
========================== */

const canvas = document.getElementById("drawCanvas");
const ctx = canvas.getContext("2d");

const outlineImage = document.getElementById("outlineImage");

let drawing = false;
let currentColor = "#ff69b4";
let brushSize = 10;

let undoStack = [];
let redoStack = [];

/* ==========================
   CANVAS SETUP
========================== */

function resizeCanvas() {

  const width = outlineImage.clientWidth;
  const height = outlineImage.clientHeight;

  canvas.width = width;
  canvas.height = height;

}

outlineImage.onload = () => {
  resizeCanvas();
  saveState();
};

window.addEventListener("resize", resizeCanvas);

/* ==========================
   DRAWING
========================== */

function getPosition(e) {

  const rect = canvas.getBoundingClientRect();

  if (e.touches) {
    return {
      x: e.touches[0].clientX - rect.left,
      y: e.touches[0].clientY - rect.top
    };
  }

  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
}

function startDraw(e) {

  drawing = true;

  const pos = getPosition(e);

  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
}

function draw(e) {

  if (!drawing) return;

  e.preventDefault();

  const pos = getPosition(e);

  ctx.lineWidth = brushSize;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.strokeStyle = currentColor;

  ctx.lineTo(pos.x, pos.y);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(pos.x, pos.y);
}

function stopDraw() {

  if (!drawing) return;

  drawing = false;

  ctx.beginPath();

  saveState();
}

canvas.addEventListener("mousedown", startDraw);
canvas.addEventListener("mousemove", draw);
canvas.addEventListener("mouseup", stopDraw);
canvas.addEventListener("mouseleave", stopDraw);

canvas.addEventListener("touchstart", startDraw);
canvas.addEventListener("touchmove", draw);
canvas.addEventListener("touchend", stopDraw);

/* ==========================
   COLORS
========================== */

document.querySelectorAll(".color").forEach(btn => {

  btn.addEventListener("click", () => {

    currentColor = btn.dataset.color;

    document.getElementById("colorPicker").value =
      btn.dataset.color;

  });

});

document
  .getElementById("colorPicker")
  .addEventListener("input", (e) => {

    currentColor = e.target.value;

  });

/* ==========================
   BRUSH SIZE
========================== */

document
  .getElementById("brushSize")
  .addEventListener("input", (e) => {

    brushSize = e.target.value;

  });

/* ==========================
   ERASER
========================== */

document
  .getElementById("eraserBtn")
  .addEventListener("click", () => {

    currentColor = "#ffffff";

  });

/* ==========================
   UNDO REDO
========================== */

function saveState() {

  undoStack.push(canvas.toDataURL());

  if (undoStack.length > 30) {
    undoStack.shift();
  }

  redoStack = [];
}

function restoreState(state) {

  const img = new Image();

  img.src = state;

  img.onload = () => {

    ctx.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    ctx.drawImage(
      img,
      0,
      0
    );

  };

}

document
  .getElementById("undoBtn")
  .addEventListener("click", () => {

    if (undoStack.length < 2) return;

    redoStack.push(
      undoStack.pop()
    );

    restoreState(
      undoStack[undoStack.length - 1]
    );

  });

document
  .getElementById("redoBtn")
  .addEventListener("click", () => {

    if (!redoStack.length) return;

    const state = redoStack.pop();

    undoStack.push(state);

    restoreState(state);

  });

/* ==========================
   RESET
========================== */

document
  .getElementById("resetBtn")
  .addEventListener("click", () => {

    ctx.clearRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    saveState();

  });

/* ==========================
   DOWNLOAD
========================== */

document
  .getElementById("downloadBtn")
  .addEventListener("click", () => {

    const exportCanvas =
      document.createElement("canvas");

    exportCanvas.width =
      canvas.width;

    exportCanvas.height =
      canvas.height;

    const exportCtx =
      exportCanvas.getContext("2d");

    exportCtx.drawImage(
      canvas,
      0,
      0
    );

    exportCtx.drawImage(
      outlineImage,
      0,
      0,
      canvas.width,
      canvas.height
    );

    const link =
      document.createElement("a");

    link.download =
      "pisbeat-artwork.png";

    link.href =
      exportCanvas.toDataURL();

    link.click();

  });

/* ==========================
   COLOR STORY ANALYSIS
========================== */

function analyzeColor() {

  const data =
    ctx.getImageData(
      0,
      0,
      canvas.width,
      canvas.height
    ).data;

  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;

  for (let i = 0; i < data.length; i += 4) {

    if (data[i + 3] > 0) {

      r += data[i];
      g += data[i + 1];
      b += data[i + 2];

      count++;

    }
  }

  if (count === 0) {

    return {
      color: "None",
      analysis:
      "Start coloring to discover your color story."
    };

  }

  r = r / count;
  g = g / count;
  b = b / count;

  let dominantColor = "Blue";
  let analysis =
    "You explored colors often associated with calmness and reflection.";

  if (r > g && r > b) {

    dominantColor = "Pink / Red";

    analysis =
      "You were drawn toward expressive and energetic colors today.";

  }

  if (g > r && g > b) {

    dominantColor = "Green";

    analysis =
      "Your artwork reflects themes of growth, balance, and renewal.";

  }

  if (b > r && b > g) {

    dominantColor = "Blue";

    analysis =
      "You explored colors often associated with calmness and reflection.";

  }

  document.getElementById(
    "analysisResult"
  ).innerHTML = `
    <strong>Dominant Color:</strong>
    ${dominantColor}
    <br><br>
    ${analysis}
  `;

  return {
    color: dominantColor,
    analysis
  };
}

/* ==========================
   SAVE TO APPS SCRIPT
========================== */

document
  .getElementById("saveBtn")
  .addEventListener("click", async () => {

    const name =
      document.getElementById("name").value;

    const consent =
      document.getElementById("consent").checked;

    if (!name) {

      alert("Please enter your name.");

      return;

    }

    if (!consent) {

      alert(
        "Please provide consent before saving."
      );

      return;

    }

    const colorResult =
      analyzeColor();

    const flowRating =
      document.querySelector(
        'input[name="flowRating"]:checked'
      )?.value || "";

    const payload = {

      name: name,

      email:
        document.getElementById("email").value,

      ageGroup:
        document.getElementById("ageGroup").value,

      status:
        document.getElementById("status").value,

      artworkTitle:
        document.getElementById("artworkTitle").value,

      mood:
        document.getElementById("mood").value,

      flowRating: flowRating,

      dominantColor:
        colorResult.color,

      colorAnalysis:
        colorResult.analysis,

      reflectionAnswer:
        document.getElementById(
          "reflectionAnswer"
        ).value,

      gratitude:
        document.getElementById(
          "gratitude"
        ).value,

      diary:
        document.getElementById(
          "diary"
        ).value,

      consent: consent

    };

    const statusMessage =
      document.getElementById(
        "statusMessage"
      );

    statusMessage.innerText =
      "Saving your flow...";

    try {

      const response =
        await fetch(
          APPS_SCRIPT_URL,
          {
            method: "POST",
            body: JSON.stringify(payload)
          }
        );

      const result =
        await response.json();

      if (result.success) {

        statusMessage.innerText =
          "🌈 Your flow has been saved!";

      } else {

        statusMessage.innerText =
          "Failed to save.";

      }

    } catch(error) {

      console.error(error);

      statusMessage.innerText =
        "Connection error.";

    }

  });