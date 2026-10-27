import os
import sys

# Configure django environment
sys.path.insert(0, os.path.abspath('backend'))
sys.path.insert(0, os.path.abspath('.'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

import django
django.setup()

import pytest

if __name__ == '__main__':
    args = sys.argv[1:] if len(sys.argv) > 1 else ['tests', '-v']
    exit_code = pytest.main(args)
    sys.exit(exit_code)
