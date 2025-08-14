// Global variables for data management
let performanceData = {
    sessions: [],
    currentMetrics: {
        speed: 0,
        stamina: 0,
        agility: 0,
        strength: 0
    },
    historicalData: generateSampleData()
};

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    initializeCharts();
    initializeFormHandlers();
    initializeAnalyticsControls();
    loadPerformanceData();
});

// Navigation functionality
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.content-section');

    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links and sections
            navLinks.forEach(l => l.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            
            // Add active class to clicked link
            this.classList.add('active');
            
            // Show corresponding section
            const targetSection = this.getAttribute('data-section');
            document.getElementById(targetSection).classList.add('active');
        });
    });
}

// Chart initialization
function initializeCharts() {
    // Dashboard performance chart
    const dashboardCtx = document.getElementById('dashboardChart');
    if (dashboardCtx) {
        new Chart(dashboardCtx, {
            type: 'line',
            data: {
                labels: getLast7Days(),
                datasets: [
                    {
                        label: 'Speed (km/h)',
                        data: getLastNDays(performanceData.historicalData.speed, 7),
                        borderColor: '#ff6b6b',
                        backgroundColor: 'rgba(255, 107, 107, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Stamina (%)',
                        data: getLastNDays(performanceData.historicalData.stamina, 7),
                        borderColor: '#4ecdc4',
                        backgroundColor: 'rgba(78, 205, 196, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Strength (kg/2)',
                        data: getLastNDays(performanceData.historicalData.strength, 7).map(val => val / 2),
                        borderColor: '#f093fb',
                        backgroundColor: 'rgba(240, 147, 251, 0.1)',
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    },
                    x: {
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    }
                },
                elements: {
                    point: {
                        radius: 5,
                        hoverRadius: 8
                    }
                }
            }
        });
    }


    // Trajectory chart
    const trajectoryCtx = document.getElementById('trajectoryChart');
    if (trajectoryCtx) {
        new Chart(trajectoryCtx, {
            type: 'radar',
            data: {
                labels: ['Speed', 'Stamina', 'Agility', 'Strength', 'Consistency'],
                datasets: [
                    {
                        label: 'Current Performance',
                        data: [85, 80, 75, 90, 85],
                        borderColor: '#667eea',
                        backgroundColor: 'rgba(102, 126, 234, 0.2)',
                        pointBackgroundColor: '#667eea'
                    },
                    {
                        label: 'Previous Peak',
                        data: [80, 85, 80, 85, 90],
                        borderColor: '#e74c3c',
                        backgroundColor: 'rgba(231, 76, 60, 0.1)',
                        pointBackgroundColor: '#e74c3c'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }
}

// Form handling
function initializeFormHandlers() {
    // Performance logging form
    const performanceForm = document.querySelector('.performance-form');
    if (performanceForm) {
        performanceForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handlePerformanceSubmission();
        });
    }

    // Sport selection handling
    const sportOptions = document.querySelectorAll('input[name="sport"]');
    sportOptions.forEach(option => {
        option.addEventListener('change', function() {
            switchSportForm(this.value);
        });
    });

    // Set today's date as default for both forms
    const footballDateInput = document.getElementById('football-session-date');
    const cricketDateInput = document.getElementById('cricket-session-date');
    const today = new Date().toISOString().split('T')[0];

    if (footballDateInput) footballDateInput.value = today;
    if (cricketDateInput) cricketDateInput.value = today;

    // Video upload handling
    const videoUpload = document.getElementById('videoUpload');
    const videoFile = document.getElementById('videoFile');
    
    if (videoUpload && videoFile) {
        videoUpload.addEventListener('click', () => videoFile.click());
        
        videoFile.addEventListener('change', function(e) {
            if (e.target.files.length > 0) {
                handleVideoUpload(e.target.files[0]);
            }
        });

        // Drag and drop functionality
        videoUpload.addEventListener('dragover', function(e) {
            e.preventDefault();
            this.style.backgroundColor = 'rgba(102, 126, 234, 0.1)';
        });

        videoUpload.addEventListener('dragleave', function(e) {
            e.preventDefault();
            this.style.backgroundColor = '';
        });

        videoUpload.addEventListener('drop', function(e) {
            e.preventDefault();
            this.style.backgroundColor = '';
            const files = e.dataTransfer.files;
            if (files.length > 0 && files[0].type.startsWith('video/')) {
                handleVideoUpload(files[0]);
            }
        });
    }
}

// Analytics controls
function initializeAnalyticsControls() {
    // Time range buttons
    const timeButtons = document.querySelectorAll('.time-btn');
    timeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            timeButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const range = this.getAttribute('data-range');
            updateAnalyticsCharts(range);
        });
    });

    // Compare with peak button
    const compareBtn = document.getElementById('compareWithPeak');
    if (compareBtn) {
        compareBtn.addEventListener('click', function() {
            showPeakComparison();
        });
    }

    // Report generation
    const generateReportBtn = document.getElementById('generateReport');
    if (generateReportBtn) {
        generateReportBtn.addEventListener('click', function() {
            generatePerformanceReport();
        });
    }
}

