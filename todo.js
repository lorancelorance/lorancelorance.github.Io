// Selecting DOM elements
const addButton = document.getElementById('addBtn');
const inputBox = document.getElementById('inputBox');
const dailyTaskContainer = document.getElementById('dailyTaskContainer');
const monthlyTaskContainer = document.getElementById('monthlyTaskContainer');
const toastEl = document.getElementById('notificationToast');
const toastMessage = document.getElementById('toastMessage');
const toast = new bootstrap.Toast(toastEl, { delay: 3000 });

// For Delete Confirmation
const deleteConfirmModal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
let taskIdToDelete = null;

// Focus on the input box on load
//inputBox.focus();

// Retrieve tasks from localStorage or initialize empty array
let taskArray = JSON.parse(localStorage.getItem('tasks')) || [];

// Flags to prevent multiple alerts for each category
let allCompletedAlertShown = {
    daily: false,
    monthly: false
};

// Save tasks to localStorage
function setItems() {
    localStorage.setItem('tasks', JSON.stringify(taskArray));
}

// Create a task element
function createTaskElement(taskObj) {
    const li = document.createElement('li');
    li.className = `list-group-item task-item ${taskObj.isCompleted ? 'completed' : ''}`;
    li.setAttribute('data-id', taskObj.id);

    const span = document.createElement('span');
    span.className = 'task-text';
    span.textContent = taskObj.task;

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-btn';
    deleteBtn.innerHTML = '<i class="bi bi-trash"></i>';

    li.appendChild(span);
    li.appendChild(deleteBtn);

    // Append to the appropriate task container based on category
    if (taskObj.category === 'daily') {
        dailyTaskContainer.appendChild(li);
    } else if (taskObj.category === 'monthly') {
        monthlyTaskContainer.appendChild(li);
    }
}

// Get all tasks and render them in their respective containers
function getAllTasks() {
    dailyTaskContainer.innerHTML = '';
    monthlyTaskContainer.innerHTML = '';
    taskArray.forEach(task => {
        createTaskElement(task);
    });
}

// Add Task
function addTask() {
    const userInput = inputBox.value.trim();
    if (userInput.length === 0) {
        showAlert('Please enter a valid task.', 'danger');
        return;
    }

    const taskId = Date.now().toString();
    const category = getCurrentCategory(); // Determine the current category
    const taskObj = {
        task: userInput,
        isCompleted: false,
        id: taskId,
        category: category
    };

    taskArray.push(taskObj);
    setItems();
    createTaskElement(taskObj);
    inputBox.value = '';
    inputBox.focus();

    showAlert('Task added successfully!', 'success');
    allCompletedAlertShown[category] = false; // Reset the alert flag for the category
}

// Show Toast Alert
function showAlert(message, type) {
    toastMessage.textContent = message;
    toastEl.classList.remove('bg-primary', 'bg-success', 'bg-danger', 'bg-warning', 'bg-info');
    toastEl.classList.add(`bg-${type}`);
    toast.show();
}

// Get the currently active category based on the active tab
function getCurrentCategory() {
    const dailyTab = document.getElementById('daily-tab');
    const monthlyTab = document.getElementById('monthly-tab');
    return dailyTab.classList.contains('active') ? 'daily' : 'monthly';
}

// Check if all tasks in the current category are completed
function checkAllCompleted() {
    const currentCategory = getCurrentCategory();
    const tasksInCategory = taskArray.filter(task => task.category === currentCategory);
    if (tasksInCategory.length === 0) return; // No tasks to check
    const allCompleted = tasksInCategory.every(task => task.isCompleted);
    if (allCompleted && !allCompletedAlertShown[currentCategory]) {
        showAlert('You have successfully completed your ' + (currentCategory === 'daily' ? 'daily' : 'monthly') + ' tasks. All the best!', 'success');
        allCompletedAlertShown[currentCategory] = true;

        // Reset all tasks to not completed after the toast is shown
        // Use Bootstrap's toast hidden event to ensure the reset happens after the toast disappears
        toastEl.addEventListener('hidden.bs.toast', () => resetAllTasks(currentCategory), { once: true });
    }
}

// Reset all tasks in a specific category to not completed
function resetAllTasks(category) {
    // Reset all tasks in the specified category
    taskArray = taskArray.map(task => {
        if (task.category === category) {
            return { ...task, isCompleted: false };
        }
        return task;
    });
    setItems();
    getAllTasks();

    showAlert('All ' + (category === 'daily' ? 'daily' : 'monthly') + ' tasks have been reset. Keep up the good work!', 'info');
}

// Toggle Task Completion
function toggleTaskCompletion(id) {
    taskArray = taskArray.map(task => {
        if (task.id === id) {
            return { ...task, isCompleted: !task.isCompleted };
        }
        return task;
    });
    setItems();
    getAllTasks();
    checkAllCompleted(); // Check after toggling
}

// Remove Task with Confirmation Modal
function removeTask(id) {
    taskIdToDelete = id;
    deleteConfirmModal.show();
}

// Confirm Deletion
confirmDeleteBtn.addEventListener('click', () => {
    if (taskIdToDelete) {
        taskArray = taskArray.filter(task => task.id !== taskIdToDelete);
        setItems();
        getAllTasks();
        showAlert('Task deleted successfully!', 'success');
        taskIdToDelete = null;
        deleteConfirmModal.hide();
        checkAllCompleted(); 
    }
});

// Add Task Event Listeners
addButton.addEventListener('click', addTask);

inputBox.addEventListener('keyup', (e) => {
    if (e.key === 'Enter') {
        addTask();
    }
});

dailyTaskContainer.addEventListener('click', (e) => {
    handleTaskClick(e, 'daily');
});

monthlyTaskContainer.addEventListener('click', (e) => {
    handleTaskClick(e, 'monthly');
});

// Handle task click events
function handleTaskClick(e, category) {
    const parentLi = e.target.closest('li');
    if (!parentLi) return;
    const taskId = parentLi.getAttribute('data-id');

    // If delete button is clicked
    if (e.target.closest('.delete-btn')) {
        removeTask(taskId);
    }
    // If task text is clicked
    else if (e.target.classList.contains('task-text') || e.target.classList.contains('task-item')) {
        toggleTaskCompletion(taskId);
    }
}

// Initial Render
getAllTasks();
checkAllCompleted(); // Check on initial load

// Listen for tab change to update focus or other behaviors if needed
const taskTabs = document.getElementById('taskTabs');
taskTabs.addEventListener('shown.bs.tab', () => {
    inputBox.focus();
});
