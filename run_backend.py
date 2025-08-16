#!/usr/bin/env python3
"""
AthleteTracker Pro Backend Server
Run this script to start the Flask backend server
"""

import os
import sys
from app import app, db

def setup_database():
    """Initialize the database with tables"""
    print("Setting up database...")
    with app.app_context():
        db.create_all()
        print("Database tables created successfully!")

def main():
    """Main entry point for the backend server"""
    print("=" * 50)
    print("🏃 AthleteTracker Pro Backend Server")
    print("=" * 50)
    
    # Setup database
    setup_database()
    
    print("\n📊 Backend Features:")
    print("✅ Performance data submission and storage")
    print("✅ Real-time analytics and calculations")
    print("✅ Dashboard metrics with trends")
    print("✅ Performance insights and recommendations")
    print("✅ Report generation")
    print("✅ CORS enabled for frontend integration")
    
    print("\n🌐 API Endpoints available:")
    print("GET  /api/health - Health check")
    print("POST /api/performance - Submit performance data")
    print("GET  /api/performance - Get performance history") 
    print("GET  /api/dashboard/metrics - Get dashboard data")
    print("GET  /api/analytics/charts - Get analytics charts data")
    print("GET  /api/analytics/insights - Get AI insights")
    print("POST /api/reports/generate - Generate performance reports")
    
    print("\n🔥 Starting Flask server...")
    print("📍 Backend URL: http://localhost:5000")
    print("📍 Frontend should be running on: http://localhost:3000")
    print("⚠️  Make sure your frontend is configured to connect to the backend")
    print("\n💡 To stop the server: Press Ctrl+C")
    print("-" * 50)
    
    try:
        # Run the Flask app
        app.run(
            debug=True,
            host='0.0.0.0',
            port=5000,
            use_reloader=True
        )
    except KeyboardInterrupt:
        print("\n\n🛑 Server stopped by user")
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ Server error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
