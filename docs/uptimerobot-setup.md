# UptimeRobot Monitoring Setup Guide
## Los Ricos Tacos Application

### Prerequisites
- UptimeRobot account (free tier: 50 monitors, 5-min intervals)
- Production domain or IP address

### Step 1: Create UptimeRobot Account

1. Go to https://uptimerobot.com
2. Sign up for free account
3. Verify email

### Step 2: Create Monitors

#### Monitor 1: Website Availability
- **Type**: HTTP(s)
- **Friendly Name**: Los Ricos Tacos - Website
- **URL**: https://yourdomain.com
- **Monitoring Interval**: 5 minutes
- **Monitor Timeout**: 30 seconds

#### Monitor 2: API Health Endpoint
- **Type**: HTTP(s)
- **Friendly Name**: Los Ricos Tacos - API Health
- **URL**: https://yourdomain.com/api/health
- **Monitoring Interval**: 5 minutes
- **Keyword Monitoring**: Enable
- **Keyword**: "success":true
- **Monitor Timeout**: 30 seconds

#### Monitor 3: Database Connectivity
- **Type**: HTTP(s)
- **Friendly Name**: Los Ricos Tacos - Database
- **URL**: https://yourdomain.com/api/menu/items
- **Monitoring Interval**: 5 minutes
- **Keyword Monitoring**: Enable
- **Keyword**: "success":true
- **Monitor Timeout**: 30 seconds

#### Monitor 4: SSL Certificate
- **Type**: HTTP(s)
- **Friendly Name**: Los Ricos Tacos - SSL Certificate
- **URL**: https://yourdomain.com
- **Monitoring Interval**: 1 day
- **SSL Monitoring**: Enable
- **Alert Before Expiry**: 30 days

### Step 3: Configure Alert Contacts

1. Go to "My Settings" → "Alert Contacts"
2. Add email addresses:
   - Primary: your-email@domain.com
   - Secondary: team@domain.com
3. Add SMS (optional, paid feature)
4. Add Slack/Discord webhook (optional)

### Step 4: Configure Alert Settings

For each monitor:
- **Alert When**: Down
- **Alert After**: 2 consecutive failures (10 minutes)
- **Alert Contacts**: Select all relevant contacts
- **Alert Frequency**: Every time

### Step 5: Set Up Status Page (Optional)

1. Go to "Public Status Pages"
2. Create new status page
3. Add all monitors
4. Customize branding
5. Get public URL: https://stats.uptimerobot.com/YOUR_ID

### Step 6: API Integration (Optional)

Get API key for programmatic access:
```bash
# Add to .env
UPTIMEROBOT_API_KEY=your_api_key_here
```

Create monitoring dashboard:
```bash
curl -X POST https://api.uptimerobot.com/v2/getMonitors \
  -d "api_key=YOUR_API_KEY" \
  -d "format=json"
```

### Recommended Monitor Configuration

```
Monitor Name              | URL                                    | Interval | Alerts
--------------------------|----------------------------------------|----------|--------
Website                   | https://yourdomain.com                 | 5 min    | Email, SMS
API Health                | https://yourdomain.com/api/health      | 5 min    | Email
Menu Endpoint             | https://yourdomain.com/api/menu/items  | 5 min    | Email
SSL Certificate           | https://yourdomain.com                 | 1 day    | Email
```

### Verification Steps

1. ✅ All monitors created and active
2. ✅ Alert contacts configured
3. ✅ Test alerts by pausing a monitor
4. ✅ Verify email notifications received
5. ✅ Status page accessible (if created)

### Production Checklist

- [ ] All 4 monitors created
- [ ] Alert contacts added and verified
- [ ] Alert thresholds configured (2 failures = 10 min)
- [ ] Status page created (optional)
- [ ] Team notified of monitoring setup
- [ ] Test alerts verified

### Maintenance

- Review uptime reports monthly
- Update alert contacts as team changes
- Monitor SSL certificate expiry alerts
- Check for false positives and adjust timeouts

**Note**: For this mission, UptimeRobot setup requires external account. Configuration is documented and ready to implement once production domain is available.