// Performance data handling
function handlePerformanceSubmission() {
    const formData = {
        sessionType: document.getElementById('session-type').value,
        date: document.getElementById('session-date').value,
        duration: document.getElementById('duration').value,
        speed: document.getElementById('speed').value,
        stamina: document.getElementById('stamina').value,
        agility: document.getElementById('agility').value,
        strength: document.getElementById('strength').value,
        sportStat1: document.getElementById('sport-stat1').value,
        sportStat2: document.getElementById('sport-stat2').value,
        notes: document.getElementById('notes').value
    };

    // Validate required fields
    if (!formData.sessionType || !formData.date) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }

    // Save to performance data
    performanceData.sessions.push({
        ...formData,
        id: Date.now(),
        timestamp: new Date()
    });

    // Update current metrics if provided
    if (formData.speed) performanceData.currentMetrics.speed = parseFloat(formData.speed);
    if (formData.stamina) performanceData.currentMetrics.stamina = parseFloat(formData.stamina);
    if (formData.agility) performanceData.currentMetrics.agility = parseFloat(formData.agility);
    if (formData.strength) performanceData.currentMetrics.strength = parseFloat(formData.strength);

    // Update dashboard metrics
    updateDashboardMetrics();

    // Clear form
    document.querySelector('.performance-form').reset();
    document.getElementById('session-date').value = new Date().toISOString().split('T')[0];

    showNotification('Performance logged successfully!', 'success');
}

function updateDashboardMetrics() {
    const metrics = performanceData.currentMetrics;
    
    // Update metric cards
    const speedValue = document.querySelector('.speed-card .metric-value');
    const staminaValue = document.querySelector('.stamina-card .metric-value');
    const agilityValue = document.querySelector('.agility-card .metric-value');
    const strengthValue = document.querySelector('.strength-card .metric-value');

    if (speedValue) speedValue.textContent = `${metrics.speed} km/h`;
    if (staminaValue) staminaValue.textContent = `${metrics.stamina}%`;
    if (agilityValue) agilityValue.textContent = `${metrics.agility}s`;
    if (strengthValue) strengthValue.textContent = `${metrics.strength}kg`;
}

