# Stryv wger Cloud Stack

Self-hosted wger deployment for Stryv workout and exercise data.

## Shape

- Caddy terminates HTTPS for `workouts.stryvsocietyfit.com`.
- wger's nginx stays inside the stack for static and media files.
- wger web runs the Django/API app.
- Postgres stores routines, users, exercises, ingredients, and logs.
- Redis backs cache and Celery.
- Celery worker/beat sync exercise, image, video, and ingredient data from the upstream wger instance.

## Provision

Use a small cloud VM first. DigitalOcean, Hetzner, AWS Lightsail, or Fly Machines with a persistent volume are all fine. For the first production pass, use:

- 2 vCPU
- 4 GB RAM
- 60 GB persistent disk
- Ubuntu 24.04 LTS
- ports `80` and `443` open

Point DNS:

```txt
workouts.stryvsocietyfit.com A <server-ip>
```

## First Deploy

```bash
ssh root@<server-ip>
apt-get update
apt-get install -y ca-certificates curl git
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" > /etc/apt/sources.list.d/docker.list
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

git clone <repo-url> /opt/stryvfit
cd /opt/stryvfit/infra/wger
cp .env.example .env
cp config/prod.env.example config/prod.env
```

Generate secrets:

```bash
python3 - <<'PY'
import secrets
print("SECRET_KEY=" + secrets.token_urlsafe(50))
print("SIGNING_KEY=" + secrets.token_urlsafe(50))
print("POSTGRES_PASSWORD=" + secrets.token_urlsafe(32))
print("CELERY_FLOWER_PASSWORD=" + secrets.token_urlsafe(32))
PY
```

Edit `.env` and `config/prod.env`, then boot:

```bash
docker compose pull
docker compose up -d
docker compose ps
```

Warm the exercise cache after DNS/TLS is live:

```bash
docker compose exec web python3 manage.py sync-exercises
docker compose exec web python3 manage.py download-exercise-images
docker compose exec web python3 manage.py download-exercise-videos
docker compose exec web python3 manage.py warmup-exercise-api-cache --force
```

## App Wiring

Set these in the StryvFit+ app deployment:

```bash
WGER_API_BASE_URL=https://workouts.stryvsocietyfit.com
WGER_API_TOKEN=
```

`WGER_API_TOKEN` is optional for public exercise endpoints. Add it later when Stryv starts writing user-owned routines, nutrition plans, schedules, or logs through the wger API.

## Backup

Run manually:

```bash
cd /opt/stryvfit/infra/wger
bash scripts/backup.sh
```

Cron example:

```cron
17 7 * * * cd /opt/stryvfit/infra/wger && BACKUP_DIR=/var/backups/stryv-wger bash scripts/backup.sh
```

Ship `/var/backups/stryv-wger` to object storage once the VM is live.

## Updates

```bash
cd /opt/stryvfit/infra/wger
docker compose pull
docker compose up -d
docker compose exec web python3 manage.py warmup-exercise-api-cache --force
```

## Health Checks

```bash
curl -fsS https://workouts.stryvsocietyfit.com/api/v2/exerciseinfo/?limit=1
curl -fsS https://app.stryvsocietyfit.com/api/wger/exercises?limit=1
```
