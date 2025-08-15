from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime, timedelta
import statistics
import sqlite3
import os

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///athlete_tracker.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'your-secret-key-here'

db = SQLAlchemy(app)
CORS(app)

# Database Models
class PerformanceEntry(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    sport = db.Column(db.String(50), nullable=False)
    session_type = db.Column(db.String(50), nullable=False)
    date = db.Column(db.Date, nullable=False)
    duration = db.Column(db.Integer)  # in minutes
    
    # Football-specific metrics
    speed = db.Column(db.Float)  # km/h
    stamina = db.Column(db.Float)  # percentage
    agility = db.Column(db.Float)  # seconds
    strength = db.Column(db.Float)  # kg
    goals = db.Column(db.Integer)
    assists = db.Column(db.Integer)
    
    # Cricket-specific metrics
    wickets = db.Column(db.Integer)
    runs = db.Column(db.Integer)
    
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'sport': self.sport,
            'session_type': self.session_type,
            'date': self.date.isoformat() if self.date else None,
            'duration': self.duration,
            'speed': self.speed,
            'stamina': self.stamina,
            'agility': self.agility,
            'strength': self.strength,
            'goals': self.goals,
            'assists': self.assists,
            'wickets': self.wickets,
            'runs': self.runs,
            'notes': self.notes,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class CalculatedMetrics(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.Date, nullable=False)
    avg_speed = db.Column(db.Float)
    avg_stamina = db.Column(db.Float)
    avg_agility = db.Column(db.Float)
    avg_strength = db.Column(db.Float)
    total_sessions = db.Column(db.Integer)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'date': self.date.isoformat() if self.date else None,
            'avg_speed': self.avg_speed,
            'avg_stamina': self.avg_stamina,
            'avg_agility': self.avg_agility,
            'avg_strength': self.avg_strength,
            'total_sessions': self.total_sessions,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

# API Routes

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'AthleteTracker Pro Backend is running',
        'timestamp': datetime.utcnow().isoformat()
    })

