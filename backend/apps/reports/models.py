from django.db import models


class Report(models.Model):
    TYPE_DAILY = 'daily'
    TYPE_WEEKLY = 'weekly'
    TYPE_MONTHLY = 'monthly'
    TYPE_CUSTOM = 'custom'

    TYPE_CHOICES = [
        (TYPE_DAILY, 'Daily Visitor Report'),
        (TYPE_WEEKLY, 'Weekly Analytics Report'),
        (TYPE_MONTHLY, 'Monthly Trend Report'),
        (TYPE_CUSTOM, 'Custom Filtered Report'),
    ]

    FORMAT_PDF = 'pdf'
    FORMAT_CSV = 'csv'
    FORMAT_EXCEL = 'excel'

    FORMAT_CHOICES = [
        (FORMAT_PDF, 'PDF Document'),
        (FORMAT_CSV, 'CSV Spreadsheet'),
        (FORMAT_EXCEL, 'Excel Workbook'),
    ]

    STATUS_GENERATING = 'generating'
    STATUS_READY = 'ready'
    STATUS_FAILED = 'failed'

    STATUS_CHOICES = [
        (STATUS_GENERATING, 'Generating'),
        (STATUS_READY, 'Ready'),
        (STATUS_FAILED, 'Failed'),
    ]

    report_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default=TYPE_DAILY)
    title = models.CharField(max_length=255)
    start_date = models.DateField()
    end_date = models.DateField()
    file_format = models.CharField(max_length=10, choices=FORMAT_CHOICES, default=FORMAT_PDF)

    filters_applied = models.JSONField(default=dict, blank=True)
    summary_data = models.JSONField(default=dict, blank=True)

    file_path = models.CharField(max_length=500, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_GENERATING)
    error_message = models.TextField(blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'reports'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.file_format.upper()} - {self.status})"
