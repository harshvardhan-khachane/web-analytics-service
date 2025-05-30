# Web Analytics Event Service

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.x-brightgreen)](https://nodejs.org/)
[![PostgreSQL Version](https://img.shields.io/badge/postgres-%3E%3D15-blue)](https://www.postgresql.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A robust backend service for collecting, storing, and analyzing user interaction events with a complete frontend demonstration.

---

## Table of Contents

1. [Features](#features)
2. [Technology Stack](#technology-stack)
3. [Setup Instructions](#setup-instructions)
4. [API Documentation](#api-documentation)
5. [Database Design](#database-design)
6. [Challenges & Solutions](#challenges--solutions)
7. [Future Improvements](#future-improvements)
8. [License](#license)

---

## Features

- **Event Ingestion**: Collect view, click, and location events via REST API
- **Real-time Analytics**: Filterable event counts with date ranges
- **Data Generation**: Python script for realistic sample data (1,000-5,000 events)
- **Frontend Demo**: Interactive dashboard with service worker integration
- **Geolocation Support**: Capture and process location data
- **Comprehensive Logging**: Structured JSON logs with performance metrics

---

## Technology Stack

| Component         | Technology          | Justification                                                                 |
|-------------------|---------------------|-------------------------------------------------------------------------------|
| **Backend**       | Node.js/Express     | High-performance runtime with rich ecosystem for API development             |
| **Database**      | PostgreSQL          | Robust relational DB with JSONB support for flexible event payloads          |
| **Data Script**   | Python/Faker        | Industry-standard for realistic test data generation                         |
| **Frontend**      | Service Workers     | Enable background sync and offline capability for analytics events           |
| **Validation**    | express-validator   | Comprehensive request validation middleware                                  |
| **Logging**       | Morgan              | HTTP request logger with customizable output formats                         |

---

## Setup Instructions

### Prerequisites

- Node.js (≥18.x)
- PostgreSQL (≥15)
- Python (≥3.8)
- PGAdmin (recommended for database management)

### Installation

```bash
# Clone repository
git clone https://github.com/harshvardhan-khachane/web-analytics-service.git
cd web-analytics-service

# Install Node dependencies
npm install

# Create .env file (update values as needed)
cp .env.example .env

# Install Python dependencies
pip install faker psycopg2-binary python-dotenv
```

### Database Setup

1. Start PostgreSQL service:
    ```bash
    sudo systemctl start postgresql
    ```
2. Create database and user:
    ```sql
    CREATE DATABASE analytics_db;
    CREATE USER analytics_user WITH PASSWORD 'secure_password';
    GRANT ALL PRIVILEGES ON DATABASE analytics_db TO analytics_user;
    ```
3. Enable UUID extension:
    ```sql
    \c analytics_db
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
    ```

### Running the Service

```bash
# Start backend service
npm run dev

# Generate sample data (in separate terminal)
python generate_events.py

# Access frontend demo
http://localhost:3000
```

---

## API Documentation

### POST `/events` — Record User Event

**Purpose**: Capture user interaction events (view, click, location)

**Request Body**:

```json
{
  "user_id": "session_abc123",
  "event_type": "view",
  "payload": {
    "url": "https://example.com/products",
    "title": "Product Catalog"
  }
}
```

**Success Response** (`202 Accepted`):

```json
{
  "status": "success",
  "message": "Event accepted",
  "event_id": "a1b2c3d4-e5f6-7890",
  "timestamp": "2025-05-30T12:34:56.789Z"
}
```

**Error Responses**:

- `400 Bad Request` (Validation errors)
- `500 Internal Server Error` (Database issues)

---

### GET `/analytics/event-counts` — Get Event Counts

**Purpose**: Retrieve total event counts with filtering

**Query Parameters**:

- `event_type` (optional): Filter by event type (view/click/location)
- `start_date` (optional): ISO 8601 date (YYYY-MM-DD)
- `end_date` (optional): ISO 8601 date (YYYY-MM-DD)

**Success Response** (`200 OK`):

```json
{
  "status": "success",
  "data": {
    "total_events": 12345
  }
}
```

**Error Responses**:

- `400 Bad Request` (Invalid date format)
- `500 Internal Server Error` (Database issues)

---

### GET `/analytics/event-counts-by-type` — Get Counts by Event Type

**Purpose**: Retrieve event counts grouped by type

**Query Parameters**:

- `start_date` (optional): ISO 8601 date (YYYY-MM-DD)
- `end_date` (optional): ISO 8601 date (YYYY-MM-DD)

**Success Response** (`200 OK`):

```json
{
  "view": 8000,
  "click": 3000,
  "location": 1345
}
```

---

## Database Design

### Events Table Schema

```sql
CREATE TABLE events (
    event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('view', 'click', 'location')),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    payload JSONB NOT NULL
);
```

### Indexes

```sql
CREATE INDEX idx_user_id ON events (user_id);
CREATE INDEX idx_event_type ON events (event_type);
CREATE INDEX idx_timestamp ON events (timestamp);
```

### Design Justifications

1. **UUID Primary Key**: 
   - Globally unique identifiers
   - Avoids sequential ID exposure
2. **JSONB Payload**:
   - Flexible schema for different event types
   - Efficient querying of nested data
   - Supports partial updates
3. **Index Strategy**:
   - Optimizes common filter patterns (user_id, event_type)
   - Speeds up time-range queries (timestamp)
   - Balanced read/write performance

---

## Challenges & Solutions

### 1. Payload Validation

**Challenge**: Different payload structures for each event type requiring complex validation  
**Solution**: Implemented conditional validation middleware using express-validator with custom rules per event type

### 2. Date Range Filtering

**Challenge**: Inclusive date filtering with timezone handling  
**Solution**: Convert end_date to next day at 00:00 and use `<` comparison

```sql
WHERE timestamp >= :start_date AND timestamp < :end_date_plus_one
```

### 3. Geolocation Accuracy

**Challenge**: Validating coordinate ranges and accuracy metrics  
**Solution**: Added custom validation checks:

```javascript
if (Math.abs(value.latitude) > 90 || Math.abs(value.longitude) > 180)
  throw new Error('Invalid coordinate values');
```

### 4. Service Worker Integration

**Challenge**: Reliable event transmission from frontend to backend  
**Solution**: Implemented session-based user IDs and message queueing in service worker

---

## Future Improvements

1. **Real-time Analytics**:
   - WebSocket integration for live dashboards
   - Streaming data pipelines (Kafka, Redis Streams)
2. **Enhanced Location Processing**:
   - PostGIS integration for spatial queries
   - Geofencing capabilities
   - Location clustering algorithms
3. **Performance Optimization**:
   - Query result caching (Redis)
   - Read replica database configuration
   - Materialized views for common aggregations
4. **Scalability Enhancements**:
   - Horizontal scaling with load balancing
   - Message queue (RabbitMQ) for async event processing
   - Database sharding by event type
5. **Advanced Features**:
   - User authentication (JWT/OAuth)
   - Rate limiting and API quotas
   - Anomaly detection for suspicious events
   - Automated report generation
6. **Operational Excellence**:
   - Docker/Kubernetes deployment
   - Prometheus/Grafana monitoring
   - CI/CD pipeline with automated testing

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

