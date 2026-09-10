<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

## Database

Access the database

```bash
sudo mariadb -u root -p
```

Create the api database

```bash
CREATE DATABASE izac_db;
```

Create the user api

```bash
CREATE USER 'izac_api'@'localhost' IDENTIFIED BY 'replace_with_a_strong_password';
```

Grant permissions only to that database

```bash
GRANT ALL PRIVILEGES ON izac_db.* TO 'izac_api'@'localhost';
FLUSH PRIVILEGES;
```

Example of .env file

Use the repository template in [.env.example](.env.example) and copy it to a local `.env` file before running the app.

```bash
DB_HOST=192.168.X.X
DB_PORT=3306
DB_USERNAME=izac_api
DB_PASSWORD=replace_with_a_strong_password
DB_NAME=izac_db
```

Example of TypeORM Module set up

```ts
TypeOrmModule.forRoot({
  type: 'mariadb',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  entities: [__dirname + '/**/*.entity{.ts,.js}'],
  synchronize: true,
});
```

## Security note

Never commit real secrets to the repository. Keep production values in a local `.env` file, and use [.env.example](.env.example) as the safe template for other developers.

## Raspberry Pi background services with systemd

For a Raspberry Pi cluster, the recommended pattern is to run a small independent MQTT agent as a background daemon instead of depending on the Nest API process to keep publishing telemetry. This keeps each device autonomous and avoids having the backend be the only process that can publish status messages.

### Why use systemd?

`systemd` is the standard service manager on Raspberry Pi OS. It gives you:

- automatic startup on boot
- watchdog/restart support
- easy log inspection with `journalctl`
- no need for cron for live telemetry publishing
- better reliability than a manual shell script left running in a terminal

### Install MQTT client library

On each Raspberry Pi:

```bash
sudo apt update
sudo apt install -y python3-paho-mqtt python3-psutil
```

### Create the agent directory

```bash
sudo mkdir -p /opt/izac-agent
cd /opt/izac-agent
```

### Create the agent script

```bash
sudo nano /opt/izac-agent/izac_agent.py
```

Example content:

```python
import json
import os
import socket
import time
from datetime import datetime, timezone

import paho.mqtt.client as mqtt
import psutil

BROKER_HOST = os.getenv("MQTT_BROKER_HOST", "192.168.0.50")
BROKER_PORT = int(os.getenv("MQTT_BROKER_PORT", "1883"))
DEVICE_NAME = os.getenv("DEVICE_NAME", socket.gethostname())
LOCATION = os.getenv("DEVICE_LOCATION", "unknown")
DEVICE_IP = os.getenv("DEVICE_IP", "unknown")
PUBLISH_INTERVAL = int(os.getenv("PUBLISH_INTERVAL", "10"))


def get_uptime_seconds():
    with open("/proc/uptime", "r", encoding="utf-8") as file:
        return float(file.readline().split()[0])


def get_memory_usage():
    mem = psutil.virtual_memory()
    used_pct = mem.percent
    free_mb = mem.available / (1024 * 1024)
    total_mb = mem.total / (1024 * 1024)
    return f"{used_pct:.1f}% used | {free_mb:.1f} MB free | {total_mb:.1f} MB total"


def get_temperature_celsius():
    try:
        with open("/sys/class/thermal/thermal_zone0/temp", "r", encoding="utf-8") as file:
            value = int(file.read().strip())
        return round(value / 1000, 1)
    except Exception:
        try:
            import subprocess
            output = subprocess.check_output(
                ["/usr/bin/vcgencmd", "measure_temp"],
                text=True,
                stderr=subprocess.DEVNULL,
            )
            value = output.replace("temp=", "").replace("'C", "")
            return round(float(value), 1)
        except Exception:
            return None


def get_iso_timestamp():
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def get_status_payload():
    payload = {
        "deviceName": DEVICE_NAME,
        "status": "online",
        "ip": DEVICE_IP,
        "location": LOCATION,
        "uptime": f"{int(get_uptime_seconds())}s",
        "memory": get_memory_usage(),
        "temperature": get_temperature_celsius(),
        "version": "1.0.0",
        "timestamp": get_iso_timestamp(),
    }
    return json.dumps(payload)


def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print(f"[IZAC] Connected to MQTT broker at {BROKER_HOST}:{BROKER_PORT}")
    else:
        print(f"[IZAC] Connection failed with code {rc}")


def main():
    client = mqtt.Client(client_id=f"izac-agent-{DEVICE_NAME}")
    client.on_connect = on_connect

    while True:
        try:
            client.connect(BROKER_HOST, BROKER_PORT, 60)
            break
        except Exception as exc:
            print(f"[IZAC] Retry connection to MQTT broker: {exc}")
            time.sleep(5)

    while True:
        try:
            payload = get_status_payload()
            client.publish("izac/devices/status", payload, qos=0, retain=False)
            print(f"[IZAC] Published: {payload}")
            client.loop(timeout=1)
            time.sleep(PUBLISH_INTERVAL)
        except KeyboardInterrupt:
            break
        except Exception as exc:
            print(f"[IZAC] Publish error: {exc}")
            time.sleep(5)


if __name__ == "__main__":
    main()
```

### Create the service file

```bash
sudo nano /etc/systemd/system/izac-agent.service
```

Example content:

```ini
[Unit]
Description=IZAC MQTT Agent
After=network.target

[Service]
Type=simple
Environment=MQTT_BROKER_HOST=192.168.0.50
Environment=MQTT_BROKER_PORT=1883
Environment=DEVICE_NAME=node-1
Environment=DEVICE_LOCATION=room-1
Environment=DEVICE_IP=192.168.0.21
Environment=PUBLISH_INTERVAL=10
WorkingDirectory=/opt/izac-agent
ExecStart=/usr/bin/python3 /opt/izac-agent/izac_agent.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Important note: the service must run as a valid system user. If you set `User=pi`, make sure that user exists on the machine. If it does not, the service will fail at startup with `Failed to determine user credentials: No such process`.

For a quick local setup, removing the `User=` line entirely is often the fastest solution while testing. For production, create a dedicated service user instead.

### Reload and start the service

```bash
sudo systemctl daemon-reload
sudo systemctl enable izac-agent
sudo systemctl start izac-agent
sudo systemctl status izac-agent
```

### Check logs

```bash
sudo journalctl -u izac-agent -f
```

### Test the message flow

On the broker host or any machine that can reach the broker:

```bash
mosquitto_sub -h 192.168.0.50 -p 1883 -t "izac/devices/status" -v
```

You should see messages arriving from each Raspberry Pi agent.

### Why this pattern is preferred over cron jobs

A cron job is okay for periodic maintenance tasks, but it is not ideal for device telemetry because:

- it is not always-on
- it does not handle reconnects gracefully
- it may run late or be missed depending on system load
- it is harder to monitor and debug

A `systemd` daemon is a better choice for edge devices because it behaves like a real background service with automatic restarts and log collection.

### Extending this pattern for other daemon services

The same pattern can be reused for future background services such as:

- sensor polling agents
- telemetry exporters
- gateways between local hardware and MQTT
- database sync workers
- cleanup and report jobs

For each new service, create:

1. a Python or Node.js script
2. a systemd unit file
3. required environment variables
4. logs via `journalctl` for debugging
5. a clean restart policy with `Restart=always`

This keeps the cluster resilient and easy to maintain over time.
