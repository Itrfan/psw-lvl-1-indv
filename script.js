const plannerEl = document.getElementById("planner");
const darkModeToggle = document.getElementById("darkModeToggle");
const selectedDateInput = document.getElementById("selectedDate");
const today = new Date().toISOString().split("T")[0];
selectedDateInput.value = today;

let draggedBlock = null;

function renderPlanner(date) {
  plannerEl.innerHTML = "";
  const currentHour = new Date().getHours();
  const taskOrder =
    JSON.parse(localStorage.getItem(`${date}-order`)) ||
    Array.from({ length: 24 }, (_, i) => i);

  taskOrder.forEach((hour) => {
    const block = document.createElement("div");
    block.className = "time-block";
    block.draggable = true;
    block.dataset.hour = hour;

    const label = document.createElement("span");
    const formattedHour = `${hour.toString().padStart(2, "0")}:00`;
    label.textContent = formattedHour;

    const textarea = document.createElement("textarea");
    const taskKey = `${date}-task-${hour}`;
    textarea.value = localStorage.getItem(taskKey) || "";

    const saveBtn = document.createElement("button");
    saveBtn.className = "save-btn";
    saveBtn.textContent = "💾 Save";
    saveBtn.onclick = () => {
      localStorage.setItem(taskKey, textarea.value);
    };

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "🗑️ Delete";
    deleteBtn.onclick = () => {
      textarea.value = "";
      localStorage.removeItem(taskKey);
    };

    const isToday = date === today;
    if (isToday) {
      if (hour < currentHour) block.classList.add("past");
      else if (hour === currentHour) block.classList.add("present");
      else block.classList.add("future");
    }

    const btnRow = document.createElement("div");
    btnRow.className = "btn-row";
    btnRow.append(saveBtn, deleteBtn);

    block.append(label, textarea, btnRow);
    plannerEl.appendChild(block);

    // dragging thing
    block.addEventListener("dragstart", dragStart);
    block.addEventListener("dragover", dragOver);
    block.addEventListener("drop", drop);
  });
}

selectedDateInput.addEventListener("change", () => {
  renderPlanner(selectedDateInput.value);
});

renderPlanner(today);

darkModeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
});

document.getElementById("clearAll").onclick = () => {
  if (confirm("Clear all tasks for selected day?")) {
    for (let hour = 0; hour < 24; hour++) {
      localStorage.removeItem(`${selectedDateInput.value}-task-${hour}`);
    }
    localStorage.removeItem(`${selectedDateInput.value}-order`);
    renderPlanner(selectedDateInput.value);
  }
};

fetch("https://api.quotable.io/random")
  .then((res) => (res.ok ? res.json() : Promise.reject()))
  .then((data) => {
    document.getElementById(
      "quote"
    ).textContent = `"${data.content}" — ${data.author}`;
  })
  .catch(() => {
    document.getElementById("quote").textContent =
      "✨ Unable to load quote. Please refresh.";
  });

// drag while saving order
function dragStart(e) {
  draggedBlock = this;
  this.classList.add("dragging");
}

function dragOver(e) {
  e.preventDefault();
  const draggingOver = this;
  if (draggingOver !== draggedBlock) {
    const parent = plannerEl;
    const draggedIndex = [...parent.children].indexOf(draggedBlock);
    const overIndex = [...parent.children].indexOf(draggingOver);
    if (draggedIndex < overIndex) {
      parent.insertBefore(draggedBlock, draggingOver.nextSibling);
    } else {
      parent.insertBefore(draggedBlock, draggingOver);
    }
  }
}

function drop(e) {
  e.preventDefault();
  draggedBlock.classList.remove("dragging");
  draggedBlock = null;

  // save new order
  const newOrder = [...plannerEl.children].map((block) =>
    parseInt(block.dataset.hour)
  );
  const date = selectedDateInput.value;
  localStorage.setItem(`${date}-order`, JSON.stringify(newOrder));
}
