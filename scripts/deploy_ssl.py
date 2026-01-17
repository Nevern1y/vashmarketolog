import paramiko
import time

# Server Details
HOST = "85.198.97.62"
USER = "root"
PASSWORD = "OqfD*e3GU&mE"
PROJECT_DIR = "/opt/vashmarketolog"
EMAIL = "cynoken666@gmail.com"
DOMAINS = ["lider-garant.ru", "www.lider-garant.ru", "lk.lider-garant.ru"]

def deploy_ssl():
    print(f"Connecting to {HOST}...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(hostname=HOST, username=USER, password=PASSWORD)
        print("Connected successfully.")
        
        # 1. Run Certbot
        domain_args = " ".join([f"-d {d}" for d in DOMAINS])
        certbot_cmd = (
            f"cd {PROJECT_DIR} && "
            f"docker compose -f docker-compose.prod.yml run --rm --entrypoint \"\" certbot "
            f"certbot certonly --webroot -w /var/www/certbot "
            f"{domain_args} "
            f"--email {EMAIL} --agree-tos --no-eff-email --force-renewal"
        )
        
        print(f"Running Certbot...")
        print(f"Command: {certbot_cmd}")
        
        stdin, stdout, stderr = client.exec_command(certbot_cmd)
        
        while True:
            line = stdout.readline()
            if not line:
                break
            print(line.strip())
            
        exit_status = stdout.channel.recv_exit_status()
        
        if exit_status == 0:
            print("Certbot finished successfully.")
            
            # 2. Copy Certificates
            # Certbot stores them in /certbot/conf/live/lider-garant.ru/
            # We need to copy them to /nginx/ssl/
            
            print("Copying certificates to Nginx SSL folder...")
            # We use the FIRST domain name for the folder
            primary_domain = DOMAINS[0]
            
            # NOTE: We are executing shell commands on the host to move files between mapped volumes
            copy_cmd = (
                f"cd {PROJECT_DIR} && "
                f"cp certbot/conf/live/{primary_domain}/fullchain.pem nginx/ssl/fullchain.pem && "
                f"cp certbot/conf/live/{primary_domain}/privkey.pem nginx/ssl/privkey.pem && "
                f"chmod 644 nginx/ssl/fullchain.pem && "
                f"chmod 600 nginx/ssl/privkey.pem"
            )
            
            stdin, stdout, stderr = client.exec_command(copy_cmd)
            err = stderr.read().decode()
            if err:
                print(f"Copy warning/error: {err}")
            
            # 3. Reload Nginx
            print("Reloading Nginx...")
            reload_cmd = f"cd {PROJECT_DIR} && docker compose -f docker-compose.prod.yml exec nginx nginx -s reload"
            stdin, stdout, stderr = client.exec_command(reload_cmd)
            print(stdout.read().decode())
            print(stderr.read().decode())
            print("Nginx reloaded.")
            
        else:
            print(f"Certbot failed with exit code {exit_status}")
            print("Error output:")
            print(stderr.read().decode())

    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    deploy_ssl()
