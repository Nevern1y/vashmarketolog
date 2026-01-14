"""
Migration script for importing landing page data into SEO system.

This script:
1. Creates banks from landing page constants
2. Creates SEO pages for each landing section
3. Applies templates with FAQ and popular searches
4. Creates SEO Manager user and group
"""
import os
import sys
import django

# Setup Django environment
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.seo.models import SeoPage
from apps.bank_conditions.models import Bank, BankCondition
from apps.seo.utils.templates import SEO_TEMPLATES


# Banks from landing page constants (lider-garant/src/constants/index.ts)
BANKS_FROM_LANDING = [
    "Реалист",
    "Банк Казани",
    "Абсолют",
    "МТС",
    "Зенит",
    "Альфа",
    "ПСБ",
    "Газпромбанк",
    "Уралсиб",
    "Металлинвестбанк",
    "Совкомбанк",
    "МКБ",
    "Банк Левобережный",
    "Руснарбанк",
    "СГБ",
    "МСП",
    "ТКБ",
    "Санкт-Петербург",
    "Тиньков",
    "Ингострахбанк",
    "СДМ Банк",
    "ЛокоБанк",
    "Ак Барс",
    "Алеф-Банк",
    "Евразийский Банк",
    "Росбанк",
    "Транстройбанк",
    "Урал ФД",
    "Банк Колуга",
    "Банк Солидарности",
    "Меткомбанк",
    "Солид Банк",
    "Промсоцбанк",
    "БСПБ",
    "Камкомбанк",
    "Озон Банк",
    "Дом РФ",
    "Кубань Кредит",
    "Газстрансбанк",
    "Сбербанк",
]

# SEO pages to create based on landing page structure
PAGES_TO_CREATE = [
    {
        'slug': 'rko',
        'template': 'rko',
        'meta_title': 'РКО и спецсчета — лучшие условия',
        'meta_description': 'РКО и спецсчета для участия в торгах. Лучшие банки для бизнеса.',
    },
    {
        'slug': 'factoring-dlya-biznesa',
        'template': 'factoring',
        'meta_title': 'Факторинг для бизнеса — лучшие условия',
        'meta_description': 'Факторинг для юридических лиц и ИП. Финансирование до 100 млн ₽ под уступку права требования.',
    },
    {
        'slug': 'lising-dlya-yrlic',
        'template': 'leasing',
        'meta_title': 'Лизинг для бизнеса — выгодное финансирование',
        'meta_description': 'Лизинг оборудования и транспорта для бизнеса. До 90% от стоимости объекта, срок до 5 лет.',
    },
    {
        'slug': 'bankovskie-garantii',
        'template': 'guarantees',
        'meta_title': 'Банковские гарантии для участия в госзакупках',
        'meta_description': 'Банковские гарантии для обеспечения заявок и исполнения контрактов. Работаем с ведущими банками.',
    },
    {
        'slug': 'kredity-dlya-biznesa',
        'template': 'credits',
        'meta_title': 'Кредиты для бизнеса — условия и ставки',
        'meta_description': 'Бизнес-кредиты для юридических лиц и ИП. Льготное кредитование, кредитование оборотного капитала.',
    },
    {
        'slug': 'deposity',
        'template': 'deposits',
        'meta_title': 'Депозиты для юридических лиц — лучшие ставки',
        'meta_description': 'Депозитные счета для бизнеса. Выгодные ставки по депозитам для юридических лиц и ИП.',
    },
    {
        'slug': 'ved',
        'template': 'ved',
        'meta_title': 'Международные платежи — услуги для ВЭД',
        'meta_description': 'Международные переводы для бизнеса. Валютные переводы, экспортные и импортные платежи, SWIFT-переводы.',
    },
    {
        'slug': 'strahovanie',
        'template': 'insurance',
        'meta_title': 'Страхование для бизнеса — полисы для компаний',
        'meta_description': 'Страхование имущества и ответственности для бизнеса. Лучшие страховые компании и условия.',
    },
    {
        'slug': 'tendernoe-soprovojdenie',
        'template': 'tender',
        'meta_title': 'Тендерное сопровождение — помощь в госзакупках',
        'meta_description': 'Сопровождение участия в государственных и коммерческих закупках. Поиск и подготовка документации.',
    },
    {
        'slug': 'proverka-contragentov',
        'template': 'checking',
        'meta_title': 'Проверка контрагентов — анализ юридических лиц',
        'meta_description': 'Проверка контрагентов перед сотрудничеством. Анализ благонадёжности партнёров.',
    },
]


