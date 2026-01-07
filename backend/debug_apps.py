"""
Run this script to diagnose application sharing issues.
Usage: python manage.py shell < debug_apps.py
"""
from apps.users.models import User
from apps.companies.models import CompanyProfile
from apps.applications.models import Application

print("=" * 50)
print("DIAGNOSIS: Application Sharing")
print("=" * 50)

# List all clients
print("\n--- CLIENTS ---")
clients = User.objects.filter(role='client')
for c in clients:
    company = CompanyProfile.objects.filter(owner=c, is_crm_client=False).first()
    inn = company.inn if company else "NO COMPANY"
    print(f"  {c.email} | INN: {inn} | invited_by: {c.invited_by}")

# List all agents
print("\n--- AGENTS ---")
agents = User.objects.filter(role='agent')
for a in agents:
    print(f"  {a.email}")

# List all CRM companies (agent's clients)
print("\n--- CRM COMPANIES (is_crm_client=True) ---")
crm_companies = CompanyProfile.objects.filter(is_crm_client=True)
for cp in crm_companies:
    print(f"  ID:{cp.id} | INN: {cp.inn} | Name: {cp.short_name or cp.name} | Owner: {cp.owner.email}")

# List all applications
print("\n--- APPLICATIONS ---")
apps = Application.objects.all()
for app in apps:
    print(f"  ID:{app.id} | Company ID: {app.company_id} | INN: {app.company.inn} | Created by: {app.created_by.email}")

# Test the matching logic
print("\n--- MATCHING TEST ---")
for c in clients:
    client_company = CompanyProfile.objects.filter(owner=c, is_crm_client=False).first()
    if client_company and client_company.inn:
        crm_matches = CompanyProfile.objects.filter(is_crm_client=True, inn=client_company.inn)
        print(f"Client {c.email} (INN: {client_company.inn}):")
        if crm_matches.exists():
            for crm in crm_matches:
                apps_count = Application.objects.filter(company=crm).count()
                print(f"    -> CRM Match: ID:{crm.id} | {apps_count} applications")
        else:
            print(f"    -> No CRM matches found")
    else:
        print(f"Client {c.email}: No company or no INN")

print("\n" + "=" * 50)
