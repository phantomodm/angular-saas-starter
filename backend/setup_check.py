#!/usr/bin/env python
"""
Backend Setup Helper Script
Guides users through setting up the FastAPI backend with Firebase
"""

import os
import sys
import json
from pathlib import Path

def print_header(text):
    """Print a formatted header"""
    print("\n" + "=" * 60)
    print(f"  {text}")
    print("=" * 60 + "\n")


def print_info(text):
    """Print information message"""
    print(f"ℹ️  {text}")


def print_success(text):
    """Print success message"""
    print(f"✅ {text}")


def print_error(text):
    """Print error message"""
    print(f"❌ {text}")


def print_warning(text):
    """Print warning message"""
    print(f"⚠️  {text}")


def check_python_version():
    """Check if Python version is compatible"""
    print_header("Checking Python Version")
    
    if sys.version_info < (3, 9):
        print_error(f"Python 3.9+ required. You have {sys.version_info.major}.{sys.version_info.minor}")
        return False
    
    print_success(f"Python {sys.version_info.major}.{sys.version_info.minor} detected")
    return True


def check_firebase_credentials():
    """Check if Firebase credentials file exists"""
    print_header("Checking Firebase Credentials")
    
    cred_path = Path("./serviceAccountKey.json")
    env_path = Path("./.env")
    
    if cred_path.exists():
        print_success(f"Found: {cred_path}")
        return True
    else:
        print_warning(f"Not found: {cred_path}")
        print_info("To get Firebase credentials:")
        print_info("1. Go to https://console.firebase.google.com")
        print_info("2. Select your project → Project Settings")
        print_info("3. Go to 'Service Accounts' tab")
        print_info("4. Click 'Generate New Private Key'")
        print_info("5. Save the JSON file as 'serviceAccountKey.json' in this directory")
        return False


def check_env_file():
    """Check if .env file exists"""
    print_header("Checking Environment Configuration")
    
    env_path = Path("./.env")
    
    if env_path.exists():
        print_success(f"Found: {env_path}")
        
        # Read and display settings
        with open(env_path, 'r') as f:
            lines = [line.strip() for line in f if line.strip() and not line.startswith('#')]
            for line in lines[:5]:
                print_info(f"  {line}")
        return True
    else:
        print_warning(f"Not found: {env_path}")
        print_info("Create .env file with:")
        print_info("  FIREBASE_CREDENTIALS_PATH=./serviceAccountKey.json")
        print_info("  FIREBASE_PROJECT_ID=your-project-id")
        print_info("  API_ALLOWED_ORIGINS=http://localhost:4200")
        print_info("  PORT=8000")
        return False


def check_virtual_env():
    """Check if virtual environment is active"""
    print_header("Checking Virtual Environment")
    
    in_venv = hasattr(sys, 'real_prefix') or (
        hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix
    )
    
    if in_venv:
        print_success(f"Virtual environment active: {sys.prefix}")
        return True
    else:
        print_warning("Virtual environment not active")
        print_info("Activate with:")
        print_info("  Windows: venv\\Scripts\\activate")
        print_info("  Mac/Linux: source venv/bin/activate")
        return False


def check_dependencies():
    """Check if required dependencies are installed"""
    print_header("Checking Dependencies")
    
    required_packages = [
        'fastapi',
        'uvicorn',
        'firebase_admin',
        'pydantic',
        'dotenv'
    ]
    
    missing = []
    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
            print_success(f"{package}")
        except ImportError:
            print_error(f"{package} (missing)")
            missing.append(package)
    
    if missing:
        print_warning(f"\nInstall missing packages with:")
        print_info(f"  pip install -r requirements.txt")
        return False
    
    return True


def check_port_available():
    """Check if port 8000 is available"""
    print_header("Checking Port Availability")
    
    import socket
    port = 8000
    
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        result = sock.connect_ex(('localhost', port))
        sock.close()
        
        if result == 0:
            print_warning(f"Port {port} is already in use")
            print_info("Change PORT in .env or stop the process using that port")
            return False
        else:
            print_success(f"Port {port} is available")
            return True
    except Exception as e:
        print_error(f"Could not check port: {str(e)}")
        return False


def run_diagnostics():
    """Run all diagnostic checks"""
    print_header("Backend Setup Diagnostics")
    
    checks = [
        ("Python Version", check_python_version),
        ("Virtual Environment", check_virtual_env),
        ("Dependencies", check_dependencies),
        ("Firebase Credentials", check_firebase_credentials),
        ("Environment Configuration", check_env_file),
        ("Port Availability", check_port_available),
    ]
    
    passed = 0
    failed = 0
    
    for name, check_func in checks:
        try:
            if check_func():
                passed += 1
            else:
                failed += 1
        except Exception as e:
            print_error(f"Check failed: {str(e)}")
            failed += 1
    
    print_header("Diagnostics Summary")
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {failed}")
    
    if failed == 0:
        print_success("\nAll checks passed! Ready to start the server.\n")
        print("Run with: python main.py")
        return True
    else:
        print_warning(f"\n{failed} checks failed. Please fix the issues above.\n")
        return False


def main():
    """Main entry point"""
    print("\n")
    print("╔══════════════════════════════════════════════════════╗")
    print("║  Angular SaaS Backend Setup Helper                  ║")
    print("║  FastAPI + Firebase Authentication                 ║")
    print("╚══════════════════════════════════════════════════════╝")
    
    try:
        success = run_diagnostics()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\nSetup cancelled by user")
        sys.exit(1)
    except Exception as e:
        print_error(f"\nUnexpected error: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()
