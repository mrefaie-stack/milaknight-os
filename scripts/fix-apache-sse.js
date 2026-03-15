const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
  console.log('Connected to server');

  // Step 1: Find and display the Apache vhost config
  const findCmd = `
    echo "=== Finding Apache vhost config ===" &&
    find /etc/httpd /etc/apache2 -name "*.conf" 2>/dev/null | xargs grep -l "mila-knight\\|3333" 2>/dev/null &&
    echo "=== All conf files ===" &&
    find /etc/httpd /etc/apache2 -name "*.conf" 2>/dev/null
  `;

  conn.exec(findCmd, (err, stream) => {
    if (err) throw err;
    let output = '';
    stream.on('close', () => {
      console.log('Find output:', output);

      // Now apply the fix
      const fixCmd = `
        # Find the vhost config file
        CONF=$(find /etc/httpd /etc/apache2 -name "*.conf" 2>/dev/null | xargs grep -l "mila-knight\\|3333" 2>/dev/null | head -1)

        if [ -z "$CONF" ]; then
          echo "Config not found by grep, checking all vhost files..."
          CONF=$(find /etc/httpd/conf.d /etc/apache2/sites-enabled -name "*.conf" 2>/dev/null | head -1)
        fi

        echo "Config file: $CONF"

        if [ -n "$CONF" ]; then
          echo "=== CURRENT CONFIG ==="
          cat "$CONF"
          echo ""
          echo "=== APPLYING FIX ==="

          # Add flushpackets=on to ProxyPass directives that don't have it
          # Also add proxy-sendchunked and other SSE-friendly settings

          # Check if fix already applied
          if grep -q "flushpackets=on" "$CONF"; then
            echo "flushpackets=on already present"
          else
            # Backup
            cp "$CONF" "$CONF.bak"

            # Replace ProxyPass lines (not ProxyPassReverse) to add flushpackets=on
            sed -i 's|ProxyPass / http://localhost:3333/\\s*$|ProxyPass / http://localhost:3333/ flushpackets=on|g' "$CONF"
            sed -i 's|ProxyPass / http://localhost:3333/$|ProxyPass / http://localhost:3333/ flushpackets=on|' "$CONF"
            sed -i '/ProxyPass \\//{/ProxyPassReverse/!{/flushpackets/!s|http://localhost:3333/|http://localhost:3333/ flushpackets=on|}}' "$CONF"

            echo "=== UPDATED CONFIG ==="
            cat "$CONF"
          fi

          # Test Apache config
          echo "=== TESTING APACHE CONFIG ==="
          httpd -t 2>&1 || apachectl -t 2>&1

          # Reload Apache
          echo "=== RELOADING APACHE ==="
          systemctl reload httpd 2>/dev/null || systemctl reload apache2 2>/dev/null || apachectl graceful 2>/dev/null
          echo "Done"
        else
          echo "ERROR: No config file found"
          echo "=== Listing all httpd conf dirs ==="
          ls /etc/httpd/conf.d/ 2>/dev/null
          ls /etc/apache2/sites-enabled/ 2>/dev/null
          ls /etc/apache2/sites-available/ 2>/dev/null
        fi
      `;

      conn.exec(fixCmd, (err2, stream2) => {
        if (err2) throw err2;
        stream2.on('close', (code) => {
          console.log('Fix completed with code:', code);
          conn.end();
        }).on('data', (data) => {
          process.stdout.write('STDOUT: ' + data);
        }).stderr.on('data', (data) => {
          process.stderr.write('STDERR: ' + data);
        });
      });
    }).on('data', (data) => {
      output += data;
      process.stdout.write(data.toString());
    }).stderr.on('data', (data) => {
      process.stderr.write(data.toString());
    });
  });
}).connect({
  host: '72.61.162.106',
  port: 22,
  username: 'root',
  password: ';hdFJ6C1?YYc6FD8gdY2'
});
