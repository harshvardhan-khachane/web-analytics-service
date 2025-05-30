import os
import uuid
import random
import time
import json  # ✅ Added for serializing dicts
from datetime import datetime, timedelta
from faker import Faker
import psycopg2
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration (as per requirements)
NUM_EVENTS = random.randint(1000, 5000)  # 1000-5000 random events
EVENT_TYPE_WEIGHTS = [0.6, 0.3, 0.1]  # view:60%, click:30%, location:10%
USER_COUNT = 150  # Distinct users (various user_ids)
START_DATE = datetime(2025, 5, 1)  # May 1, 2025
END_DATE = datetime(2025, 5, 29)  # May 29, 2025

# Database configuration
DB_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": os.getenv("DB_PORT", "5432"),
    "database": os.getenv("DB_NAME", "analytics_db"),
    "user": os.getenv("DB_USER", "analytics_user"),
    "password": os.getenv("DB_PASSWORD", "secure_password")
}

def create_connection():
    """Create database connection with retry logic"""
    max_retries = 5
    for attempt in range(max_retries):
        try:
            conn = psycopg2.connect(**DB_CONFIG)
            print("✅ Database connection established")
            return conn
        except psycopg2.OperationalError as e:
            print(f"⚠️ Connection failed (attempt {attempt+1}/{max_retries}): {e}")
            if attempt < max_retries - 1:
                time.sleep(2)
    raise Exception("Failed to connect to database after multiple attempts")

def generate_timestamps(num_events, start, end):
    """Generate random timestamps within the date range"""
    timestamps = []
    for _ in range(num_events):
        random_seconds = random.randint(0, int((end - start).total_seconds()))
        ts = start + timedelta(seconds=random_seconds)
        timestamps.append(ts.isoformat())
    return timestamps

def generate_events(num_events, start_date, end_date):
    """Generate realistic event data"""
    fake = Faker()
    events = []
    
    # Create distinct users
    user_ids = [f"user_{uuid.uuid4().hex[:8]}" for _ in range(USER_COUNT)]
    timestamps = generate_timestamps(num_events, start_date, end_date)
    
    # URL pool for view events (create realistic patterns)
    url_pool = [
        f"https://{fake.domain_name()}/products",
        f"https://{fake.domain_name()}/blog/{fake.uri_page()}",
        f"https://{fake.domain_name()}/contact",
        f"https://{fake.domain_name()}/about",
        f"https://{fake.domain_name()}/pricing"
    ]
    
    # Element ID pool for click events
    element_pool = [
        "signup-button", "cta-primary", "search-input",
        "add-to-cart", "learn-more", "download-btn"
    ]
    
    for i in range(num_events):
        # Base event structure
        event_type = random.choices(
            ["view", "click", "location"],
            weights=EVENT_TYPE_WEIGHTS
        )[0]
        
        event_id = str(uuid.uuid4())
        user_id = random.choice(user_ids)
        timestamp = timestamps[i]
        
        # Type-specific payloads (with realistic patterns)
        if event_type == "view":
            payload = {
                "url": random.choice(url_pool),
                "title": fake.sentence(nb_words=4)
            }
        elif event_type == "click":
            payload = {
                random.choice(["element_id", "text", "xpath"]): random.choice(element_pool),
                "text": fake.word().capitalize()
            }
            # Add extra fields 40% of the time
            if random.random() < 0.4:
                payload[random.choice(["element_id", "xpath"])] = random.choice(element_pool)
        else:  # location
            coords = fake.local_latlng(country_code='US')
            payload = {
                "latitude": float(coords[0]),
                "longitude": float(coords[1]),
                "accuracy": round(random.uniform(1, 50), 1)
            }
        
        events.append((
            event_id,
            user_id,
            event_type,
            timestamp,
            json.dumps(payload)  # ✅ FIX: Convert dict to JSON string
        ))
    
    return events

def insert_events(conn, events):
    """Insert events in batches"""
    try:
        cur = conn.cursor()
        batch_size = 250
        total = len(events)
        
        print(f"📊 Inserting {total} events in batches of {batch_size}...")
        
        for i in range(0, total, batch_size):
            batch = events[i:i+batch_size]
            args = ','.join(cur.mogrify(
                "(%s, %s, %s, %s, %s::jsonb)", 
                event
            ).decode('utf-8') for event in batch)
            
            cur.execute(f"""
                INSERT INTO events 
                (event_id, user_id, event_type, timestamp, payload) 
                VALUES {args}
            """)
            conn.commit()
            print(f"  ✅ Batch {i//batch_size + 1}/{(total-1)//batch_size + 1} inserted")
        
        print(f"\n🎉 Successfully inserted {total} events")
        
    except Exception as e:
        conn.rollback()
        print(f"❌ Insert failed: {e}")
        raise

def run_verification_queries(conn):
    """Run required verification queries"""
    try:
        cur = conn.cursor()
        print("\n🔍 Running verification queries...")
        
        # 1. Total event count
        cur.execute("SELECT COUNT(*) FROM events")
        total_events = cur.fetchone()[0]
        print(f"  Total events: {total_events}")
        
        # 2. Event type distribution
        cur.execute("""
            SELECT event_type, COUNT(*) 
            FROM events 
            GROUP BY event_type
            ORDER BY COUNT(*) DESC
        """)
        print("\nEvent type distribution:")
        for row in cur.fetchall():
            print(f"  {row[0]}: {row[1]} events")
        
        # 3. User activity spread
        cur.execute("""
            SELECT COUNT(DISTINCT user_id) AS users,
                   COUNT(*) / COUNT(DISTINCT user_id) AS avg_events_per_user
            FROM events
        """)
        users, avg_events = cur.fetchone()
        print(f"\nUser engagement:")
        print(f"  Distinct users: {users}")
        print(f"  Avg events per user: {avg_events:.1f}")
        
        # 4. Date range verification
        cur.execute("""
            SELECT MIN(timestamp) AS first_event,
                   MAX(timestamp) AS last_event
            FROM events
        """)
        first, last = cur.fetchone()
        print(f"\nDate range:")
        print(f"  First event: {first}")
        print(f"  Last event: {last}")
        
        # 5. Payload samples
        print("\nPayload samples:")
        for etype in ['view', 'click', 'location']:
            key = 'url' if etype == 'view' else 'element_id' if etype == 'click' else 'latitude'
            cur.execute(f"""
                SELECT payload->>%s 
                FROM events 
                WHERE event_type = %s 
                LIMIT 1
            """, (key, etype))
            sample = cur.fetchone()[0]
            print(f"  {etype}: {sample}")

            
        print("\n✅ All verification checks passed")
        
    except Exception as e:
        print(f"❌ Verification failed: {e}")

if __name__ == "__main__":
    print(f"🚀 Starting data generation for {NUM_EVENTS} events")
    print(f"📅 Date range: {START_DATE.date()} to {END_DATE.date()}")
    
    # Generate events
    events = generate_events(NUM_EVENTS, START_DATE, END_DATE)
    print(f"📦 Generated {len(events)} events with {USER_COUNT} distinct users")
    
    # Connect to DB
    conn = create_connection()
    
    try:
        # Insert events
        insert_events(conn, events)
        
        # Run verification queries
        run_verification_queries(conn)
        
    finally:
        conn.close()
    print("🏁 Data generation complete")