@app.route('/api/performance', methods=['POST'])
def submit_performance():
    """Submit a new performance entry"""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get('sport') or not data.get('session_type') or not data.get('date'):
            return jsonify({
                'error': 'Missing required fields: sport, session_type, and date'
            }), 400
        
        # Parse date
        try:
            entry_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'error': 'Invalid date format. Use YYYY-MM-DD'}), 400
        
        # Create new performance entry
        entry = PerformanceEntry(
            sport=data['sport'],
            session_type=data['session_type'],
            date=entry_date,
            duration=data.get('duration'),
            speed=data.get('speed'),
            stamina=data.get('stamina'),
            agility=data.get('agility'),
            strength=data.get('strength'),
            goals=data.get('goals'),
            assists=data.get('assists'),
            wickets=data.get('wickets'),
            runs=data.get('runs'),
            notes=data.get('notes', '')
        )
        
        db.session.add(entry)
        db.session.commit()
        
        # Update calculated metrics for the current date
        update_calculated_metrics(entry_date)
        
        return jsonify({
            'message': 'Performance entry created successfully',
            'entry': entry.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to submit performance: {str(e)}'}), 500

@app.route('/api/performance', methods=['GET'])
def get_performance_data():
    """Get performance data with optional filtering"""
    try:
        # Query parameters
        sport = request.args.get('sport')
        days = request.args.get('days', type=int, default=30)
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        
        # Build query
        query = PerformanceEntry.query
        
        if sport:
            query = query.filter(PerformanceEntry.sport == sport)
        
        if start_date:
            start = datetime.strptime(start_date, '%Y-%m-%d').date()
            query = query.filter(PerformanceEntry.date >= start)
        
        if end_date:
            end = datetime.strptime(end_date, '%Y-%m-%d').date()
            query = query.filter(PerformanceEntry.date <= end)
        elif not start_date:
            # If no date range specified, use last N days
            cutoff_date = datetime.utcnow().date() - timedelta(days=days)
            query = query.filter(PerformanceEntry.date >= cutoff_date)
        
        # Execute query
        entries = query.order_by(PerformanceEntry.date.desc()).all()
        
        return jsonify({
            'entries': [entry.to_dict() for entry in entries],
            'count': len(entries)
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch performance data: {str(e)}'}), 500

@app.route('/api/dashboard/metrics', methods=['GET'])
def get_dashboard_metrics():
    """Get current dashboard metrics and trends"""
    try:
        # Get the most recent metrics
        latest_entry = PerformanceEntry.query.filter(
            PerformanceEntry.sport == 'football'
        ).order_by(PerformanceEntry.created_at.desc()).first()
        
        current_metrics = {
            'speed': latest_entry.speed if latest_entry and latest_entry.speed else 0,
            'stamina': latest_entry.stamina if latest_entry and latest_entry.stamina else 0,
            'agility': latest_entry.agility if latest_entry and latest_entry.agility else 0,
            'strength': latest_entry.strength if latest_entry and latest_entry.strength else 0
        }
        
        # Get last 7 days data for charts
        week_ago = datetime.utcnow().date() - timedelta(days=7)
        week_entries = PerformanceEntry.query.filter(
            PerformanceEntry.sport == 'football',
            PerformanceEntry.date >= week_ago
        ).all()
        
        # Calculate daily averages for the last 7 days
        daily_metrics = calculate_daily_metrics(week_entries, 7)
        
        # Calculate trends (improvement/decline)
        trends = calculate_trends(week_entries)
        
        return jsonify({
            'current_metrics': current_metrics,
            'daily_metrics': daily_metrics,
            'trends': trends,
            'last_updated': latest_entry.created_at.isoformat() if latest_entry else None
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch dashboard metrics: {str(e)}'}), 500

@app.route('/api/analytics/charts', methods=['GET'])
def get_analytics_charts():
    """Get data for analytics charts"""
    try:
        days = request.args.get('days', type=int, default=30)
        sport = request.args.get('sport', default='football')
        
        cutoff_date = datetime.utcnow().date() - timedelta(days=days)
        entries = PerformanceEntry.query.filter(
            PerformanceEntry.sport == sport,
            PerformanceEntry.date >= cutoff_date
        ).order_by(PerformanceEntry.date.asc()).all()
        
        # Prepare chart data
        chart_data = {
            'labels': [],
            'speed_data': [],
            'stamina_data': [],
            'agility_data': [],
            'strength_data': []
        }
        
        # Group by date and calculate averages
        date_groups = {}
        for entry in entries:
            date_key = entry.date.isoformat()
            if date_key not in date_groups:
                date_groups[date_key] = []
            date_groups[date_key].append(entry)
        
        for date_key in sorted(date_groups.keys()):
            entries_for_date = date_groups[date_key]
            chart_data['labels'].append(date_key)
            
            # Calculate averages for each metric
            speeds = [e.speed for e in entries_for_date if e.speed is not None]
            staminas = [e.stamina for e in entries_for_date if e.stamina is not None]
            agilities = [e.agility for e in entries_for_date if e.agility is not None]
            strengths = [e.strength for e in entries_for_date if e.strength is not None]
            
            chart_data['speed_data'].append(statistics.mean(speeds) if speeds else 0)
            chart_data['stamina_data'].append(statistics.mean(staminas) if staminas else 0)
            chart_data['agility_data'].append(statistics.mean(agilities) if agilities else 0)
            chart_data['strength_data'].append(statistics.mean(strengths) if strengths else 0)
        
        return jsonify(chart_data)
        
    except Exception as e:
        return jsonify({'error': f'Failed to fetch analytics data: {str(e)}'}), 500

@app.route('/api/analytics/insights', methods=['GET'])
def get_insights():
    """Get AI-like insights and recommendations"""
    try:
        # Get recent performance data (last 30 days)
        month_ago = datetime.utcnow().date() - timedelta(days=30)
        recent_entries = PerformanceEntry.query.filter(
            PerformanceEntry.date >= month_ago
        ).all()
        
        insights = generate_insights(recent_entries)
        
        return jsonify({
            'insights': insights,
            'generated_at': datetime.utcnow().isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': f'Failed to generate insights: {str(e)}'}), 500

@app.route('/api/reports/generate', methods=['POST'])
def generate_report():
    """Generate a performance report"""
    try:
        data = request.get_json()
        report_type = data.get('report_type', 'weekly')
        sport = data.get('sport', 'football')
        
        if report_type == 'weekly':
            start_date = datetime.utcnow().date() - timedelta(days=7)
        elif report_type == 'monthly':
            start_date = datetime.utcnow().date() - timedelta(days=30)
        else:
            start_date = datetime.strptime(data.get('start_date'), '%Y-%m-%d').date()
        
        end_date = datetime.utcnow().date()
        if data.get('end_date'):
            end_date = datetime.strptime(data.get('end_date'), '%Y-%m-%d').date()
        
        # Get entries for the period
        entries = PerformanceEntry.query.filter(
            PerformanceEntry.sport == sport,
            PerformanceEntry.date >= start_date,
            PerformanceEntry.date <= end_date
        ).all()
        
        report = generate_performance_report(entries, start_date, end_date, report_type)
        
        return jsonify(report)
        
    except Exception as e:
        return jsonify({'error': f'Failed to generate report: {str(e)}'}), 500

# Helper Functions

def update_calculated_metrics(date):
    """Update calculated metrics for a specific date"""
    try:
        # Get all entries for the date
        entries = PerformanceEntry.query.filter(
            PerformanceEntry.date == date,
            PerformanceEntry.sport == 'football'  # Focus on football metrics
        ).all()
        
        if not entries:
            return
        
        # Calculate averages
        speeds = [e.speed for e in entries if e.speed is not None]
        staminas = [e.stamina for e in entries if e.stamina is not None]
        agilities = [e.agility for e in entries if e.agility is not None]
        strengths = [e.strength for e in entries if e.strength is not None]
        
        # Check if metrics already exist for this date
        existing_metrics = CalculatedMetrics.query.filter(
            CalculatedMetrics.date == date
        ).first()
        
        if existing_metrics:
            # Update existing metrics
            existing_metrics.avg_speed = statistics.mean(speeds) if speeds else None
            existing_metrics.avg_stamina = statistics.mean(staminas) if staminas else None
            existing_metrics.avg_agility = statistics.mean(agilities) if agilities else None
            existing_metrics.avg_strength = statistics.mean(strengths) if strengths else None
            existing_metrics.total_sessions = len(entries)
            existing_metrics.updated_at = datetime.utcnow()
        else:
            # Create new metrics
            metrics = CalculatedMetrics(
                date=date,
                avg_speed=statistics.mean(speeds) if speeds else None,
                avg_stamina=statistics.mean(staminas) if staminas else None,
                avg_agility=statistics.mean(agilities) if agilities else None,
                avg_strength=statistics.mean(strengths) if strengths else None,
                total_sessions=len(entries)
            )
            db.session.add(metrics)
        
        db.session.commit()
        
    except Exception as e:
        db.session.rollback()
        print(f"Error updating calculated metrics: {e}")

def calculate_daily_metrics(entries, days):
    """Calculate daily metrics for chart display"""
    daily_data = {}
    
    # Initialize with zeros for all days
    for i in range(days):
        date = (datetime.utcnow().date() - timedelta(days=days-1-i))
        daily_data[date.isoformat()] = {
            'speed': 0,
            'stamina': 0,
            'agility': 0,
            'strength': 0
        }
    
    # Group entries by date
    date_groups = {}
    for entry in entries:
        date_key = entry.date.isoformat()
        if date_key not in date_groups:
            date_groups[date_key] = []
        date_groups[date_key].append(entry)
    
    # Calculate averages for each date
    for date_key, entries_for_date in date_groups.items():
        if date_key in daily_data:
            speeds = [e.speed for e in entries_for_date if e.speed is not None]
            staminas = [e.stamina for e in entries_for_date if e.stamina is not None]
            agilities = [e.agility for e in entries_for_date if e.agility is not None]
            strengths = [e.strength for e in entries_for_date if e.strength is not None]
            
            daily_data[date_key] = {
                'speed': round(statistics.mean(speeds), 1) if speeds else 0,
                'stamina': round(statistics.mean(staminas), 1) if staminas else 0,
                'agility': round(statistics.mean(agilities), 1) if agilities else 0,
                'strength': round(statistics.mean(strengths), 1) if strengths else 0
            }
    
    return daily_data

def calculate_trends(entries):
    """Calculate performance trends"""
    if len(entries) < 2:
        return {
            'speed': 'No data',
            'stamina': 'No data',
            'agility': 'No data',
            'strength': 'No data'
        }
    
    # Split entries into first half and second half of the period
    mid_point = len(entries) // 2
    first_half = entries[:mid_point]
    second_half = entries[mid_point:]
    
    def calculate_average_change(first_entries, second_entries, metric):
        first_values = [getattr(e, metric) for e in first_entries if getattr(e, metric) is not None]
        second_values = [getattr(e, metric) for e in second_entries if getattr(e, metric) is not None]
        
        if not first_values or not second_values:
            return 'No data'
        
        first_avg = statistics.mean(first_values)
        second_avg = statistics.mean(second_values)
        
        change_percent = ((second_avg - first_avg) / first_avg) * 100
        
        if change_percent > 5:
            return f'↗ +{change_percent:.1f}%'
        elif change_percent < -5:
            return f'↘ {change_percent:.1f}%'
        else:
            return f'→ {change_percent:.1f}%'
    
    return {
        'speed': calculate_average_change(first_half, second_half, 'speed'),
        'stamina': calculate_average_change(first_half, second_half, 'stamina'),
        'agility': calculate_average_change(first_half, second_half, 'agility'),
        'strength': calculate_average_change(first_half, second_half, 'strength')
    }

def generate_insights(entries):
    """Generate AI-like insights based on performance data"""
    insights = []
    
    if not entries:
        return [{
            'type': 'info',
            'title': 'Getting Started',
            'description': 'Start logging your performance to see personalized insights and recommendations.'
        }]
    
    # Analyze different metrics
    speeds = [e.speed for e in entries if e.speed is not None]
    staminas = [e.stamina for e in entries if e.stamina is not None]
    agilities = [e.agility for e in entries if e.agility is not None]
    strengths = [e.strength for e in entries if e.strength is not None]
    
    # Speed insights
    if speeds:
        avg_speed = statistics.mean(speeds)
        if avg_speed > 25:
            insights.append({
                'type': 'success',
                'title': 'Excellent Speed Performance',
                'description': f'Your average speed of {avg_speed:.1f} km/h is above elite athlete standards. Keep up the excellent work!'
            })
        elif avg_speed < 20:
            insights.append({
                'type': 'improvement',
                'title': 'Speed Development Opportunity',
                'description': f'Your average speed is {avg_speed:.1f} km/h. Consider incorporating interval training and sprint drills to improve acceleration.'
            })
    
    # Stamina insights
    if staminas:
        avg_stamina = statistics.mean(staminas)
        if avg_stamina > 85:
            insights.append({
                'type': 'success',
                'title': 'Outstanding Endurance',
                'description': f'Your stamina levels are excellent at {avg_stamina:.1f}%. You have great cardiovascular fitness.'
            })
        elif avg_stamina < 70:
            insights.append({
                'type': 'improvement',
                'title': 'Endurance Building Needed',
                'description': f'Your stamina is at {avg_stamina:.1f}%. Focus on cardio workouts and longer training sessions to build endurance.'
            })
    
    # Training frequency insights
    session_count = len(entries)
    if session_count > 20:
        insights.append({
            'type': 'success',
            'title': 'Consistent Training Pattern',
            'description': f'You\'ve logged {session_count} sessions this month. Your consistency is paying off!'
        })
    elif session_count < 8:
        insights.append({
            'type': 'warning',
            'title': 'Increase Training Frequency',
            'description': f'Only {session_count} sessions logged this month. Try to aim for at least 3-4 sessions per week for optimal improvement.'
        })
    
    # Recovery insights
    recent_sessions = sorted(entries, key=lambda x: x.date, reverse=True)[:5]
    if len(recent_sessions) >= 3:
        consecutive_days = 0
        for i in range(len(recent_sessions)-1):
            if (recent_sessions[i].date - recent_sessions[i+1].date).days == 1:
                consecutive_days += 1
        
        if consecutive_days >= 3:
            insights.append({
                'type': 'warning',
                'title': 'Consider Rest Day',
                'description': 'You\'ve trained for several consecutive days. Consider taking a rest day to allow your body to recover.'
            })
    
    return insights

def generate_performance_report(entries, start_date, end_date, report_type):
    """Generate a comprehensive performance report"""
    if not entries:
        return {
            'report_type': report_type,
            'period': f"{start_date} to {end_date}",
            'summary': {
                'total_sessions': 0,
                'total_duration': 0,
                'average_performance': 0
            },
            'metrics': {},
            'recommendations': ['Start logging your performance to generate detailed reports.']
        }
    
    # Calculate summary statistics
    total_sessions = len(entries)
    total_duration = sum(e.duration for e in entries if e.duration)
    
    # Calculate metric averages
    speeds = [e.speed for e in entries if e.speed is not None]
    staminas = [e.stamina for e in entries if e.stamina is not None]
    agilities = [e.agility for e in entries if e.agility is not None]
    strengths = [e.strength for e in entries if e.strength is not None]
    
    metrics = {
        'average_speed': round(statistics.mean(speeds), 1) if speeds else 0,
        'average_stamina': round(statistics.mean(staminas), 1) if staminas else 0,
        'average_agility': round(statistics.mean(agilities), 1) if agilities else 0,
        'average_strength': round(statistics.mean(strengths), 1) if strengths else 0
    }
    
    # Calculate overall performance score (normalized to 100)
    performance_scores = []
    if speeds:
        performance_scores.append(min(statistics.mean(speeds) / 30 * 100, 100))
    if staminas:
        performance_scores.append(statistics.mean(staminas))
    if agilities:
        # Lower agility time is better, so invert the score
        performance_scores.append(max(0, 100 - (statistics.mean(agilities) - 5) * 10))
    if strengths:
        performance_scores.append(min(statistics.mean(strengths) / 150 * 100, 100))
    
    average_performance = round(statistics.mean(performance_scores), 1) if performance_scores else 0
    
    # Generate recommendations
    recommendations = []
    if metrics['average_speed'] < 20:
        recommendations.append('Focus on speed training with interval sprints and acceleration drills')
    if metrics['average_stamina'] < 75:
        recommendations.append('Increase cardiovascular training to improve endurance')
    if metrics['average_agility'] > 8:
        recommendations.append('Practice agility ladder drills and cone exercises')
    if total_sessions < 8:
        recommendations.append('Increase training frequency to 3-4 sessions per week')
    
    if not recommendations:
        recommendations.append('Excellent performance! Continue your current training routine and consider progressive overload.')
    
    return {
        'report_type': report_type,
        'period': f"{start_date} to {end_date}",
        'summary': {
            'total_sessions': total_sessions,
            'total_duration': total_duration,
            'average_performance': average_performance
        },
        'metrics': metrics,
        'recommendations': recommendations,
        'generated_at': datetime.utcnow().isoformat()
    }

# Initialize database
@app.before_first_request
def create_tables():
    db.create_all()

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, host='0.0.0.0', port=5000)
