#!/bin/bash

echo "=== Fix 1: Create backend.drsalehalkhalaf.com nginx conf ==="
LE_CERT="/etc/letsencrypt/live/backend.drsalehalkhalaf.com/fullchain.pem"
LE_KEY="/etc/letsencrypt/live/backend.drsalehalkhalaf.com/privkey.pem"

if [ -f "$LE_CERT" ]; then
  cat > /etc/nginx/conf.d/backend.drsalehalkhalaf.com.conf << NGINXEOF
server {
    listen 443 ssl http2;
    server_name backend.drsalehalkhalaf.com;

    ssl_certificate ${LE_CERT};
    ssl_certificate_key ${LE_KEY};
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-CHACHA20-POLY1305;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;

    location / {
        proxy_pass http://127.0.0.1:9005;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 60s;
    }
}
server {
    listen 80;
    server_name backend.drsalehalkhalaf.com;
    return 301 https://\$host\$request_uri;
}
NGINXEOF
  echo "Created backend.drsalehalkhalaf.com.conf"
else
  echo "No LE cert found for backend.drsalehalkhalaf.com"
fi

echo ""
echo "=== Fix 2: Get aroma.mila-knight.com cert via webroot ==="
# Add acme-challenge location to aroma config first
# Then use webroot method
AROMA_CONF="/etc/nginx/conf.d/aroma.mila-knight.com.conf"
# Check if we need to add well-known location
if grep -q "acme-challenge" "$AROMA_CONF" 2>/dev/null; then
  echo "ACME location already exists"
else
  # Insert before the closing brace of the first server block
  # Add after the 'root' line
  sed -i '/root \/home\/milaknight\/aroma.mila-knight.com/a\    location ^~ /.well-known/acme-challenge { root /var/lib/letsencrypt/; }' "$AROMA_CONF"
  echo "Added ACME challenge location to aroma config"
fi

# Reload nginx with the new config
nginx -t 2>&1 && nginx -s reload

# Now try certbot with webroot
mkdir -p /var/lib/letsencrypt
certbot certonly --webroot -w /var/lib/letsencrypt \
  --non-interactive --agree-tos --email admin@mila-knight.com \
  -d aroma.mila-knight.com 2>&1 | tail -5

# If cert was obtained, update the nginx conf to use it
AROMA_LE="/etc/letsencrypt/live/aroma.mila-knight.com/fullchain.pem"
AROMA_LE_KEY="/etc/letsencrypt/live/aroma.mila-knight.com/privkey.pem"
if [ -f "$AROMA_LE" ]; then
  sed -i "s|ssl_certificate .*;|ssl_certificate ${AROMA_LE};|g" "$AROMA_CONF"
  sed -i "s|ssl_certificate_key .*;|ssl_certificate_key ${AROMA_LE_KEY};|g" "$AROMA_CONF"
  echo "Updated aroma.mila-knight.com to use LE cert"
fi

echo ""
echo "=== Reload nginx ==="
nginx -t 2>&1 && nginx -s reload && echo "reloaded"

echo ""
echo "=== Final test ==="
for d in mila-knight.com aroma.mila-knight.com aromav2.mila-knight.com backend.drsalehalkhalaf.com backend.mila-knight.com; do
  code=$(curl -sk -o /dev/null -w "%{http_code}" --max-time 5 "https://${d}/" 2>/dev/null)
  echo "  ${d}: ${code}"
done
