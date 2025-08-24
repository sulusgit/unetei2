Requirements:
python
psql

0. database
createdb peermarket
psql -d peermarket -f backend/sql/schema.sql
psql -d peermarket -f backend/sql/seed.sql
(esvel backend dotor orj bgd:
psql -d peermarket -f /sql/schema.sql
psql -d peermarket -f /sql/seed.sql)

1. backend
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

2. env
cp .env.example env
(.env dotor JWT uurchluh)

3. admin (buren hiij chadaagui odoohondoo)
psql neej bgd:
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

UPDATE users SET is_admin = true WHERE email = 'you@example.com'(end adminii emailee bichne);

4. run
cd backend
python3 -m uvicorn app.main:app --host 127.0.0.1 --port 8000