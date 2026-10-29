# GFI Nasho 1 Irrigation Scheme Management System — Production Backend Guide

## 1. Architectural Overview
This backend scaffold is designed specifically for **GFI Nasho 1 in Kirehe District, Eastern Province, Rwanda**. It runs Python 3.11 with Django REST Framework (DRF), backed by PostgreSQL 16 with UUID primary keys and decimal-precision financial columns.

### Directory Structure
```
backend_django/
├── manage.py
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
├── nasho_irrigation/
│   ├── __init__.py
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── core/
│   ├── models.py         # Full normalized schema (Schemes, Farmers, Plots, Schedules, Tariffs, Invoices, Payments, Equipment, SMS)
│   ├── serializers.py    # DRF serializers with computed fields & nested lines
│   ├── views.py          # Viewsets enforcing RBAC, idempotency & workflow transitions
│   ├── permissions.py    # Backend RBAC permission classes
│   └── urls.py           # REST API routes mounted under /api/v1/
└── README_BACKEND.md     # This operations & deployment guide
```

---

## 2. Local & Server Deployment with Docker Compose

### Prerequisites
- Docker Engine 24.0+
- Docker Compose v2.20+

### Launching the Stack
```bash
cd backend_django
docker-compose up -d --build
```

### Running Migrations
```bash
docker-compose exec backend python manage.py makemigrations core
docker-compose exec backend python manage.py migrate
```

### Creating Initial Super Administrator
```bash
docker-compose exec backend python manage.py createsuperuser
```

---

## 3. Database Backup & Disaster Recovery Procedures

### Automated Daily Backup (`pg_dump`)
```bash
# Generate compressed snapshot with timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
docker exec -t nasho_postgres pg_dump -U nasho_admin -F c -b -v -f /tmp/nasho_backup_${TIMESTAMP}.dump nasho_irrigation

# Copy backup to offsite secure S3 / Cloud Storage bucket
aws s3 cp /tmp/nasho_backup_${TIMESTAMP}.dump s3://nasho1-kirehe-backups/daily/
```

### Restore Procedure (`pg_restore`)
```bash
# 1. Stop backend service
docker-compose stop backend

# 2. Drop and recreate database
docker exec -i nasho_postgres psql -U nasho_admin -c "DROP DATABASE nasho_irrigation;"
docker exec -i nasho_postgres psql -U nasho_admin -c "CREATE DATABASE nasho_irrigation;"

# 3. Restore from binary dump
docker exec -i nasho_postgres pg_restore -U nasho_admin -d nasho_irrigation -v /tmp/nasho_backup_TARGET.dump

# 4. Restart services & verify integrity
docker-compose start backend
```

---

## 4. Required External Integrations & Credentials

Before going live in production, GFI Nasho 1 leadership must procure the following official contracts and API credentials:

1. **MTN Rwanda Mobile Money (MoMo Open API)**
   - Sandbox vs Production Subscription Key (`Ocp-Apim-Subscription-Key`)
   - API User & API Key for Collection (`POST /collection/v1_0/requesttopay`)
   - Target USSD shortcode / Merchant Code for WUA collections.
2. **Airtel Money Rwanda API**
   - Client ID & Client Secret
   - Push payment collection webhook endpoint for settlement reconciliation.
3. **SMS Gateway (Africa's Talking / Rwanda Telco Aggregator)**
   - `AFRICASTALKING_USERNAME`
   - `AFRICASTALKING_API_KEY`
   - Sender ID approved by RURA (Rwanda Utilities Regulatory Authority), e.g., `GFINASHO`.
4. **NIDA (National Identification Agency)**
   - Optional API credential for real-time validation of 16-digit Rwandan National IDs (NID) during farmer registration.

---

## 5. Security & Production Readiness Checklist

- [ ] `DEBUG = False` in production `.env`.
- [ ] Unique 64+ character `SECRET_KEY` generated and stored in Vault / Cloud Secrets.
- [ ] Database credentials not shared or committed to source control.
- [ ] HTTPS enforced with valid TLS certificate (Let's Encrypt or Cloudflare).
- [ ] PostgreSQL SSL mode set to `require` or `verify-full`.
- [ ] Role-based access control tested on all `/api/v1/*` endpoints.
- [ ] Farmer registers, pivot numbers, and hectare sizes verified with WUA leadership in Kirehe.
- [ ] Water tariffs and penalty rules formally approved by GFI Nasho 1 cooperative general assembly.
