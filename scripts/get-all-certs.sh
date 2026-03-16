#!/bin/bash

EMAIL="admin@mila-knight.com"

echo "=== Getting Let's Encrypt certs for all domains ==="

get_cert() {
  local domains="$*"
  local first="${1}"
  echo ""
  echo "--- ${first} ---"
  certbot certonly --nginx --non-interactive --agree-tos --email "${EMAIL}" \
    $(for d in $domains; do echo -n "-d $d "; done) 2>&1 | tail -5
}

get_cert mila-knight.com www.mila-knight.com
get_cert aalsaigh.com www.aalsaigh.com
get_cert aburahmah.com www.aburahmah.com
get_cert almunifi.com www.almunifi.com
get_cert tba.sa www.tba.sa
get_cert drsalehalkhalaf.com www.drsalehalkhalaf.com
get_cert evoque.mila-knight.com
get_cert aroma.mila-knight.com www.aroma.mila-knight.com
get_cert aromav2.mila-knight.com
get_cert portainer.mila-knight.com
get_cert tbabackend.mila-knight.com
get_cert backend.aalsaigh.com
get_cert backend.almunifi.com
get_cert backend.drsalehalkhalaf.com
get_cert dashboard.mila-knight.com
get_cert dashboard.aalsaigh.com
get_cert dashboard.aburahmah.com
get_cert dashboard.tba.sa

echo ""
echo "=== Updating nginx configs to use LE certs where available ==="

update_le_cert() {
  local domain="$1"
  local conf="/etc/nginx/conf.d/${domain}.conf"
  local le_cert="/etc/letsencrypt/live/${domain}/fullchain.pem"
  local le_key="/etc/letsencrypt/live/${domain}/privkey.pem"

  if [ -f "$le_cert" ] && [ -f "$conf" ]; then
    sed -i "s|ssl_certificate .*;|ssl_certificate ${le_cert};|g" "$conf"
    sed -i "s|ssl_certificate_key .*;|ssl_certificate_key ${le_key};|g" "$conf"
    echo "  Updated: ${domain}"
  else
    echo "  Skipped: ${domain} (cert or conf not found)"
  fi
}

for d in backend.mila-knight.com mila-knight.com aalsaigh.com aburahmah.com almunifi.com \
          tba.sa drsalehalkhalaf.com evoque.mila-knight.com aroma.mila-knight.com \
          aromav2.mila-knight.com portainer.mila-knight.com tbabackend.mila-knight.com \
          backend.aalsaigh.com backend.almunifi.com backend.drsalehalkhalaf.com \
          dashboard.mila-knight.com dashboard.aalsaigh.com dashboard.aburahmah.com \
          dashboard.tba.sa; do
  update_le_cert "$d"
done

echo ""
echo "=== Testing and reloading nginx ==="
nginx -t 2>&1 && nginx -s reload && echo "nginx reloaded successfully"

echo ""
echo "=== Final cert list ==="
ls /etc/letsencrypt/live/
