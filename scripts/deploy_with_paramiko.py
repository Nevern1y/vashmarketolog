import paramiko
import sys
import os
import time

# Server Details
HOST = "85.198.97.62"
USER = "root"
PASSWORD = "OqfD*e3GU&mE"
LOCAL_SCRIPT_PATH = "deploy-server.sh"
REMOTE_SCRIPT_PATH = "/root/deploy-server.sh"

def deploy():
    print(f"Connecting to {HOST}...")
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        client.connect(hostname=HOST, username=USER, password=PASSWORD)
        print("Connected successfully.")
        
        # SFTP Upload
        sftp = client.open_sftp()
        print(f"Uploading {LOCAL_SCRIPT_PATH} to {REMOTE_SCRIPT_PATH}...")
        sftp.put(LOCAL_SCRIPT_PATH, REMOTE_SCRIPT_PATH)
        sftp.close()
        print("Upload complete.")
        
        # Execute Script
        print("Executing deployment script...")
        # Make executable and run
        # We use -u for unbuffered output python, but for bash just running it is fine.
        # We want to see output in real-time if possible, step by step.
        
        stdin, stdout, stderr = client.exec_command(f"chmod +x {REMOTE_SCRIPT_PATH} && {REMOTE_SCRIPT_PATH}")
        
        # Stream output
        while True:
            line = stdout.readline()
            if not line:
                break
            print(line.strip())
            
        # Check for errors
        errors = stderr.read().decode()
        if errors:
            print("Errors/Warnings:")
            print(errors)
            
        exit_status = stdout.channel.recv_exit_status()
        print(f"Script finished with exit code {exit_status}")
        
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    deploy()
