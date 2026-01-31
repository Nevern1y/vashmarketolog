from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('applications', '0024_add_lead_inn'),
    ]

    operations = [
        migrations.AddField(
            model_name='lead',
            name='utm_term',
            field=models.CharField(
                blank=True,
                default='',
                max_length=100,
                verbose_name='UTM Term'
            ),
        ),
        migrations.AddField(
            model_name='lead',
            name='utm_content',
            field=models.CharField(
                blank=True,
                default='',
                max_length=100,
                verbose_name='UTM Content'
            ),
        ),
        migrations.AddField(
            model_name='lead',
            name='page_url',
            field=models.URLField(
                blank=True,
                default='',
                help_text='Полный URL страницы, с которой отправлена заявка',
                max_length=500,
                verbose_name='URL страницы'
            ),
        ),
        migrations.AddField(
            model_name='lead',
            name='referrer',
            field=models.URLField(
                blank=True,
                default='',
                help_text='Предыдущая страница (откуда пришёл пользователь)',
                max_length=500,
                verbose_name='Реферер'
            ),
        ),
        migrations.AddField(
            model_name='lead',
            name='form_name',
            field=models.CharField(
                blank=True,
                default='',
                help_text='Идентификатор формы (calculator, header_form, callback_modal и т.д.)',
                max_length=100,
                verbose_name='Название формы'
            ),
        ),
        migrations.AddField(
            model_name='lead',
            name='message',
            field=models.TextField(
                blank=True,
                default='',
                help_text='Комментарий или вопрос от клиента',
                verbose_name='Сообщение клиента'
            ),
        ),
    ]
