# Request to Thapar's Tech Department — VM and Domain for the CoE-AM Website

Send to the tech department (copy the CoE-AM contact who approved the project). Fill in the parts
in square brackets. Their reply settles the remaining deployment details.

---

**Subject:** Server and domain request — CoE-AM website (am-tiet.thapar.edu)

Dear Sir/Madam,

I am developing the new website for the Centre of Excellence in Advanced Manufacturing (CoE-AM),
approved by [name, designation]. It will include a secure admin portal so the centre's staff can
update projects, industry offerings, people and gallery photos themselves.

To host it on the institute's infrastructure, I would be grateful for the following:

1. **A virtual machine**
   - Operating system: Ubuntu 22.04 or 24.04 LTS (Server)
   - 2 vCPU, 4 GB RAM, 40 GB disk

2. **Access for setup:** SSH access with sudo rights for me, from [date] until the end of the
   warranty period ([number] days after go-live). After that, the server is handed over to your
   team with a one-page operating guide; no routine work is needed from your side.

3. **Network**
   - Inbound ports 80 (HTTP) and 443 (HTTPS) open from the internet to the VM
   - Outbound internet access from the VM (for security updates and the HTTPS certificate)

4. **Domain:** a DNS record pointing **am-tiet.thapar.edu** to the VM's public IP address.

Could you also let me know:

5. Does the institute provide HTTPS certificates or a gateway/proxy in front of servers, or should
   the server obtain its own free certificate (Let's Encrypt)?
6. Is SSH reachable from outside the campus, or only over the institute VPN? If VPN, how can I get
   access?
7. Does the VM reach the internet through a proxy? If so, what are its address and port?
8. Is there a central backup system that could copy one folder from the VM nightly?
9. Approximately when could the VM and the domain be ready?

The setup is fully automated, and the server hardens itself: firewall, key-only SSH, automatic
security updates and nightly backups. I am happy to join a short call if that helps.

Thank you,
[Your name]
[Phone] | [Email]