def create_banks():
    """Create or update banks from landing constants."""
    print("Creating banks...")
    created_count = 0
    updated_count = 0
    
    for bank_name in BANKS_FROM_LANDING:
        bank, created = Bank.objects.get_or_create(
            name=bank_name,
            defaults={
                'short_name': bank_name[:20] if len(bank_name) > 20 else bank_name,
                'is_active': True,
                'order': 0
            }
        )
        if created:
            created_count += 1
        else:
            updated_count += 1
    
    print("Banks: {} created, {} already exist".format(created_count, updated_count))
    return Bank.objects.filter(is_active=True).count()


def create_seo_pages():
    """Create SEO pages for each landing section."""
    print("\nCreating SEO pages...")
    active_banks = list(Bank.objects.filter(is_active=True))
    
    for page_data in PAGES_TO_CREATE:
        slug = page_data['slug']
        template_name = page_data['template']
        template = SEO_TEMPLATES.get(template_name, {})
        
        print("  Processing: {}...".format(slug))
        
        page, created = SeoPage.objects.get_or_create(
            slug=slug,
            defaults={
                'meta_title': template.get('meta_title', page_data.get('meta_title', '')),
                'meta_description': template.get('meta_description', page_data.get('meta_description', '')),
                'meta_keywords': template.get('meta_keywords', ''),
                'h1_title': template.get('h1_title', ''),
                'main_description': template.get('main_description', ''),
                'faq': template.get('faqs', []),
                'popular_searches': template.get('popular_searches', []),
                'page_type': 'product',
                'template_name': template_name,
                'is_published': True,
                'priority': 0
            }
        )
        
        if created:
            # Assign first 9 active banks
            if active_banks:
                page.banks.set(active_banks[:9])
                print("    Created with template: {}".format(template_name))
            else:
                print("    - Already exists")
    
    total_pages = SeoPage.objects.filter(is_published=True).count()
    print("\nTotal SEO pages: {}".format(total_pages))


def create_seo_manager():
    """Create SEO Manager user and group."""
    print("\nCreating SEO Manager user and group...")
    
    from django.contrib.auth.models import Group, Permission
    from django.contrib.contenttypes.models import ContentType
    
    # Create or get SEO Manager group
    seo_group, _ = Group.objects.get_or_create(name='SEO Manager')
    print("  Group '{}' ready".format(seo_group.name))
    
    # Add permissions for SEO pages
    seo_content_type = ContentType.objects.get(
        app_label='seo',
        model='seopage'
    )
    seo_permissions = Permission.objects.filter(content_type=seo_content_type)
    seo_group.permissions.add(*seo_permissions)
    print("  Added {} SEO permissions to group".format(seo_permissions.count()))
    
    # Add view permissions for Bank
    bank_content_type = ContentType.objects.get(
        app_label='bank_conditions',
        model='bank'
    )
    view_bank_permission = Permission.objects.get(
        content_type=bank_content_type,
        codename='view_bank'
    )
    seo_group.permissions.add(view_bank_permission)
    print("  Added view_bank permission to group")
    
    # Check if seo_manager user exists
    User = django.contrib.auth.get_user_model()
    try:
        user = User.objects.get(email='seo@lidergarant.ru')
        print("  - User 'seo@lidergarant.ru' already exists")
    except User.DoesNotExist:
        # Create user
        user = User.objects.create_user(
            email='seo@lidergarant.ru',
            password='SeoManager123!',
            role='admin',
            first_name='SEO',
            last_name='Manager',
            is_staff=False,  # Don't give admin access, only API
            is_active=True
        )
        user.groups.add(seo_group)
        print("  Created user 'seo@lidergarant.ru'")
        print("  - Added to '{}' group".format(seo_group.name))
        print("\n  Default password: SeoManager123!")
        print("  IMPORTANT: Change this password after first login!")


def main():
    """Main migration function."""
    print("=" * 60)
    print("SEO DATA MIGRATION SCRIPT")
    print("=" * 60)
    
    try:
        # Create banks
        bank_count = create_banks()
        
        # Create SEO pages
        create_seo_pages()
        
        # Create SEO Manager
        create_seo_manager()
        
        print("\n" + "=" * 60)
        print("SUCCESS: MIGRATION COMPLETED")
        print("=" * 60)
        print("\nSummary:")
        print("  - Total banks: {}".format(bank_count))
        print("  - Total SEO pages: {}".format(SeoPage.objects.filter(is_published=True).count()))
        print("  - SEO Manager: seo@lidergarant.ru")
        print("\nNext steps:")
        print("  1. Login to Django Admin: http://localhost:8000/admin")
        print("  2. Check SEO Pages section")
        print("  3. Check Bank Conditions section")
        print("  4. Upload bank logos via Bank admin")
        print("  5. Test frontend: http://localhost:3000/rko")
        
    except Exception as e:
        print("\n" + "=" * 60)
        print("ERROR: {}".format(str(e)))
        print("=" * 60)
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
