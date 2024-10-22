// Selecting elements
const taskTabs = document.getElementById('taskTabs');
const inputBox = document.getElementById('inputBox');
const addBtn = document.getElementById('addBtn');
const dailyTaskContainer = document.getElementById('dailyTaskContainer');
const monthlyTaskContainer = document.getElementById('monthlyTaskContainer');
const notificationToast = new bootstrap.Toast(document.getElementById('notificationToast'));
const toastMessage = document.getElementById('toastMessage');
const deleteConfirmModal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

// Day Challenge Variables
const dayInputBox = document.getElementById('dayInputBox');
const setChallengeBtn = document.getElementById('setChallengeBtn');
const dayChallengeContainer = document.getElementById('dayChallengeContainer');
let taskArray = JSON.parse(localStorage.getItem('tasks')) || [];
let challengeDaysArray = JSON.parse(localStorage.getItem('challengeDays')) || [];
let challengeStartTime = JSON.parse(localStorage.getItem('challengeStartTime')) || null;
let deleteTaskId = null;

// Helper function to show alert message (toast)
function showAlert(message, type = 'primary') {
    toastMessage.textContent = message;
    document.getElementById('notificationToast').className = `toast align-items-center text-white bg-${type} border-0`;
    notificationToast.show();
}

// Function to get current category
function getCurrentCategory() {
    const activeTab = taskTabs.querySelector('.nav-link.active').getAttribute('aria-controls');
    return activeTab === 'daily' ? 'daily' : 'monthly';
}

// Function to add a task
function addTask() {
    const taskText = inputBox.value.trim();
    const category = getCurrentCategory();

    if (taskText === '') {
        showAlert('Please enter a task.', 'danger');
        return;
    }

    const newTask = {
        id: Date.now(),
        text: taskText,
        isCompleted: false,
        category: category
    };

    taskArray.push(newTask);
    setItems();
    getAllTasks();
    showAlert('Task added successfully!', 'primary');

    if (category === 'daily') {
        updateDayStatus();  // Update day status on task completion
    }

    inputBox.value = '';
    inputBox.focus();
}

// Function to save tasks to localStorage
function setItems() {
    localStorage.setItem('tasks', JSON.stringify(taskArray));
}

// Function to retrieve and display all tasks
function getAllTasks() {
    const dailyTasks = taskArray.filter(task => task.category === 'daily');
    const monthlyTasks = taskArray.filter(task => task.category === 'monthly');

    renderTasks(dailyTasks, dailyTaskContainer);
    renderTasks(monthlyTasks, monthlyTaskContainer);
}

// Function to render tasks
function renderTasks(tasks, container) {
    container.innerHTML = '';

    tasks.forEach(task => {
        const li = document.createElement('li');
        li.className = `list-group-item ${task.isCompleted ? 'completed' : ''}`;
        li.innerHTML = `
            <span class="task-text" data-id="${task.id}">${task.text}</span>
            <button class="delete-btn" data-id="${task.id}">
                <i class="bi bi-trash"></i>
            </button>
        `;

        li.querySelector('.task-text').addEventListener('click', toggleTaskCompletion);
        li.querySelector('.delete-btn').addEventListener('click', confirmDelete);

        container.appendChild(li);
    });
}

// Function to toggle task completion
function toggleTaskCompletion() {
    const taskId = parseInt(this.getAttribute('data-id'));
    const task = taskArray.find(t => t.id === taskId);

    task.isCompleted = !task.isCompleted;
    setItems();
    getAllTasks();
    updateDayStatus();
}

// Function to confirm delete task
function confirmDelete() {
    deleteTaskId = parseInt(this.getAttribute('data-id'));
    deleteConfirmModal.show();
}

// Function to delete a task
function deleteTask() {
    taskArray = taskArray.filter(task => task.id !== deleteTaskId);
    setItems();
    getAllTasks();
    deleteConfirmModal.hide();
    showAlert('Task deleted successfully.', 'danger');
}

// Event listener for confirming delete task
confirmDeleteBtn.addEventListener('click', deleteTask);

// Event listener for adding a task
addBtn.addEventListener('click', addTask);
inputBox.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        addTask();
    }
});

// Day Challenge - Set challenge
setChallengeBtn.addEventListener('click', setChallenge);

// Set Challenge
function setChallenge() {
    const days = parseInt(dayInputBox.value.trim());
    if (isNaN(days) || days <= 0) {
        showAlert('Please enter a valid number of days.', 'danger');
        return;
    }

    challengeDaysArray = Array.from({ length: days }, (_, index) => ({
        day: index + 1,
        isCompleted: false,
        completedAt: null,
    }));

    challengeStartTime = Date.now();
    localStorage.setItem('challengeStartTime', JSON.stringify(challengeStartTime));
    setChallengeItems();
}

// Render challenge days in the UI
function renderChallengeDays() {
    dayChallengeContainer.innerHTML = '';

    challengeDaysArray.forEach(day => {
        const li = document.createElement('li');
        li.className = `list-group-item ${day.isCompleted ? 'challenge-day-completed' : 'challenge-day-pending'}`;
        li.textContent = `Day ${day.day} - ${day.isCompleted ? 'Completed' : 'Pending'}`;
        dayChallengeContainer.appendChild(li);
    });
}

// Store challenge data
function setChallengeItems() {
    localStorage.setItem('challengeDays', JSON.stringify(challengeDaysArray));
    renderChallengeDays();
}

// Check for daily task completion when tasks are updated
function updateDayStatus() {
    const dailyTasksCompleted = taskArray.filter(task => task.category === 'daily').every(task => task.isCompleted);

    if (dailyTasksCompleted) {
        const currentDayIndex = challengeDaysArray.findIndex(day => !day.isCompleted);
        if (currentDayIndex !== -1) {
            challengeDaysArray[currentDayIndex].isCompleted = true;
            challengeDaysArray[currentDayIndex].completedAt = Date.now(); // Store completion time
            setChallengeItems();
            showAlert(`Day ${currentDayIndex + 1} completed successfully!`, 'success');
        }

        // Reset all daily tasks
        taskArray = taskArray.map(task => ({ ...task, isCompleted: false }));
        setItems();
        getAllTasks();
        checkAllCompleted();
    }
}

// Reset challenge if not completed within 24 hours
function resetChallengeIfExpired() {
    const now = Date.now();
    if (challengeStartTime && (now - challengeStartTime) > (24 * 60 * 60 * 1000)) {
        // Reset all days to incomplete if 24 hours passed
        challengeDaysArray = challengeDaysArray.map(day => ({ ...day, isCompleted: false }));
        challengeStartTime = null;
        localStorage.removeItem('challengeStartTime');
        setChallengeItems();
        showAlert('Day Challenge reset due to time expiration.', 'danger');
    }
}

// Initial Render
getAllTasks();
renderChallengeDays();
resetChallengeIfExpired();
