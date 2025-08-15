# AthleteTracker Pro - Flask Backend

This Flask backend provides comprehensive performance tracking, analytics, and reporting features for the AthleteTracker Pro application.

## 🚀 Quick Start

### Prerequisites
- Python 3.7 or higher
- pip (Python package manager)

### Installation

1. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Start the backend server:**
   ```bash
   python run_backend.py
   ```

3. **Start the frontend server (in another terminal):**
   ```bash
   npm run dev
   ```

The backend will be available at `http://localhost:5000` and the frontend at `http://localhost:3000`.

## 📊 Features

### Data Management
- **Performance Entry Storage**: Stores athlete performance data in SQLite database
- **Sport Support**: Handles both Football and Cricket performance metrics
- **Data Validation**: Ensures data integrity and proper formatting

### Analytics & Calculations
- **Real-time Metrics**: Calculates current performance indicators
- **Trend Analysis**: Tracks performance improvements/declines over time
- **Daily Aggregations**: Computes daily average metrics for visualization
- **Historical Comparisons**: Compares current vs. previous performance

### Dashboard Features
- **Live Metrics**: Current speed, stamina, agility, and strength values
- **Performance Charts**: 7-day performance overview with trends
- **Metric Cards**: Visual representation of key performance indicators

### AI-Powered Insights
- **Performance Analysis**: Identifies strengths and improvement areas
- **Training Recommendations**: Suggests specific training focus areas
- **Consistency Tracking**: Monitors training frequency and patterns
- **Recovery Suggestions**: Recommends rest days based on training intensity

### Reporting System
- **Weekly Reports**: Comprehensive 7-day performance summaries
- **Monthly Reports**: Detailed 30-day analysis with trends
- **Custom Reports**: Flexible date range reporting
- **Automated Recommendations**: AI-generated training suggestions

## 🔌 API Endpoints

### Health Check
```
GET /api/health
```
Returns backend status and connectivity check.

### Performance Data
```
POST /api/performance
Content-Type: application/json

{
  "sport": "football",
  "session_type": "training",
  "date": "2024-01-15",
  "speed": 25.5,
  "stamina": 85,
  "agility": 7.2,
  "strength": 120,
  "goals": 2,
  "assists": 3,
  "notes": "Great training session"
}
```

```
GET /api/performance?days=30&sport=football
```
Retrieves performance history with optional filtering.

### Dashboard Metrics
```
GET /api/dashboard/metrics
```
Returns current metrics, daily data, and performance trends.

### Analytics
```
GET /api/analytics/charts?days=30&sport=football
```
Provides chart data for performance visualization.

```
GET /api/analytics/insights
```
Returns AI-generated insights and recommendations.

### Reports
```
POST /api/reports/generate
Content-Type: application/json

{
  "report_type": "weekly",
  "sport": "football"
}
```

## 📊 Database Schema

### PerformanceEntry Table
- `id`: Primary key
- `sport`: Sport type (football/cricket)
- `session_type`: Type of session (training/match/practice)
- `date`: Session date
- `duration`: Session duration in minutes
- Football metrics: `speed`, `stamina`, `agility`, `strength`, `goals`, `assists`
- Cricket metrics: `wickets`, `runs`
- `notes`: Additional notes
- `created_at`: Timestamp

### CalculatedMetrics Table
- `id`: Primary key
- `date`: Calculation date
- `avg_speed`, `avg_stamina`, `avg_agility`, `avg_strength`: Daily averages
- `total_sessions`: Number of sessions for the day
- `updated_at`: Last update timestamp

## 🔧 Configuration

### Database
The backend uses SQLite by default with the database file `athlete_tracker.db` created automatically.

### CORS
Cross-Origin Resource Sharing is enabled to allow frontend connections from `localhost:3000`.

### Environment Variables
You can customize the backend by setting these environment variables:
- `FLASK_ENV`: Set to `development` for debug mode
- `DATABASE_URL`: Custom database connection string
- `SECRET_KEY`: Flask secret key for sessions

## 🐛 Troubleshooting

### Common Issues

1. **"Module not found" errors**
   ```bash
   pip install -r requirements.txt
   ```

2. **Port 5000 already in use**
   - Kill the process using port 5000 or modify the port in `run_backend.py`

3. **Database errors**
   - Delete `athlete_tracker.db` file and restart the server to recreate

4. **CORS errors**
   - Ensure the frontend is running on `localhost:3000`
   - Check that Flask-CORS is properly installed

### API Testing
You can test the API endpoints using curl or tools like Postman:

```bash
# Health check
curl http://localhost:5000/api/health

# Submit performance data
curl -X POST http://localhost:5000/api/performance \
  -H "Content-Type: application/json" \
  -d '{"sport":"football","session_type":"training","date":"2024-01-15","speed":25.5}'
```

## 📈 Performance Calculations

### Metrics Calculations
- **Daily Averages**: Mean of all sessions within a day
- **Trends**: Comparison between first and second half of data period
- **Performance Score**: Normalized score based on multiple metrics
- **Insights Generation**: Rule-based analysis of performance patterns

### Data Processing
- Real-time calculation updates when new data is submitted
- Efficient querying with date-based filtering
- Automatic aggregation for dashboard display
- Trend analysis using statistical methods

## 🔄 Integration with Frontend

The backend automatically integrates with the existing frontend application:

1. **Form Submission**: Performance logging forms submit to `/api/performance`
2. **Dashboard Updates**: Metrics are fetched from `/api/dashboard/metrics`
3. **Analytics Charts**: Chart data comes from `/api/analytics/charts`
4. **Reports**: Generated via `/api/reports/generate`

The frontend includes automatic fallback to localStorage if the backend is unavailable.

## 🛠️ Development

### Adding New Features
1. Add new database models to `app.py`
2. Create API endpoints for new functionality
3. Update the frontend to consume new endpoints
4. Add proper error handling and validation

### Testing
The backend includes comprehensive error handling and logging for debugging.

## 📝 License

This backend is part of the AthleteTracker Pro application.
