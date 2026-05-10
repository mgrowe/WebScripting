// To-do app state and saved data key.
const storageKey = "todo-app-tasks";
const taskForm = document.querySelector("#task-form");
const taskNameInput = document.querySelector("#task-name");
const taskTagInput = document.querySelector("#task-tag");
const formError = document.querySelector("#form-error");
const taskList = document.querySelector("#task-list");
const filterButtons = document.querySelectorAll(".filter-button");
const tagFilter = document.querySelector("#tag-filter");
const taskCounter = document.querySelector("#task-counter");
const filterStatus = document.querySelector("#filter-status");

let tasks = loadTasks();
let currentStatusFilter = "all";
let currentTagFilter = "all";

// Load tasks from localStorage. If nothing is saved, start with an empty list.
function loadTasks() {
  const savedTasks = localStorage.getItem(storageKey);

  if (!savedTasks) {
    return [];
  }

  return JSON.parse(savedTasks);
}

// Save the current task list so it survives page reloads.
function saveTasks() {
  localStorage.setItem(storageKey, JSON.stringify(tasks));
}

// Add a new task after checking that the task name is not blank.
function addTask(event) {
  event.preventDefault();

  const taskText = taskNameInput.value.trim();
  const taskTag = taskTagInput.value;

  if (taskText === "") {
    formError.textContent = "Please enter a task name before adding it.";
    taskNameInput.focus();
    return;
  }

  const newTask = {
    id: Date.now(),
    text: taskText,
    tag: taskTag,
    done: false
  };

  tasks.push(newTask);
  saveTasks();
  taskForm.reset();
  formError.textContent = "";
  renderTasks();
}

// Build the visible task list based on the current filters.
function renderTasks() {
  const filteredTasks = applyFilters();
  taskList.innerHTML = "";

  if (filteredTasks.length === 0) {
    const emptyItem = document.createElement("li");
    emptyItem.className = "empty-state";
    emptyItem.textContent = "No tasks match the current filters.";
    taskList.appendChild(emptyItem);
    updateCounter();
    updateFilterStatus(filteredTasks.length);
    return;
  }

  filteredTasks.forEach((task) => {
    const taskItem = document.createElement("li");
    taskItem.className = task.done ? "task-item completed" : "task-item";

    const taskDetails = document.createElement("div");
    taskDetails.className = "task-details";

    const taskText = document.createElement("span");
    taskText.className = "task-text";
    taskText.textContent = task.text;

    const taskTag = document.createElement("span");
    taskTag.className = "task-tag";
    taskTag.textContent = task.tag || "no tag";

    const taskActions = document.createElement("div");
    taskActions.className = "task-actions";

    const completeButton = document.createElement("button");
    completeButton.className = "task-action complete-button";
    completeButton.type = "button";
    completeButton.textContent = task.done ? "Mark Active" : "Complete";
    completeButton.addEventListener("click", () => toggleTaskComplete(task.id));

    const deleteButton = document.createElement("button");
    deleteButton.className = "task-action delete-button";
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";
    deleteButton.addEventListener("click", () => deleteTask(task.id));

    taskDetails.appendChild(taskText);
    taskDetails.appendChild(taskTag);
    taskActions.appendChild(completeButton);
    taskActions.appendChild(deleteButton);
    taskItem.appendChild(taskDetails);
    taskItem.appendChild(taskActions);
    taskList.appendChild(taskItem);
  });

  updateCounter();
  updateFilterStatus(filteredTasks.length);
}

// Switch one task between active and completed.
function toggleTaskComplete(taskId) {
  tasks = tasks.map((task) => {
    if (task.id === taskId) {
      return {
        ...task,
        done: !task.done
      };
    }

    return task;
  });

  saveTasks();
  renderTasks();
}

// Remove a task from the list.
function deleteTask(taskId) {
  tasks = tasks.filter((task) => task.id !== taskId);
  saveTasks();
  renderTasks();
}

// Return only the tasks that match the selected completion and tag filters.
function applyFilters() {
  return tasks.filter((task) => {
    const matchesStatus =
      currentStatusFilter === "all" ||
      (currentStatusFilter === "active" && !task.done) ||
      (currentStatusFilter === "completed" && task.done);

    const matchesTag =
      currentTagFilter === "all" ||
      (currentTagFilter === "none" && task.tag === "") ||
      task.tag === currentTagFilter;

    return matchesStatus && matchesTag;
  });
}

// Count active tasks from the whole saved list, not just the filtered view.
function updateCounter() {
  const activeCount = tasks.filter((task) => !task.done).length;
  const taskWord = activeCount === 1 ? "task" : "tasks";
  taskCounter.textContent = `${activeCount} active ${taskWord}`;
}

// Describe what the user is currently viewing.
function updateFilterStatus(visibleCount) {
  const statusText =
    currentStatusFilter === "all" ? "all" : currentStatusFilter;
  const tagText =
    currentTagFilter === "all" ? "all tags" : `${currentTagFilter} tag`;

  filterStatus.textContent = `Showing ${visibleCount} ${statusText} tasks from ${tagText}`;
}

taskForm.addEventListener("submit", addTask);

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    filterButtons.forEach((filterButton) => {
      filterButton.classList.remove("active-filter");
    });

    button.classList.add("active-filter");
    currentStatusFilter = button.dataset.filter;
    renderTasks();
  });
});

tagFilter.addEventListener("change", () => {
  currentTagFilter = tagFilter.value;
  renderTasks();
});

renderTasks();