// Video upload handling
function handleVideoUpload(file) {
    const uploadZone = document.getElementById('videoUpload');
    const originalContent = uploadZone.innerHTML;
    
    // Show upload progress
    uploadZone.innerHTML = `
        <i class="fas fa-spinner fa-spin"></i>
        <p>Analyzing video...</p>
        <div style="background: #e1e8ed; border-radius: 10px; height: 8px; margin: 1rem 0;">
            <div style="background: #667eea; height: 100%; border-radius: 10px; width: 0%; transition: width 2s ease;" id="uploadProgress"></div>
        </div>
    `;

    // Simulate upload progress
    const progressBar = document.getElementById('uploadProgress');
    let progress = 0;
    const interval = setInterval(() => {
        progress += 20;
        progressBar.style.width = `${progress}%`;
        
        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                uploadZone.innerHTML = originalContent;
                showNotification('Video analysis complete! Check the analysis results below.', 'success');
                addVideoAnalysisResult(file.name);
            }, 1000);
        }
    }, 400);
}

function addVideoAnalysisResult(fileName) {
    const analysisResults = document.querySelector('.video-analysis-results');
    const newAnalysis = document.createElement('div');
    newAnalysis.className = 'analysis-item';
    newAnalysis.innerHTML = `
        <div class="analysis-preview">
            <i class="fas fa-play-circle"></i>
            <span>${fileName} - ${new Date().toLocaleDateString()}</span>
        </div>
        <div class="analysis-insights">
            <p><strong>Key Insights:</strong> Good form detected, consider slight adjustment in posture for optimal performance</p>
            <p><strong>Recommendation:</strong> Focus on core strengthening exercises to improve stability</p>
        </div>
    `;
    
    analysisResults.appendChild(newAnalysis);
}

// Utility functions
function generateSampleData() {
    const days = 30;
    const speed = [];
    const stamina = [];
    const strength = [];

    for (let i = 0; i < days; i++) {
        speed.push(0);
        stamina.push(0);
        strength.push(0);
    }

    return { speed, stamina, strength };
}

function getLast30Days() {
    const dates = [];
    for (let i = 29; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }
    return dates;
}

function getLast7Days() {
    const dates = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dates.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
    }
    return dates;
}

function getLastNDays(data, n) {
    return data.slice(-n);
}


function updateAnalyticsCharts(range) {
    // This would update charts based on the selected time range
    showNotification(`Updated analytics for ${range} days`, 'info');
}

function showPeakComparison() {
    showNotification('Comparing with your previous peak performance from 2 weeks ago', 'info');
}

function generatePerformanceReport() {
    const reportType = document.querySelector('input[name="reportType"]:checked').value;
    showNotification(`Generating ${reportType} performance report...`, 'info');
    
    // Simulate report generation
    setTimeout(() => {
        showNotification(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report generated successfully!`, 'success');
    }, 2000);
}

function loadPerformanceData() {
    // Load data from localStorage if available
    const savedData = localStorage.getItem('athleteTrackerData');
    if (savedData) {
        try {
            const parsed = JSON.parse(savedData);
            performanceData = { ...performanceData, ...parsed };
            updateDashboardMetrics();
        } catch (e) {
            console.error('Error loading saved data:', e);
        }
    }
}

function savePerformanceData() {
    // Save data to localStorage
    localStorage.setItem('athleteTrackerData', JSON.stringify(performanceData));
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">×</button>
    `;
    
    // Add styles if not exist
    if (!document.querySelector('#notification-styles')) {
        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification {
                position: fixed;
                top: 100px;
                right: 20px;
                background: white;
                border-radius: 8px;
                padding: 1rem 1.5rem;
                box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                display: flex;
                align-items: center;
                gap: 0.5rem;
                z-index: 10000;
                max-width: 400px;
                animation: slideIn 0.3s ease;
            }
            .notification button {
                background: none;
                border: none;
                font-size: 1.2rem;
                cursor: pointer;
                margin-left: auto;
                color: #666;
            }
            .notification-success { border-left: 4px solid #27ae60; }
            .notification-error { border-left: 4px solid #e74c3c; }
            .notification-info { border-left: 4px solid #667eea; }
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(styles);
    }
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Save data periodically
setInterval(savePerformanceData, 30000); // Save every 30 seconds

// Save data before page unload
window.addEventListener('beforeunload', savePerformanceData);
