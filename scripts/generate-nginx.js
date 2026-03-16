const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('=== Connected — Generating nginx configs ===\n');

  // This bash script runs on the server to generate all nginx configs
  const script = `
set -e

CERTS_DIR="/home/milaknight/ssl/certs"
KEYS_DIR="/home/milaknight/ssl/keys"
CONF_DIR="/etc/nginx/conf.d"

# Get cert and key paths for a domain prefix (snake_case prefix of cert filename)
get_ssl() {
  local prefix="$1"
  local cert=$(ls "${CERTS_DIR}/${prefix}"_*.crt 2>/dev/null | grep -v '\\.cache$' | sort -t_ -k$(echo "$prefix" | tr -cd '_' | wc -c)n -r | head -1)
  if [ -z "$cert" ]; then echo ""; return; fi
  local basename=$(basename "$cert" .crt)
  local hash=$(echo "$basename" | grep -oP '[0-9a-f]{5}_[0-9a-f]{5}(?=_[0-9]{10}_)')
  local key=$(ls "${KEYS_DIR}/${hash}_"*.key 2>/dev/null | head -1)
  echo "${cert}|${key}"
}

# Write nginx proxy config
write_proxy() {
  local domain="$1"
  local port="$2"
  local cert="$3"
  local key="$4"
  local aliases="${5:-}"

  echo "Creating proxy config for ${domain} -> :${port}"
  cat > "${CONF_DIR}/${domain}.conf" << NGINXEOF
server {
    listen 443 ssl http2;
    server_name ${domain}${aliases};

    ssl_certificate ${cert};
    ssl_certificate_key ${key};
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;

    location / {
        proxy_pass http://127.0.0.1:${port};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \\$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \\$host;
        proxy_set_header X-Real-IP \\$remote_addr;
        proxy_set_header X-Forwarded-For \\$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \\$scheme;
        proxy_cache_bypass \\$http_upgrade;
        proxy_read_timeout 60s;
    }
}

server {
    listen 80;
    server_name ${domain}${aliases};
    return 301 https://\\$host\\$request_uri;
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
  local aliases="${6:-}"
  local wptoolkit="${7:-}"

  echo "Creating WordPress config for ${domain} -> ${socket}"

  local wptoolkit_include=""
  if [ -n "$wptoolkit" ] && [ -f "$wptoolkit" ]; then
    wptoolkit_include="    include ${wptoolkit};"
  fi

  cat > "${CONF_DIR}/${domain}.conf" << NGINXEOF
server {
    listen 443 ssl http2;
    server_name ${domain}${aliases};

    ssl_certificate ${cert};
    ssl_certificate_key ${key};
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;

    root ${docroot};
    index index.php index.html;

${wptoolkit_include}

    location / {
        try_files \\$uri \\$uri/ /index.php?\\$args;
    }

    location ~ \\.php$ {
        fastcgi_pass unix:${socket};
        fastcgi_index index.php;
        fastcgi_param SCRIPT_FILENAME \\$document_root\\$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_read_timeout 300;
    }

    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires max;
        log_not_found off;
    }

    location ~ /\\.ht {
        deny all;
    }
}

server {
    listen 80;
    server_name ${domain}${aliases};
    return 301 https://\\$host\\$request_uri;
}
NGINXEOF
}

PHP_SOCK_BASE="/opt/cpanel/ea-php83/root/usr/var/run/php-fpm"

echo "=== Step 1: Get SSL paths for all domains ==="

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
SSL_BACKEND_DRSALEH=$(get_ssl "backend_drsalehalkhalaf_com")

echo "SSL paths gathered. Creating configs..."

# === PROXY CONFIGS (Docker containers) ===

# aalsaigh.com -> port 9101
if [ -n "$SSL_AALSAIGH" ]; then
  CERT="${SSL_AALSAIGH%%|*}"; KEY="${SSL_AALSAIGH##*|}"
  write_proxy "aalsaigh.com" "9101" "$CERT" "$KEY" " www.aalsaigh.com"
fi

# aburahmah.com -> port 9106
if [ -n "$SSL_ABURAHMAH" ]; then
  CERT="${SSL_ABURAHMAH%%|*}"; KEY="${SSL_ABURAHMAH##*|}"
  write_proxy "aburahmah.com" "9106" "$CERT" "$KEY" " www.aburahmah.com"
fi

# almunifi.com -> port 9100
if [ -n "$SSL_ALMUNIFI" ]; then
  CERT="${SSL_ALMUNIFI%%|*}"; KEY="${SSL_ALMUNIFI##*|}"
  write_proxy "almunifi.com" "9100" "$CERT" "$KEY" " www.almunifi.com"
fi

# tba.sa -> port 9104
if [ -n "$SSL_TBA" ]; then
  CERT="${SSL_TBA%%|*}"; KEY="${SSL_TBA##*|}"
  write_proxy "tba.sa" "9104" "$CERT" "$KEY" " www.tba.sa"
fi

# drsalehalkhalaf.com -> port 9105 (Dr.saleh docker container)
if [ -n "$SSL_DRSALEH" ]; then
  CERT="${SSL_DRSALEH%%|*}"; KEY="${SSL_DRSALEH##*|}"
  write_proxy "drsalehalkhalaf.com" "9105" "$CERT" "$KEY" " www.drsalehalkhalaf.com"
fi

# evoque.mila-knight.com -> port 9199
if [ -n "$SSL_EVOQUE" ]; then
  CERT="${SSL_EVOQUE%%|*}"; KEY="${SSL_EVOQUE##*|}"
  write_proxy "evoque.mila-knight.com" "9199" "$CERT" "$KEY"
fi

# portainer.mila-knight.com -> port 9000
if [ -n "$SSL_PORTAINER" ]; then
  CERT="${SSL_PORTAINER%%|*}"; KEY="${SSL_PORTAINER##*|}"
  write_proxy "portainer.mila-knight.com" "9000" "$CERT" "$KEY"
fi

# tbabackend.mila-knight.com -> port 9004
if [ -n "$SSL_TBABACKEND" ]; then
  CERT="${SSL_TBABACKEND%%|*}"; KEY="${SSL_TBABACKEND##*|}"
  write_proxy "tbabackend.mila-knight.com" "9004" "$CERT" "$KEY"
fi

# backend.aalsaigh.com -> port 9003
if [ -n "$SSL_BACKEND_AALSAIGH" ]; then
  CERT="${SSL_BACKEND_AALSAIGH%%|*}"; KEY="${SSL_BACKEND_AALSAIGH##*|}"
  write_proxy "backend.aalsaigh.com" "9003" "$CERT" "$KEY"
fi

# backend.almunifi.com -> PHP-FPM or proxy? Using PHP-FPM for now
if [ -n "$SSL_BACKEND_ALMUNIFI" ]; then
  CERT="${SSL_BACKEND_ALMUNIFI%%|*}"; KEY="${SSL_BACKEND_ALMUNIFI##*|}"
  write_proxy "backend.almunifi.com" "9002" "$CERT" "$KEY"
fi

# backend.drsalehalkhalaf.com -> port 9005
if [ -n "$SSL_BACKEND_DRSALEH" ]; then
  CERT="${SSL_BACKEND_DRSALEH%%|*}"; KEY="${SSL_BACKEND_DRSALEH##*|}"
  write_proxy "backend.drsalehalkhalaf.com" "9005" "$CERT" "$KEY"
fi

# Update backend.mila-knight.com to use SSL (was HTTP only)
if [ -n "$SSL_BACKEND_MK" ]; then
  CERT="${SSL_BACKEND_MK%%|*}"; KEY="${SSL_BACKEND_MK##*|}"
  write_proxy "backend.mila-knight.com" "9001" "$CERT" "$KEY"
fi

# mila-knight.com -> port 9103 (milaknight-nextjs)
if [ -n "$SSL_MK" ]; then
  CERT="${SSL_MK%%|*}"; KEY="${SSL_MK##*|}"
  write_proxy "mila-knight.com" "9103" "$CERT" "$KEY" " www.mila-knight.com"
fi

# dashboard.mila-knight.com -> PHP-FPM for now
if [ -n "$SSL_DASH_MK" ]; then
  CERT="${SSL_DASH_MK%%|*}"; KEY="${SSL_DASH_MK##*|}"
  write_proxy "dashboard.mila-knight.com" "9002" "$CERT" "$KEY"
fi

# dashboard.aalsaigh.com -> PHP-FPM
if [ -n "$SSL_DASH_AALSAIGH" ]; then
  CERT="${SSL_DASH_AALSAIGH%%|*}"; KEY="${SSL_DASH_AALSAIGH##*|}"
  SOCK="${PHP_SOCK_BASE}/3d2bf0166e253f9f804e82d2804c49e1b44e396e.sock"
  write_wordpress "dashboard.aalsaigh.com" "$SOCK" "/home/milaknight/dashboard.aalsaigh.com" "$CERT" "$KEY"
fi

# dashboard.aburahmah.com -> PHP-FPM
if [ -n "$SSL_DASH_ABURAHMAH" ]; then
  CERT="${SSL_DASH_ABURAHMAH%%|*}"; KEY="${SSL_DASH_ABURAHMAH##*|}"
  SOCK="${PHP_SOCK_BASE}/544287a57b5a693985cc818071742493b17489dd.sock"
  write_wordpress "dashboard.aburahmah.com" "$SOCK" "/home/milaknight/dashboard.aburahmah.com" "$CERT" "$KEY"
fi

# dashboard.tba.sa -> PHP-FPM
if [ -n "$SSL_DASH_TBA" ]; then
  CERT="${SSL_DASH_TBA%%|*}"; KEY="${SSL_DASH_TBA##*|}"
  SOCK="${PHP_SOCK_BASE}/5acd9df890ddff713e0a1121c6b16424f183cb09.sock"
  write_wordpress "dashboard.tba.sa" "$SOCK" "/home/milaknight/dashboard.tba.sa" "$CERT" "$KEY"
fi

# === PHP-FPM WORDPRESS CONFIGS ===

# aroma.mila-knight.com -> WordPress
if [ -n "$SSL_AROMA" ]; then
  CERT="${SSL_AROMA%%|*}"; KEY="${SSL_AROMA##*|}"
  SOCK="${PHP_SOCK_BASE}/89a8109cc92f2868c5736fa8386656f6b5354b00.sock"
  WPTOOLKIT="/etc/nginx/conf.d/users/milaknight/aroma.mila-knight.com/wp-toolkit.conf"
  write_wordpress "aroma.mila-knight.com" "$SOCK" "/home/milaknight/aroma.mila-knight.com" "$CERT" "$KEY" " www.aroma.mila-knight.com" "$WPTOOLKIT"
fi

# aromav2.mila-knight.com -> WordPress
if [ -n "$SSL_AROMAV2" ]; then
  CERT="${SSL_AROMAV2%%|*}"; KEY="${SSL_AROMAV2##*|}"
  SOCK="${PHP_SOCK_BASE}/816eafbe52819bf0dd85aa90263a67b2ca0794e7.sock"
  WPTOOLKIT="/etc/nginx/conf.d/users/milaknight/aromav2.mila-knight.com/wp-toolkit.conf"
  write_wordpress "aromav2.mila-knight.com" "$SOCK" "/home/milaknight/aromav2.mila-knight.com" "$CERT" "$KEY" "" "$WPTOOLKIT"
fi

# back.almunifi.com -> PHP-FPM
if [ -n "$SSL_BACK_ALMUNIFI" ]; then
  CERT="${SSL_BACK_ALMUNIFI%%|*}"; KEY="${SSL_BACK_ALMUNIFI##*|}"
  SOCK="${PHP_SOCK_BASE}/1427d0d9cf7808cedb69bac6c5429ce00fe7aede.sock"
  write_wordpress "back.almunifi.com" "$SOCK" "/home/milaknight/back.almunifi.com" "$CERT" "$KEY"
fi

# back.tba.sa -> PHP-FPM
if [ -n "$SSL_BACK_TBA" ]; then
  CERT="${SSL_BACK_TBA%%|*}"; KEY="${SSL_BACK_TBA##*|}"
  SOCK="${PHP_SOCK_BASE}/f1d20685f92d0862681a78fd71fa9c189bd15c74.sock"
  write_wordpress "back.tba.sa" "$SOCK" "/home/milaknight/back.tba.sa" "$CERT" "$KEY"
fi

# backend.aburahmah.com -> PHP-FPM (docker app container may be down)
if [ -n "$SSL_BACKEND_ABURAHMAH" ]; then
  CERT="${SSL_BACKEND_ABURAHMAH%%|*}"; KEY="${SSL_BACKEND_ABURAHMAH##*|}"
  SOCK="${PHP_SOCK_BASE}/b745cf29e7069ad964a0aa0d20e3763fa070a32e.sock"
  write_wordpress "backend.aburahmah.com" "$SOCK" "/home/milaknight/backend.aburahmah.com" "$CERT" "$KEY"
fi

# clickup.mila-knight.com -> PHP-FPM
if [ -n "$SSL_CLICKUP" ]; then
  CERT="${SSL_CLICKUP%%|*}"; KEY="${SSL_CLICKUP##*|}"
  SOCK="${PHP_SOCK_BASE}/68e37f10c26fa410711877773f50ef721e4db68b.sock"
  write_wordpress "clickup.mila-knight.com" "$SOCK" "/home/milaknight/clickup.mila-knight.com" "$CERT" "$KEY"
fi

echo ""
echo "=== Step 2: Verify configs ==="
ls -la ${CONF_DIR}/*.conf

echo ""
echo "=== Step 3: Test nginx config ==="
nginx -t 2>&1

if [ $? -eq 0 ]; then
  echo ""
  echo "=== Step 4: Reload nginx ==="
  nginx -s reload
  echo "nginx reloaded successfully!"
else
  echo "nginx config test FAILED - not reloading"
fi
`;

  conn.exec(`bash -s << 'SCRIPT'\n${script}\nSCRIPT`, (err, stream) => {
    if (err) throw err;
    stream.on('close', (code) => {
      console.log('\n=== Done, exit code:', code, '===');
      conn.end();
    }).on('data', (data) => {
      process.stdout.write(data.toString());
    }).stderr.on('data', (data) => {
      process.stderr.write(data.toString());
    });
  });
}).connect({
  host: '72.61.162.106',
  port: 22,
  username: 'root',
  password: ';hdFJ6C1?YYc6FD8gdY2',
  readyTimeout: 30000
});

conn.on('error', (err) => {
  console.error('Connection error:', err.message);
});
