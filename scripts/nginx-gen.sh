#!/bin/bash
set -e

CERTS_DIR="/home/milaknight/ssl/certs"
KEYS_DIR="/home/milaknight/ssl/keys"
CONF_DIR="/etc/nginx/conf.d"
PHP_SOCK_BASE="/opt/cpanel/ea-php83/root/usr/var/run/php-fpm"

# Get cert and key for a domain given the cert filename prefix
get_ssl() {
  local prefix="$1"
  # Find newest cert by sorting filenames (highest timestamp wins)
  local cert=$(ls "${CERTS_DIR}/${prefix}"_*.crt 2>/dev/null | grep -v '\.cache$' | sort | tail -1)
  if [ -z "$cert" ]; then echo ""; return; fi
  local basename=$(basename "$cert" .crt)
  # Extract 5char_5char hash that connects cert to key
  local hash=$(echo "$basename" | grep -oP '[0-9a-f]{5}_[0-9a-f]{5}(?=_[0-9]{10}_)' | head -1)
  if [ -z "$hash" ]; then echo ""; return; fi
  local key=$(ls "${KEYS_DIR}/${hash}_"*.key 2>/dev/null | head -1)
  if [ -z "$key" ]; then echo ""; return; fi
  echo "${cert}|${key}"
}

# Write nginx proxy config
write_proxy() {
  local domain="$1"
  local port="$2"
  local cert="$3"
  local key="$4"
  local extra_names="$5"

  echo "  proxy: ${domain} -> :${port}"

  cat > "${CONF_DIR}/${domain}.conf" << NGINXEOF
server {
    listen 443 ssl http2;
    server_name ${domain}${extra_names};

    ssl_certificate ${cert};
    ssl_certificate_key ${key};
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-CHACHA20-POLY1305;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;

    location / {
        proxy_pass http://127.0.0.1:${port};
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
    server_name ${domain}${extra_names};
    return 301 https://\$host\$request_uri;
}
NGINXEOF
}

# Write nginx PHP-FPM WordPress config
write_wordpress() {
  local domain="$1"
  local socket="$2"
  local docroot="$3"
  local cert="$4"
  local key="$5"
  local extra_names="$6"
  local wptoolkit="$7"

  echo "  wordpress: ${domain} -> ${socket}"

  local wptoolkit_line=""
  if [ -n "$wptoolkit" ] && [ -f "$wptoolkit" ]; then
    wptoolkit_line="    include ${wptoolkit};"
  fi

  cat > "${CONF_DIR}/${domain}.conf" << NGINXEOF
server {
    listen 443 ssl http2;
    server_name ${domain}${extra_names};

    ssl_certificate ${cert};
    ssl_certificate_key ${key};
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-CHACHA20-POLY1305;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;

    root ${docroot};
    index index.php index.html;
${wptoolkit_line}

    location / {
        try_files \$uri \$uri/ /index.php?\$args;
    }

    location ~ \.php$ {
        fastcgi_pass unix:${socket};
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME \$document_root\$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_read_timeout 300;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires max;
        log_not_found off;
    }

    location ~ /\.ht {
        deny all;
    }
}
server {
    listen 80;
    server_name ${domain}${extra_names};
    return 301 https://\$host\$request_uri;
}
NGINXEOF
}

echo "=== Getting SSL cert/key pairs ==="
SSL_AALSAIGH=$(get_ssl "aalsaigh_com_mila_knight_com")
SSL_ABURAHMAH=$(get_ssl "aburahmah_com_mila_knight_com")
SSL_ALMUNIFI=$(get_ssl "almunifi_com_mila_knight_com")
SSL_AROMA=$(get_ssl "aroma_mila_knight_com")
SSL_AROMAV2=$(get_ssl "aromav2_mila_knight_com")
SSL_BACK_ALMUNIFI=$(get_ssl "back_almunifi_com")
SSL_BACK_TBA=$(get_ssl "back_tba_sa")
SSL_BACKEND_AALSAIGH=$(get_ssl "backend_aalsaigh_com")
SSL_BACKEND_ABURAHMAH=$(get_ssl "backend_aburahmah_com")
SSL_BACKEND_ALMUNIFI=$(get_ssl "backend_almunifi_com")
SSL_BACKEND_MK=$(get_ssl "backend_mila_knight_com")
SSL_BACKEND_DRSALEH=$(get_ssl "backend_drsalehalkhalaf_com")
SSL_CLICKUP=$(get_ssl "clickup_mila_knight_com")
SSL_DASH_AALSAIGH=$(get_ssl "dashboard_aalsaigh_com")
SSL_DASH_ABURAHMAH=$(get_ssl "dashboard_aburahmah_com")
SSL_DASH_MK=$(get_ssl "dashboard_mila_knight_com")
SSL_DASH_TBA=$(get_ssl "dashboard_tba_sa")
SSL_DRSALEH=$(get_ssl "drsalehalkhalaf_com_mila_knight_com")
SSL_EVOQUE=$(get_ssl "evoque_mila_knight_com")
SSL_MK=$(get_ssl "mila_knight_com")
SSL_PORTAINER=$(get_ssl "portainer_mila_knight_com")
SSL_TBABACKEND=$(get_ssl "tbabackend_mila_knight_com")
SSL_TBA=$(get_ssl "tba_sa_mila_knight_com")

echo "=== Generating nginx configs ==="

# --- DOCKER PROXY SITES ---

[ -n "$SSL_AALSAIGH" ] && write_proxy "aalsaigh.com" "9101" \
  "${SSL_AALSAIGH%%|*}" "${SSL_AALSAIGH##*|}" " www.aalsaigh.com"

[ -n "$SSL_ABURAHMAH" ] && write_proxy "aburahmah.com" "9106" \
  "${SSL_ABURAHMAH%%|*}" "${SSL_ABURAHMAH##*|}" " www.aburahmah.com"

[ -n "$SSL_ALMUNIFI" ] && write_proxy "almunifi.com" "9100" \
  "${SSL_ALMUNIFI%%|*}" "${SSL_ALMUNIFI##*|}" " www.almunifi.com"

[ -n "$SSL_TBA" ] && write_proxy "tba.sa" "9104" \
  "${SSL_TBA%%|*}" "${SSL_TBA##*|}" " www.tba.sa"

[ -n "$SSL_DRSALEH" ] && write_proxy "drsalehalkhalaf.com" "9105" \
  "${SSL_DRSALEH%%|*}" "${SSL_DRSALEH##*|}" " www.drsalehalkhalaf.com"

[ -n "$SSL_EVOQUE" ] && write_proxy "evoque.mila-knight.com" "9199" \
  "${SSL_EVOQUE%%|*}" "${SSL_EVOQUE##*|}" ""

[ -n "$SSL_PORTAINER" ] && write_proxy "portainer.mila-knight.com" "9000" \
  "${SSL_PORTAINER%%|*}" "${SSL_PORTAINER##*|}" ""

[ -n "$SSL_TBABACKEND" ] && write_proxy "tbabackend.mila-knight.com" "9004" \
  "${SSL_TBABACKEND%%|*}" "${SSL_TBABACKEND##*|}" ""

[ -n "$SSL_BACKEND_AALSAIGH" ] && write_proxy "backend.aalsaigh.com" "9003" \
  "${SSL_BACKEND_AALSAIGH%%|*}" "${SSL_BACKEND_AALSAIGH##*|}" ""

[ -n "$SSL_BACKEND_ALMUNIFI" ] && write_proxy "backend.almunifi.com" "9002" \
  "${SSL_BACKEND_ALMUNIFI%%|*}" "${SSL_BACKEND_ALMUNIFI##*|}" ""

[ -n "$SSL_BACKEND_DRSALEH" ] && write_proxy "backend.drsalehalkhalaf.com" "9005" \
  "${SSL_BACKEND_DRSALEH%%|*}" "${SSL_BACKEND_DRSALEH##*|}" ""

# Update backend.mila-knight.com to SSL (overwrite existing HTTP-only config)
[ -n "$SSL_BACKEND_MK" ] && write_proxy "backend.mila-knight.com" "9001" \
  "${SSL_BACKEND_MK%%|*}" "${SSL_BACKEND_MK##*|}" ""

# mila-knight.com -> milaknight-nextjs Docker container
[ -n "$SSL_MK" ] && write_proxy "mila-knight.com" "9103" \
  "${SSL_MK%%|*}" "${SSL_MK##*|}" " www.mila-knight.com"

# dashboard.mila-knight.com -> port 9002 (dr_almunifi_dashboard-app-1?)
# Actually it might be PHP-FPM, let's keep it as proxy to check
[ -n "$SSL_DASH_MK" ] && write_proxy "dashboard.mila-knight.com" "9002" \
  "${SSL_DASH_MK%%|*}" "${SSL_DASH_MK##*|}" ""

# --- PHP-FPM WORDPRESS SITES ---

[ -n "$SSL_AROMA" ] && write_wordpress "aroma.mila-knight.com" \
  "${PHP_SOCK_BASE}/89a8109cc92f2868c5736fa8386656f6b5354b00.sock" \
  "/home/milaknight/aroma.mila-knight.com" \
  "${SSL_AROMA%%|*}" "${SSL_AROMA##*|}" \
  " www.aroma.mila-knight.com" \
  "/etc/nginx/conf.d/users/milaknight/aroma.mila-knight.com/wp-toolkit.conf"

[ -n "$SSL_AROMAV2" ] && write_wordpress "aromav2.mila-knight.com" \
  "${PHP_SOCK_BASE}/816eafbe52819bf0dd85aa90263a67b2ca0794e7.sock" \
  "/home/milaknight/aromav2.mila-knight.com" \
  "${SSL_AROMAV2%%|*}" "${SSL_AROMAV2##*|}" \
  "" \
  "/etc/nginx/conf.d/users/milaknight/aromav2.mila-knight.com/wp-toolkit.conf"

[ -n "$SSL_BACK_ALMUNIFI" ] && write_wordpress "back.almunifi.com" \
  "${PHP_SOCK_BASE}/1427d0d9cf7808cedb69bac6c5429ce00fe7aede.sock" \
  "/home/milaknight/back.almunifi.com" \
  "${SSL_BACK_ALMUNIFI%%|*}" "${SSL_BACK_ALMUNIFI##*|}" "" ""

[ -n "$SSL_BACK_TBA" ] && write_wordpress "back.tba.sa" \
  "${PHP_SOCK_BASE}/f1d20685f92d0862681a78fd71fa9c189bd15c74.sock" \
  "/home/milaknight/back.tba.sa" \
  "${SSL_BACK_TBA%%|*}" "${SSL_BACK_TBA##*|}" "" ""

[ -n "$SSL_BACKEND_ABURAHMAH" ] && write_wordpress "backend.aburahmah.com" \
  "${PHP_SOCK_BASE}/b745cf29e7069ad964a0aa0d20e3763fa070a32e.sock" \
  "/home/milaknight/backend.aburahmah.com" \
  "${SSL_BACKEND_ABURAHMAH%%|*}" "${SSL_BACKEND_ABURAHMAH##*|}" "" ""

[ -n "$SSL_CLICKUP" ] && write_wordpress "clickup.mila-knight.com" \
  "${PHP_SOCK_BASE}/68e37f10c26fa410711877773f50ef721e4db68b.sock" \
  "/home/milaknight/clickup.mila-knight.com" \
  "${SSL_CLICKUP%%|*}" "${SSL_CLICKUP##*|}" "" ""

[ -n "$SSL_DASH_AALSAIGH" ] && write_wordpress "dashboard.aalsaigh.com" \
  "${PHP_SOCK_BASE}/3d2bf0166e253f9f804e82d2804c49e1b44e396e.sock" \
  "/home/milaknight/dashboard.aalsaigh.com" \
  "${SSL_DASH_AALSAIGH%%|*}" "${SSL_DASH_AALSAIGH##*|}" "" ""

[ -n "$SSL_DASH_ABURAHMAH" ] && write_wordpress "dashboard.aburahmah.com" \
  "${PHP_SOCK_BASE}/544287a57b5a693985cc818071742493b17489dd.sock" \
  "/home/milaknight/dashboard.aburahmah.com" \
  "${SSL_DASH_ABURAHMAH%%|*}" "${SSL_DASH_ABURAHMAH##*|}" "" ""

[ -n "$SSL_DASH_TBA" ] && write_wordpress "dashboard.tba.sa" \
  "${PHP_SOCK_BASE}/5acd9df890ddff713e0a1121c6b16424f183cb09.sock" \
  "/home/milaknight/dashboard.tba.sa" \
  "${SSL_DASH_TBA%%|*}" "${SSL_DASH_TBA##*|}" "" ""

echo ""
echo "=== Configs created. Listing: ==="
ls -la ${CONF_DIR}/*.conf

echo ""
echo "=== Testing nginx ==="
nginx -t 2>&1

if nginx -t 2>/dev/null; then
  echo "=== Reloading nginx ==="
  nginx -s reload
  echo "SUCCESS: nginx reloaded!"
else
  echo "FAILED: nginx config has errors"
fi
