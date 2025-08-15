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

// Backend API configuration
const API_BASE_URL = 'http://localhost:5000/api';

// API helper functions
async function apiCall(endpoint, method = 'GET', data = null) {
    try {
        const config = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (data) {
            config.body = JSON.stringify(data);
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('API call failed:', error);
        throw error;
    }
}

// NGO Help Centre data
let ngoData = {
    ngos: generateNGOData(),
    applications: generateApplicationData(),
    conversations: generateConversationData(),
    opportunities: generateOpportunityData()
};

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    initializeNavigation();
    initializeCharts();
    initializeFormHandlers();
    initializeAnalyticsControls();
    initializeNGOHelp();
    loadPerformanceData();
});

// Navigation functionality
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('.content-section');
    const hamburgerMenu = document.getElementById('hamburgerMenu');
    const navMenu = document.getElementById('navMenu');

    // Navigation link handling
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

            // Close mobile menu if open
            if (navMenu && navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                hamburgerMenu.classList.remove('active');
            }
        });
    });

    // Hamburger menu handling
    if (hamburgerMenu && navMenu) {
        hamburgerMenu.addEventListener('click', function() {
            this.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!hamburgerMenu.contains(e.target) && !navMenu.contains(e.target)) {
                navMenu.classList.remove('active');
                hamburgerMenu.classList.remove('active');
            }
        });
    }
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


    // Progress trajectory chart
    const trajectoryCtx = document.getElementById('trajectoryChart');
    if (trajectoryCtx) {
        new Chart(trajectoryCtx, {
            type: 'bar',
            data: {
                labels: ['Speed', 'Stamina', 'Agility', 'Strength'],
                datasets: [{
                    label: 'Current Performance',
                    data: [performanceData.currentMetrics.speed || 0,
                           performanceData.currentMetrics.stamina || 0,
                           performanceData.currentMetrics.agility || 0,
                           performanceData.currentMetrics.strength || 0],
                    backgroundColor: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f093fb'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
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

// Sport form switching
function switchSportForm(sport) {
    const footballForm = document.getElementById('football-form');
    const cricketForm = document.getElementById('cricket-form');

    if (sport === 'football') {
        footballForm.classList.add('active');
        cricketForm.classList.remove('active');
    } else if (sport === 'cricket') {
        cricketForm.classList.add('active');
        footballForm.classList.remove('active');
    }
}

// Performance data handling
async function handlePerformanceSubmission() {
    try {
        const selectedSportElement = document.querySelector('input[name="sport"]:checked');
        if (!selectedSportElement) {
            showNotification('Please select a sport', 'error');
            return;
        }

        const selectedSport = selectedSportElement.value;
        let formData = {};

        if (selectedSport === 'football') {
            const sessionType = document.getElementById('football-session-type');
            const date = document.getElementById('football-session-date');

            if (!sessionType || !date) {
                showNotification('Form elements not found. Please refresh the page.', 'error');
                return;
            }

            formData = {
                sport: 'football',
                session_type: sessionType.value,
                date: date.value,
                duration: document.getElementById('football-duration')?.value || null,
                speed: document.getElementById('football-speed')?.value || null,
                stamina: document.getElementById('football-stamina')?.value || null,
                agility: document.getElementById('football-agility')?.value || null,
                strength: document.getElementById('football-strength')?.value || null,
                goals: document.getElementById('football-goals')?.value || null,
                assists: document.getElementById('football-assists')?.value || null,
                notes: document.getElementById('notes')?.value || ''
            };

            // Convert empty strings to null for numeric fields
            ['duration', 'speed', 'stamina', 'agility', 'strength', 'goals', 'assists'].forEach(field => {
                if (formData[field] === '' || formData[field] === '0') {
                    formData[field] = null;
                } else if (formData[field] !== null) {
                    formData[field] = parseFloat(formData[field]);
                }
            });

        } else if (selectedSport === 'cricket') {
            const sessionType = document.getElementById('cricket-session-type');
            const date = document.getElementById('cricket-session-date');

            if (!sessionType || !date) {
                showNotification('Form elements not found. Please refresh the page.', 'error');
                return;
            }

            formData = {
                sport: 'cricket',
                session_type: sessionType.value,
                date: date.value,
                duration: document.getElementById('cricket-duration')?.value || null,
                wickets: document.getElementById('cricket-wickets')?.value || null,
                runs: document.getElementById('cricket-runs')?.value || null,
                notes: document.getElementById('notes')?.value || ''
            };

            // Convert empty strings to null for numeric fields
            ['duration', 'wickets', 'runs'].forEach(field => {
                if (formData[field] === '' || formData[field] === '0') {
                    formData[field] = null;
                } else if (formData[field] !== null) {
                    formData[field] = parseInt(formData[field]);
                }
            });
        }

        // Validate required fields
        if (!formData.session_type || !formData.date) {
            showNotification('Please fill in all required fields (Session Type and Date)', 'error');
            return;
        }

        // Submit to backend
        showNotification('Submitting performance data...', 'info');

        const response = await apiCall('/performance', 'POST', formData);

        if (response.entry) {
            // Update local data
            performanceData.sessions.push(response.entry);

            // Update current metrics if it's football data
            if (selectedSport === 'football' && response.entry) {
                if (response.entry.speed) performanceData.currentMetrics.speed = response.entry.speed;
                if (response.entry.stamina) performanceData.currentMetrics.stamina = response.entry.stamina;
                if (response.entry.agility) performanceData.currentMetrics.agility = response.entry.agility;
                if (response.entry.strength) performanceData.currentMetrics.strength = response.entry.strength;

                updateDashboardMetrics();
            }

            // Clear form
            clearFormFields(selectedSport);

            showNotification(`${selectedSport.charAt(0).toUpperCase() + selectedSport.slice(1)} performance logged successfully!`, 'success');

            // Refresh dashboard data
            await loadDashboardData();
        }

    } catch (error) {
        console.error('Error submitting performance data:', error);
        showNotification('Failed to submit performance data. Please check your connection and try again.', 'error');
    }
}

function clearFormFields(sport) {
    const today = new Date().toISOString().split('T')[0];

    if (sport === 'football') {
        document.getElementById('football-session-type').value = '';
        document.getElementById('football-session-date').value = today;
        document.getElementById('football-duration').value = '';
        document.getElementById('football-speed').value = '';
        document.getElementById('football-stamina').value = '';
        document.getElementById('football-agility').value = '';
        document.getElementById('football-strength').value = '';
        document.getElementById('football-goals').value = '';
        document.getElementById('football-assists').value = '';
    } else if (sport === 'cricket') {
        document.getElementById('cricket-session-type').value = '';
        document.getElementById('cricket-session-date').value = today;
        document.getElementById('cricket-duration').value = '';
        document.getElementById('cricket-wickets').value = '';
        document.getElementById('cricket-runs').value = '';
    }

    // Clear notes if it exists
    const notesField = document.getElementById('notes');
    if (notesField) notesField.value = '';
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

// Generate sample NGO data
function generateNGOData() {
    return [
        {
            id: 'ngo-1',
            name: 'Sports4All Foundation',
            mission: 'Empowering underprivileged athletes with equipment, training, and financial support to achieve their sporting dreams.',
            sports: ['football', 'cricket', 'athletics'],
            aidTypes: ['financial', 'equipment', 'training'],
            locations: ['mumbai', 'delhi', 'pune'],
            athletesHelped: 1247,
            successRate: 89,
            totalAid: '₹45L',
            established: 2015
        },
        {
            id: 'ngo-2',
            name: 'Future Champions Trust',
            mission: 'Building tomorrow\'s champions by providing comprehensive support for young athletes in their journey to excellence.',
            sports: ['cricket', 'tennis', 'basketball'],
            aidTypes: ['financial', 'career', 'medical'],
            locations: ['bangalore', 'chennai', 'nationwide'],
            athletesHelped: 892,
            successRate: 94,
            totalAid: '₹32L',
            established: 2012
        },
        {
            id: 'ngo-3',
            name: 'Athletic Dreams Initiative',
            mission: 'Breaking barriers in sports by providing equal opportunities for athletes from all backgrounds.',
            sports: ['football', 'athletics', 'basketball'],
            aidTypes: ['equipment', 'training', 'career'],
            locations: ['kolkata', 'mumbai', 'delhi'],
            athletesHelped: 654,
            successRate: 87,
            totalAid: '₹28L',
            established: 2018
        },
        {
            id: 'ngo-4',
            name: 'Elite Sports Foundation',
            mission: 'Supporting elite athletes with medical care, nutrition, and performance enhancement programs.',
            sports: ['tennis', 'athletics', 'cricket'],
            aidTypes: ['medical', 'financial', 'training'],
            locations: ['nationwide'],
            athletesHelped: 423,
            successRate: 92,
            totalAid: '₹18L',
            established: 2020
        },
        {
            id: 'ngo-5',
            name: 'Grassroots Sports Network',
            mission: 'Nurturing talent at the grassroots level with community-based sports development programs.',
            sports: ['football', 'cricket', 'basketball'],
            aidTypes: ['equipment', 'training', 'financial'],
            locations: ['mumbai', 'pune', 'nashik'],
            athletesHelped: 1156,
            successRate: 85,
            totalAid: '₹38L',
            established: 2014
        },
        {
            id: 'ngo-6',
            name: 'Women in Sports Foundation',
            mission: 'Promoting women\'s participation in sports through specialized support and empowerment programs.',
            sports: ['athletics', 'tennis', 'cricket'],
            aidTypes: ['financial', 'career', 'equipment'],
            locations: ['delhi', 'bangalore', 'mumbai'],
            athletesHelped: 789,
            successRate: 91,
            totalAid: '₹25L',
            established: 2016
        }
    ];
}

function generateApplicationData() {
    return [
        {
            id: 'app-1',
            ngoName: 'Sports4All Foundation',
            aidType: 'Equipment Support',
            description: 'Need football boots and training gear for upcoming district championship.',
            status: 'Under Review',
            progress: 1.5,
            dateApplied: '2024-01-10'
        },
        {
            id: 'app-2',
            ngoName: 'Future Champions Trust',
            aidType: 'Financial Aid',
            description: 'Seeking support for cricket academy fees and coaching expenses.',
            status: 'Approved',
            progress: 3,
            dateApplied: '2024-01-05'
        },
        {
            id: 'app-3',
            ngoName: 'Elite Sports Foundation',
            aidType: 'Medical Support',
            description: 'Require physiotherapy support for knee injury recovery.',
            status: 'Delivered',
            progress: 4,
            dateApplied: '2023-12-20'
        }
    ];
}

function generateConversationData() {
    return [
        {
            id: 'conv-1',
            ngoName: 'Sports4All Foundation',
            lastMessage: 'We have reviewed your application and would like to schedule a call.',
            unread: true
        },
        {
            id: 'conv-2',
            ngoName: 'Future Champions Trust',
            lastMessage: 'Congratulations! Your financial aid has been approved.',
            unread: false
        },
        {
            id: 'conv-3',
            ngoName: 'Elite Sports Foundation',
            lastMessage: 'Please share your latest medical reports for review.',
            unread: true
        }
    ];
}

function generateOpportunityData() {
    return [
        {
            id: 'opp-1',
            title: 'Young Athlete Scholarship Program',
            ngoName: 'Sports4All Foundation',
            type: 'Scholarship',
            description: 'Full scholarship covering training, equipment, and competition expenses for promising young athletes.',
            eligibility: ['Age 16-22', 'District level player', 'Financial need'],
            deadline: '2024-02-15',
            amount: '₹2,00,000'
        },
        {
            id: 'opp-2',
            title: 'Elite Training Camp',
            ngoName: 'Future Champions Trust',
            type: 'Training',
            description: 'Intensive 3-month training camp with national level coaches and sports scientists.',
            eligibility: ['State level player', 'Age 18-25', 'Medical clearance'],
            deadline: '2024-02-28',
            amount: 'Full sponsorship'
        },
        {
            id: 'opp-3',
            title: 'Equipment Donation Drive',
            ngoName: 'Athletic Dreams Initiative',
            type: 'Equipment',
            description: 'Free distribution of sports equipment including shoes, clothing, and training gear.',
            eligibility: ['Any age', 'Active athlete', 'Income certificate'],
            deadline: '2024-03-10',
            amount: 'Up to ₹15,000'
        },
        {
            id: 'opp-4',
            title: 'Sports Injury Recovery Program',
            ngoName: 'Elite Sports Foundation',
            type: 'Medical',
            description: 'Comprehensive injury recovery program with physiotherapy and medical support.',
            eligibility: ['Injured athlete', 'Medical reports', 'Coach recommendation'],
            deadline: 'Ongoing',
            amount: 'Full medical coverage'
        }
    ];
}


async function updateAnalyticsCharts(range) {
    try {
        showNotification(`Loading analytics for ${range} days...`, 'info');

        const response = await apiCall(`/analytics/charts?days=${range}`);
        if (response) {
            updateTrajectoryChart(response);
            showNotification(`Updated analytics for ${range} days`, 'success');
        }
    } catch (error) {
        console.error('Failed to update analytics:', error);
        showNotification('Failed to load analytics data', 'error');
    }
}

function updateTrajectoryChart(chartData) {
    const trajectoryCtx = document.getElementById('trajectoryChart');
    if (!trajectoryCtx || !window.Chart) return;

    // Destroy existing chart if it exists
    if (window.trajectoryChart) {
        window.trajectoryChart.destroy();
    }

    // Use the latest data points for current performance
    const latestIndex = chartData.labels.length - 1;
    const currentData = [
        chartData.speed_data[latestIndex] || 0,
        chartData.stamina_data[latestIndex] || 0,
        chartData.agility_data[latestIndex] || 0,
        chartData.strength_data[latestIndex] || 0
    ];

    window.trajectoryChart = new Chart(trajectoryCtx, {
        type: 'bar',
        data: {
            labels: ['Speed', 'Stamina', 'Agility', 'Strength'],
            datasets: [{
                label: 'Current Performance',
                data: currentData,
                backgroundColor: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#f093fb'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0,0,0,0.1)'
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}

async function showPeakComparison() {
    try {
        showNotification('Loading performance insights...', 'info');

        const response = await apiCall('/analytics/insights');
        if (response && response.insights) {
            displayInsights(response.insights);
            showNotification('Performance insights loaded', 'success');
        }
    } catch (error) {
        console.error('Failed to load insights:', error);
        showNotification('Comparing with your previous peak performance from 2 weeks ago', 'info');
    }
}

function displayInsights(insights) {
    // Update the insights panel with backend-generated insights
    const insightsGrid = document.querySelector('.insights-grid');
    if (!insightsGrid) return;

    insightsGrid.innerHTML = insights.map(insight => `
        <div class="insight-card">
            <i class="fas fa-${getInsightIcon(insight.type)}"></i>
            <div>
                <h4>${insight.title}</h4>
                <p>${insight.description}</p>
            </div>
        </div>
    `).join('');
}

function getInsightIcon(type) {
    switch (type) {
        case 'success': return 'trophy';
        case 'improvement': return 'arrow-up';
        case 'warning': return 'exclamation-triangle';
        case 'info': return 'info-circle';
        default: return 'lightbulb';
    }
}

async function generatePerformanceReport() {
    try {
        const reportType = document.querySelector('input[name="reportType"]:checked').value;
        showNotification(`Generating ${reportType} performance report...`, 'info');

        const response = await apiCall('/reports/generate', 'POST', {
            report_type: reportType,
            sport: 'football'
        });

        if (response) {
            updateReportPreview(response);
            showNotification(`${reportType.charAt(0).toUpperCase() + reportType.slice(1)} report generated successfully!`, 'success');
        }
    } catch (error) {
        console.error('Failed to generate report:', error);
        showNotification('Failed to generate report. Please try again.', 'error');
    }
}

function updateReportPreview(reportData) {
    const reportPreview = document.querySelector('.report-preview');
    if (!reportPreview) return;

    const period = reportData.period || 'Recent period';
    const summary = reportData.summary || {};
    const metrics = reportData.metrics || {};
    const recommendations = reportData.recommendations || [];

    reportPreview.innerHTML = `
        <h3>${reportData.report_type.charAt(0).toUpperCase() + reportData.report_type.slice(1)} Performance Report - ${period}</h3>

        <div class="report-summary">
            <div class="summary-metric">
                <h4>Training Sessions</h4>
                <span class="metric-number">${summary.total_sessions || 0}</span>
            </div>
            <div class="summary-metric">
                <h4>Total Duration</h4>
                <span class="metric-number">${summary.total_duration || 0} min</span>
            </div>
            <div class="summary-metric">
                <h4>Average Performance</h4>
                <span class="metric-number">${summary.average_performance || 0}%</span>
            </div>
        </div>

        ${metrics && Object.keys(metrics).length > 0 ? `
        <div class="report-metrics">
            <h4>Performance Metrics</h4>
            <div class="metrics-grid">
                ${metrics.average_speed ? `<div class="metric-item">Average Speed: ${metrics.average_speed} km/h</div>` : ''}
                ${metrics.average_stamina ? `<div class="metric-item">Average Stamina: ${metrics.average_stamina}%</div>` : ''}
                ${metrics.average_agility ? `<div class="metric-item">Average Agility: ${metrics.average_agility}s</div>` : ''}
                ${metrics.average_strength ? `<div class="metric-item">Average Strength: ${metrics.average_strength}kg</div>` : ''}
            </div>
        </div>
        ` : ''}

        <div class="report-recommendations">
            <h4>AI Training Recommendations</h4>
            <ul>
                ${recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
        </div>
    `;
}

async function loadPerformanceData() {
    try {
        // Try to load from backend first
        const response = await apiCall('/performance?days=30');
        if (response && response.entries) {
            performanceData.sessions = response.entries;

            // Update current metrics from latest football entry
            const latestFootballEntry = response.entries.find(entry =>
                entry.sport === 'football' &&
                (entry.speed || entry.stamina || entry.agility || entry.strength)
            );

            if (latestFootballEntry) {
                performanceData.currentMetrics = {
                    speed: latestFootballEntry.speed || 0,
                    stamina: latestFootballEntry.stamina || 0,
                    agility: latestFootballEntry.agility || 0,
                    strength: latestFootballEntry.strength || 0
                };
            }

            updateDashboardMetrics();
            console.log('Loaded performance data from backend');
        }
    } catch (error) {
        console.error('Failed to load from backend, trying localStorage:', error);

        // Fallback to localStorage
        const savedData = localStorage.getItem('athleteTrackerData');
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                performanceData = { ...performanceData, ...parsed };
                updateDashboardMetrics();
                console.log('Loaded performance data from localStorage');
            } catch (e) {
                console.error('Error loading saved data:', e);
            }
        }
    }
}

async function loadDashboardData() {
    try {
        const response = await apiCall('/dashboard/metrics');
        if (response) {
            performanceData.currentMetrics = response.current_metrics;
            updateDashboardMetrics();

            // Update chart if we have daily metrics
            if (response.daily_metrics) {
                updateDashboardChart(response.daily_metrics);
            }
        }
    } catch (error) {
        console.error('Failed to load dashboard data:', error);
    }
}

function updateDashboardChart(dailyMetrics) {
    const dashboardCtx = document.getElementById('dashboardChart');
    if (!dashboardCtx || !window.Chart) return;

    // Destroy existing chart if it exists
    if (window.dashboardChart) {
        window.dashboardChart.destroy();
    }

    const dates = Object.keys(dailyMetrics).slice(-7);
    const speedData = dates.map(date => dailyMetrics[date].speed);
    const staminaData = dates.map(date => dailyMetrics[date].stamina);
    const strengthData = dates.map(date => dailyMetrics[date].strength / 2); // Scale for better visualization

    window.dashboardChart = new Chart(dashboardCtx, {
        type: 'line',
        data: {
            labels: dates.map(date => {
                const d = new Date(date);
                return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            }),
            datasets: [
                {
                    label: 'Speed (km/h)',
                    data: speedData,
                    borderColor: '#ff6b6b',
                    backgroundColor: 'rgba(255, 107, 107, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Stamina (%)',
                    data: staminaData,
                    borderColor: '#4ecdc4',
                    backgroundColor: 'rgba(78, 205, 196, 0.1)',
                    tension: 0.4,
                    fill: true
                },
                {
                    label: 'Strength (kg/2)',
                    data: strengthData,
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

// NGO Help Centre initialization
function initializeNGOHelp() {
    initializeNGOTabs();
    initializeNGOSearch();
    populateNGODirectory();
    populateRecommendations();
    populateApplications();
    populateConversations();
    populateOpportunities();
    initializeModal();
    initializeImpactCharts();
}

// NGO Tab navigation
function initializeNGOTabs() {
    const ngoTabs = document.querySelectorAll('.ngo-tab');
    const ngoTabContents = document.querySelectorAll('.ngo-tab-content');

    ngoTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            // Remove active class from all tabs and contents
            ngoTabs.forEach(t => t.classList.remove('active'));
            ngoTabContents.forEach(content => content.classList.remove('active'));

            // Add active class to clicked tab
            this.classList.add('active');

            // Show corresponding content
            const targetTab = this.getAttribute('data-tab');
            document.getElementById(targetTab).classList.add('active');
        });
    });
}

// NGO Search and filters
function initializeNGOSearch() {
    const searchInput = document.getElementById('ngoSearch');
    const searchBtn = document.getElementById('searchBtn');
    const sportFilter = document.getElementById('sportFilter');
    const aidTypeFilter = document.getElementById('aidTypeFilter');
    const locationFilter = document.getElementById('locationFilter');
    const clearFiltersBtn = document.getElementById('clearFilters');

    function performSearch() {
        const searchTerm = searchInput.value.toLowerCase();
        const sport = sportFilter.value;
        const aidType = aidTypeFilter.value;
        const location = locationFilter.value;

        filterNGOs(searchTerm, sport, aidType, location);
    }

    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') performSearch();
    });

    sportFilter.addEventListener('change', performSearch);
    aidTypeFilter.addEventListener('change', performSearch);
    locationFilter.addEventListener('change', performSearch);

    clearFiltersBtn.addEventListener('click', function() {
        searchInput.value = '';
        sportFilter.value = '';
        aidTypeFilter.value = '';
        locationFilter.value = '';
        populateNGODirectory();
    });
}

// Filter NGOs based on criteria
function filterNGOs(searchTerm, sport, aidType, location) {
    const filteredNGOs = ngoData.ngos.filter(ngo => {
        const matchesSearch = !searchTerm ||
            ngo.name.toLowerCase().includes(searchTerm) ||
            ngo.mission.toLowerCase().includes(searchTerm);

        const matchesSport = !sport || ngo.sports.includes(sport);
        const matchesAidType = !aidType || ngo.aidTypes.includes(aidType);
        const matchesLocation = !location || ngo.locations.includes(location);

        return matchesSearch && matchesSport && matchesAidType && matchesLocation;
    });

    displayNGOs(filteredNGOs);
}

// Populate NGO directory
function populateNGODirectory() {
    displayNGOs(ngoData.ngos);
}

function displayNGOs(ngos) {
    const grid = document.getElementById('ngoDirectoryGrid');
    if (!grid) return;

    grid.innerHTML = ngos.map(ngo => `
        <div class="ngo-card" data-ngo-id="${ngo.id}">
            <div class="ngo-card-header">
                <div class="ngo-logo">${ngo.name.charAt(0)}</div>
                <div class="ngo-info">
                    <h4>${ngo.name}</h4>
                    <div class="ngo-verified">
                        <i class="fas fa-check-circle"></i>
                        Verified NGO
                    </div>
                </div>
            </div>
            <p class="ngo-mission">${ngo.mission}</p>
            <div class="ngo-tags">
                ${ngo.aidTypes.map(type => `<span class="ngo-tag">${type}</span>`).join('')}
            </div>
            <div class="ngo-stats">
                <div class="ngo-stat">
                    <div class="ngo-stat-number">${ngo.athletesHelped}</div>
                    <div class="ngo-stat-label">Athletes Helped</div>
                </div>
                <div class="ngo-stat">
                    <div class="ngo-stat-number">${ngo.successRate}%</div>
                    <div class="ngo-stat-label">Success Rate</div>
                </div>
            </div>
            <div class="ngo-actions">
                <button class="btn btn-secondary" onclick="viewNGODetails('${ngo.id}')">View Details</button>
                <button class="btn btn-primary" onclick="applyToNGO('${ngo.id}')">Apply</button>
            </div>
        </div>
    `).join('');
}

// Populate AI recommendations
function populateRecommendations() {
    const container = document.getElementById('recommendedNgos');
    if (!container) return;

    const topNGOs = getRecommendedNGOs();

    container.innerHTML = topNGOs.map((ngo, index) => `
        <div class="recommended-ngo-card">
            <div class="match-score">${ngo.matchScore}% Match</div>
            <div class="ngo-card-header">
                <div class="ngo-logo">${ngo.name.charAt(0)}</div>
                <div class="ngo-info">
                    <h4>${ngo.name}</h4>
                    <div class="ngo-verified">
                        <i class="fas fa-check-circle"></i>
                        Verified NGO
                    </div>
                </div>
            </div>
            <p class="ngo-mission">${ngo.mission}</p>
            <div class="ngo-tags">
                ${ngo.aidTypes.map(type => `<span class="ngo-tag">${type}</span>`).join('')}
            </div>
            <div class="ngo-actions">
                <button class="btn btn-primary" onclick="applyToNGO('${ngo.id}')">Apply Now</button>
            </div>
            <div style="margin-top: 1rem; padding: 1rem; background: rgba(102, 126, 234, 0.05); border-radius: 8px;">
                <strong>Why recommended:</strong> ${ngo.reason}
            </div>
        </div>
    `).join('');
}

// Get AI-recommended NGOs
function getRecommendedNGOs() {
    // Simulate AI matching based on athlete profile
    const athleteProfile = {
        sport: 'football',
        location: 'mumbai',
        needType: 'equipment',
        urgency: 'medium'
    };

    return ngoData.ngos
        .map(ngo => ({
            ...ngo,
            matchScore: calculateMatchScore(ngo, athleteProfile),
            reason: generateMatchReason(ngo, athleteProfile)
        }))
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 5);
}

function calculateMatchScore(ngo, profile) {
    let score = 0;

    if (ngo.sports.includes(profile.sport)) score += 30;
    if (ngo.locations.includes(profile.location) || ngo.locations.includes('nationwide')) score += 25;
    if (ngo.aidTypes.includes(profile.needType)) score += 35;
    score += Math.random() * 10; // Add some randomization

    return Math.min(Math.round(score), 98);
}

function generateMatchReason(ngo, profile) {
    const reasons = [];
    if (ngo.sports.includes(profile.sport)) reasons.push(`Specializes in ${profile.sport}`);
    if (ngo.locations.includes(profile.location)) reasons.push(`Active in ${profile.location}`);
    if (ngo.aidTypes.includes(profile.needType)) reasons.push(`Provides ${profile.needType} support`);

    return reasons.join(', ') || 'High success rate and positive reviews';
}

// Populate applications
function populateApplications() {
    const container = document.getElementById('applicationsList');
    if (!container) return;

    container.innerHTML = ngoData.applications.map(app => `
        <div class="application-card">
            <div class="application-header">
                <div>
                    <h4>${app.ngoName}</h4>
                    <p>${app.aidType} • Applied on ${app.dateApplied}</p>
                </div>
                <span class="application-status status-${app.status.toLowerCase().replace(' ', '-')}">${app.status}</span>
            </div>
            <p>${app.description}</p>
            <div class="application-progress">
                <div class="progress-steps">
                    <div class="progress-step">
                        <div class="step-circle ${app.progress >= 1 ? 'completed' : ''}">1</div>
                        <span>Submitted</span>
                    </div>
                    <div class="progress-step">
                        <div class="step-circle ${app.progress >= 2 ? 'completed' : app.progress === 1.5 ? 'active' : ''}">2</div>
                        <span>Under Review</span>
                    </div>
                    <div class="progress-step">
                        <div class="step-circle ${app.progress >= 3 ? 'completed' : app.progress === 2.5 ? 'active' : ''}">3</div>
                        <span>Decision</span>
                    </div>
                    <div class="progress-step">
                        <div class="step-circle ${app.progress >= 4 ? 'completed' : app.progress === 3.5 ? 'active' : ''}">4</div>
                        <span>Aid Delivery</span>
                    </div>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${(app.progress / 4) * 100}%"></div>
                </div>
            </div>
        </div>
    `).join('');
}

// Populate conversations
function populateConversations() {
    const container = document.getElementById('conversationItems');
    if (!container) return;

    container.innerHTML = ngoData.conversations.map(conv => `
        <div class="conversation-item" onclick="openConversation('${conv.id}')">
            <div class="conversation-avatar">${conv.ngoName.charAt(0)}</div>
            <div class="conversation-info">
                <h5>${conv.ngoName}</h5>
                <div class="conversation-preview">${conv.lastMessage}</div>
            </div>
        </div>
    `).join('');
}

// Populate opportunities
function populateOpportunities() {
    const container = document.getElementById('opportunitiesGrid');
    if (!container) return;

    container.innerHTML = ngoData.opportunities.map(opp => `
        <div class="opportunity-card">
            <span class="opportunity-badge">${opp.type}</span>
            <h4>${opp.title}</h4>
            <p><strong>By:</strong> ${opp.ngoName}</p>
            <p>${opp.description}</p>
            <div class="ngo-tags">
                ${opp.eligibility.map(req => `<span class="ngo-tag">${req}</span>`).join('')}
            </div>
            <div class="opportunity-deadline">Deadline: ${opp.deadline}</div>
            <button class="btn btn-primary" style="margin-top: 1rem;" onclick="applyToOpportunity('${opp.id}')">Apply</button>
        </div>
    `).join('');
}

// Modal functionality
function initializeModal() {
    const modal = document.getElementById('applicationModal');
    const newAppBtn = document.getElementById('newApplicationBtn');
    const closeModal = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelApplication');
    const form = document.getElementById('applicationForm');

    if (newAppBtn) {
        newAppBtn.addEventListener('click', function() {
            populateNGODropdown();
            modal.style.display = 'block';
        });
    }

    if (closeModal) {
        closeModal.addEventListener('click', function() {
            modal.style.display = 'none';
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            modal.style.display = 'none';
        });
    }

    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            submitApplication();
        });
    }

    // Close modal when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

function populateNGODropdown() {
    const select = document.getElementById('selectedNgo');
    if (!select) return;

    select.innerHTML = '<option value="">Choose an NGO</option>' +
        ngoData.ngos.map(ngo => `<option value="${ngo.id}">${ngo.name}</option>`).join('');
}

// Initialize impact charts
function initializeImpactCharts() {
    // Aid Distribution Chart
    const aidCtx = document.getElementById('aidDistributionChart');
    if (aidCtx) {
        new Chart(aidCtx, {
            type: 'doughnut',
            data: {
                labels: ['Financial Aid', 'Equipment', 'Training', 'Medical', 'Career'],
                datasets: [{
                    data: [35, 25, 20, 12, 8],
                    backgroundColor: ['#667eea', '#4ecdc4', '#ff6b6b', '#f093fb', '#45b7d1'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    // Impact Overview Chart
    const trendCtx = document.getElementById('impactTrendChart');
    if (trendCtx) {
        new Chart(trendCtx, {
            type: 'bar',
            data: {
                labels: ['Athletes Helped', 'NGOs Active', 'Success Rate', 'Total Aid'],
                datasets: [{
                    data: [2847, 156, 89, 120],
                    backgroundColor: ['#667eea', '#4ecdc4', '#27ae60', '#f093fb'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0,0,0,0.1)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }
}

// NGO interaction functions
function viewNGODetails(ngoId) {
    const ngo = ngoData.ngos.find(n => n.id === ngoId);
    if (ngo) {
        showNotification(`Viewing details for ${ngo.name}`, 'info');
    }
}

function applyToNGO(ngoId) {
    const modal = document.getElementById('applicationModal');
    const select = document.getElementById('selectedNgo');

    populateNGODropdown();
    if (select) select.value = ngoId;

    modal.style.display = 'block';
}

function applyToOpportunity(oppId) {
    const opportunity = ngoData.opportunities.find(o => o.id === oppId);
    if (opportunity) {
        showNotification(`Applying to ${opportunity.title}`, 'info');
    }
}

function openConversation(convId) {
    const conversation = ngoData.conversations.find(c => c.id === convId);
    const messageThread = document.getElementById('messageThread');

    if (conversation && messageThread) {
        messageThread.innerHTML = `
            <div style="padding: 1rem; border-bottom: 1px solid #e1e8ed;">
                <h4>${conversation.ngoName}</h4>
            </div>
            <div style="flex: 1; padding: 1rem; overflow-y: auto;">
                <div style="text-align: center; color: #666; margin: 2rem 0;">
                    <i class="fas fa-lock"></i>
                    <p>Secure messaging with ${conversation.ngoName}</p>
                    <p style="font-size: 0.9rem;">Your conversations are encrypted and secure.</p>
                </div>
            </div>
            <div style="padding: 1rem; border-top: 1px solid #e1e8ed;">
                <div style="display: flex; gap: 0.5rem;">
                    <input type="text" placeholder="Type your message..." style="flex: 1; padding: 0.75rem; border: 1px solid #e1e8ed; border-radius: 8px;">
                    <button class="btn btn-primary"><i class="fas fa-paper-plane"></i></button>
                </div>
            </div>
        `;
    }
}

function submitApplication() {
    const formData = {
        ngoId: document.getElementById('selectedNgo').value,
        aidType: document.getElementById('aidType').value,
        urgency: document.getElementById('urgency').value,
        description: document.getElementById('description').value,
        documents: document.getElementById('documents').files
    };

    if (!formData.ngoId || !formData.aidType || !formData.urgency || !formData.description) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }

    // Simulate application submission
    const newApplication = {
        id: Date.now().toString(),
        ngoName: ngoData.ngos.find(n => n.id === formData.ngoId)?.name || 'Unknown NGO',
        aidType: formData.aidType,
        description: formData.description,
        status: 'Pending',
        progress: 1,
        dateApplied: new Date().toLocaleDateString()
    };

    ngoData.applications.unshift(newApplication);
    populateApplications();

    document.getElementById('applicationModal').style.display = 'none';
    document.getElementById('applicationForm').reset();

    showNotification('Application submitted successfully!', 'success');
}

// Save data before page unload
window.addEventListener('beforeunload', savePerformanceData);
