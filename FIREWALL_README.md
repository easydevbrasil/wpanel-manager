# Firewall Controller

The Firewall Controller page provides a comprehensive interface for managing iptables rules on your server. This page allows you to control network traffic, block/allow specific IPs, and manage firewall rules through an intuitive web interface.

## Features

### 🛡️ Real-time Firewall Status
- View current firewall status (Active/Inactive)
- Monitor total rules, allow rules, and deny rules
- Track custom vs system rules

### ⚡ Quick Actions
- **Block IP**: Instantly block traffic from a specific IP address
- **Allow IP**: Allow traffic from a specific IP address
- Support for CIDR notation (e.g., 192.168.1.0/24)

### 📋 Rule Management
- **Add Custom Rules**: Create detailed firewall rules with specific criteria
- **Protocol Support**: TCP, UDP, ICMP, or All protocols
- **Port Management**: Target specific ports or port ranges
- **Interface Control**: Apply rules to specific network interfaces
- **Comments**: Add descriptions to rules for better organization

### 🔒 Safety Features
- **Protected Ports**: Automatic protection for essential ports (22, 80, 443, 25, 587, 993, 995)
- **System Rule Protection**: Prevents deletion of critical system rules
- **Validation**: Validates all commands before execution to prevent dangerous operations

### 📊 Rule Organization
- **Active Rules Tab**: View all currently active iptables rules
- **Common Ports Tab**: Quick reference for commonly used ports
- **Protected Ports Tab**: List of ports that cannot be blocked

## Protected Ports

The following ports are automatically protected from blocking to ensure system accessibility:

- **Port 22**: SSH (Secure Shell)
- **Port 80**: HTTP
- **Port 443**: HTTPS
- **Port 25**: SMTP (Simple Mail Transfer Protocol)
- **Port 587**: SMTP Submission
- **Port 993**: IMAPS (Secure IMAP)
- **Port 995**: POP3S (Secure POP3)

## Usage Examples

### Block a Single IP
1. Click "Ação Rápida" (Quick Action)
2. Select "Bloquear IP" (Block IP)
3. Enter the IP address (e.g., 192.168.1.100)
4. Click "Bloquear" (Block)

### Allow a Network Range
1. Click "Ação Rápida" (Quick Action)
2. Select "Liberar IP" (Allow IP)
3. Enter the network range (e.g., 192.168.1.0/24)
4. Click "Liberar" (Allow)

### Create a Custom Rule
1. Click "Nova Regra" (New Rule)
2. Configure the rule parameters:
   - **Action**: ACCEPT, DROP, or REJECT
   - **Protocol**: TCP, UDP, ICMP, or All
   - **Source IP**: Origin IP or network (optional)
   - **Destination IP**: Target IP or network (optional)
   - **Port**: Specific port or port range
   - **Interface**: Network interface (optional)
   - **Comment**: Description for the rule
3. Click "Adicionar Regra" (Add Rule)

### Block HTTP Traffic from a Specific Network
1. Click "Nova Regra"
2. Set:
   - Action: DROP
   - Protocol: TCP
   - Source IP: 10.0.0.0/8
   - Port: 80
   - Comment: Block HTTP from internal network
3. Click "Adicionar Regra"

## Safety Considerations

### ⚠️ Important Warnings
- **SSH Access**: Never block port 22 unless you have alternative access to the server
- **Web Services**: Blocking ports 80/443 will make web services inaccessible
- **Email Services**: Blocking email ports will stop mail delivery
- **Backup Access**: Always ensure you have alternative access methods before making changes

### 🔄 Rule Persistence
- Rules are applied immediately but are temporary by default
- Use the "Salvar Regras" (Save Rules) button to make rules persistent across reboots
- The system attempts to save rules using various methods depending on the Linux distribution

### 🧹 Maintenance
- **Flush Custom Rules**: Removes all custom rules while preserving system rules
- **Refresh**: Updates the rule list to show current status
- Rules are automatically refreshed every 30 seconds

## Technical Details

### Backend Implementation
- Uses `iptables` command-line tool for rule management
- Implements safety validation to prevent dangerous operations
- Supports multiple rule persistence methods for different Linux distributions
- Provides real-time rule parsing and status monitoring

### Supported Iptables Features
- INPUT chain rule management
- Protocol filtering (TCP, UDP, ICMP)
- Source/destination IP filtering
- Port-based filtering
- Interface-based filtering
- Connection state tracking
- Rule comments and organization

### API Endpoints
- `GET /api/firewall/rules`: Fetch all active rules
- `GET /api/firewall/stats`: Get firewall statistics
- `POST /api/firewall/rules`: Add a new rule
- `DELETE /api/firewall/rules/:id`: Remove a rule
- `POST /api/firewall/quick-action`: Quick block/allow actions
- `POST /api/firewall/flush`: Remove custom rules
- `POST /api/firewall/save`: Persist rules permanently

## Troubleshooting

### Common Issues

1. **"Permission denied" errors**
   - Ensure the application runs with sufficient privileges
   - Check if `iptables` is installed and accessible

2. **Rules not persisting after reboot**
   - Use the "Salvar Regras" button to make rules permanent
   - Check your Linux distribution's iptables persistence method

3. **Cannot access server after rule changes**
   - Restart the server to reset iptables to default state
   - Use console access to manually remove problematic rules

4. **Protected port warnings**
   - This is normal behavior to prevent accidental lockouts
   - Use the administration interface to modify protection if needed

### Recovery Procedures

If you accidentally block yourself:
1. Restart the server (rules are temporary by default)
2. Use console access to run: `iptables -F INPUT`
3. Access via alternative methods (console, KVM, etc.)
4. Review and correct the firewall configuration

## Best Practices

1. **Test First**: Always test rules on non-production systems first
2. **Document Changes**: Use the comment field to document the purpose of each rule
3. **Regular Backups**: Save working configurations before making changes
4. **Monitor Access**: Keep alternative access methods available
5. **Gradual Implementation**: Implement restrictive rules gradually
6. **Regular Review**: Periodically review and clean up unnecessary rules

## Integration

The Firewall Controller integrates seamlessly with the wpanel management system:
- Real-time updates through WebSocket connections
- Consistent UI/UX with other system components
- Role-based access control (when implemented)
- Audit logging for security compliance
