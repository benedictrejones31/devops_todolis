let tasks = [];
let currentFilter = { tab: 'all', category: 'all', priority: 'all' };
let editingTaskId = null;

// Theme Toggle
const themeToggle = document.getElementById('themeToggle');
const currentTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-theme', currentTheme);
updateThemeIcon();

themeToggle.addEventListener('click', () => {
    const theme = document.documentElement.getAttribute('data-theme');
    const newTheme = theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon();
});

function updateThemeIcon() {
    const theme = document.documentElement.getAttribute('data-theme');
    themeToggle.innerHTML = theme === 'light' 
        ? '<i class="fas fa-moon"></i>' 
        : '<i class="fas fa-sun"></i>';
}

// Load tasks on page load
document.addEventListener('DOMContentLoaded', () => {
    loadTasks();
    setupEventListeners();
});

function setupEventListeners() {
    // Form submission
    document.getElementById('taskForm').addEventListener('submit', handleAddTask);
    document.getElementById('editTaskForm').addEventListener('submit', handleEditTask);
    
    // Search
    document.getElementById('searchInput').addEventListener('input', filterAndRenderTasks);
    
    // Filters
    document.getElementById('filterCategory').addEventListener('change', (e) => {
        currentFilter.category = e.target.value;
        filterAndRenderTasks();
    });
    
    document.getElementById('filterPriority').addEventListener('change', (e) => {
        currentFilter.priority = e.target.value;
        filterAndRenderTasks();
    });
    
    document.getElementById('sortBy').addEventListener('change', filterAndRenderTasks);
    
    // Tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            currentFilter.tab = tab.dataset.tab;
            filterAndRenderTasks();
        });
    });
    
    // Modal
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });
}

async function loadTasks() {
    try {
        const response = await fetch('/api/tasks');
        tasks = await response.json();
        filterAndRenderTasks();
    } catch (error) {
        console.error('Error loading tasks:', error);
    }
}

async function handleAddTask(e) {
    e.preventDefault();
    
    const taskData = {
        title: document.getElementById('taskTitle').value,
        description: document.getElementById('taskDescription').value,
        priority: document.getElementById('taskPriority').value,
        category: document.getElementById('taskCategory').value,
        deadline: document.getElementById('taskDeadline').value
    };
    
    try {
        const response = await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(taskData)
        });
        
        const newTask = await response.json();
        tasks.push(newTask);
        e.target.reset();
        filterAndRenderTasks();
    } catch (error) {
        console.error('Error adding task:', error);
    }
}

async function handleEditTask(e) {
    e.preventDefault();
    
    const taskData = {
        title: document.getElementById('editTaskTitle').value,
        description: document.getElementById('editTaskDescription').value,
        priority: document.getElementById('editTaskPriority').value,
        category: document.getElementById('editTaskCategory').value,
        deadline: document.getElementById('editTaskDeadline').value
    };
    
    try {
        const response = await fetch(`/api/tasks/${editingTaskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(taskData)
        });
        
        const updatedTask = await response.json();
        const index = tasks.findIndex(t => t.id === editingTaskId);
        tasks[index] = updatedTask;
        closeModal();
        filterAndRenderTasks();
    } catch (error) {
        console.error('Error updating task:', error);
    }
}

async function toggleTaskComplete(taskId) {
    const task = tasks.find(t => t.id === taskId);
    task.completed = !task.completed;
    
    try {
        await fetch(`/api/tasks/${taskId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(task)
        });
        filterAndRenderTasks();
    } catch (error) {
        console.error('Error toggling task:', error);
    }
}

async function deleteTask(taskId) {
    if (!confirm('Are you sure you want to delete this task?')) return;
    
    try {
        await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
        tasks = tasks.filter(t => t.id !== taskId);
        filterAndRenderTasks();
    } catch (error) {
        console.error('Error deleting task:', error);
    }
}

function editTask(taskId) {
    const task = tasks.find(t => t.id === taskId);
    editingTaskId = taskId;
    
    document.getElementById('editTaskId').value = task.id;
    document.getElementById('editTaskTitle').value = task.title;
    document.getElementById('editTaskDescription').value = task.description;
    document.getElementById('editTaskPriority').value = task.priority;
    document.getElementById('editTaskCategory').value = task.category;
    document.getElementById('editTaskDeadline').value = task.deadline;
    
    document.getElementById('editModal').classList.add('active');
}

function closeModal() {
    document.getElementById('editModal').classList.remove('active');
    editingTaskId = null;
}

function filterAndRenderTasks() {
    let filteredTasks = [...tasks];
    
    // Search filter
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    if (searchTerm) {
        filteredTasks = filteredTasks.filter(task => 
            task.title.toLowerCase().includes(searchTerm) ||
            task.description.toLowerCase().includes(searchTerm)
        );
    }
    
    // Tab filter
    if (currentFilter.tab === 'active') {
        filteredTasks = filteredTasks.filter(task => !task.completed);
    } else if (currentFilter.tab === 'completed') {
        filteredTasks = filteredTasks.filter(task => task.completed);
    }
    
    // Category filter
    if (currentFilter.category !== 'all') {
        filteredTasks = filteredTasks.filter(task => task.category === currentFilter.category);
    }
    
    // Priority filter
    if (currentFilter.priority !== 'all') {
        filteredTasks = filteredTasks.filter(task => task.priority === currentFilter.priority);
    }
    
    // Sort
    const sortBy = document.getElementById('sortBy').value;
    filteredTasks.sort((a, b) => {
        if (sortBy === 'priority') {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        } else if (sortBy === 'deadline') {
            return new Date(a.deadline) - new Date(b.deadline);
        } else {
            return new Date(b.created_at) - new Date(a.created_at);
        }
    });
    
    renderTasks(filteredTasks);
    updateProgress();
}

function renderTasks(tasksToRender) {
    const tasksList = document.getElementById('tasksList');
    const emptyState = document.getElementById('emptyState');
    
    if (tasksToRender.length === 0) {
        tasksList.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    tasksList.style.display = 'flex';
    emptyState.style.display = 'none';
    
    tasksList.innerHTML = tasksToRender.map(task => `
        <div class="task-item ${task.completed ? 'completed' : ''}">
            <div class="task-header">
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} 
                       onchange="toggleTaskComplete(${task.id})">
                <div class="task-title">${task.title}</div>
                <div class="task-badges">
                    <span class="badge priority-${task.priority}">${task.priority}</span>
                    <span class="badge category-badge">${task.category}</span>
                </div>
            </div>
            ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
            <div class="task-meta">
                ${task.deadline ? `<span><i class="fas fa-calendar"></i> ${formatDate(task.deadline)}</span>` : ''}
                <span><i class="fas fa-clock"></i> ${formatDate(task.created_at)}</span>
            </div>
            <div class="task-actions">
                <button class="btn-icon" onclick="editTask(${task.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-icon delete" onclick="deleteTask(${task.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>
    `).join('');
}

function updateProgress() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const percentage = total > 0 ? (completed / total * 100).toFixed(0) : 0;
    
    document.getElementById('progressPercent').textContent = `${percentage}%`;
    document.getElementById('progressFill').style.width = `${percentage}%`;
    document.getElementById('taskCount').textContent = `${total} task${total !== 1 ? 's' : ''}`;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
