#!/usr/bin/env python3
"""
Simple API test script to verify backend functionality.
Run this script to test all endpoints.
"""

import requests
import os
import time

BASE_URL = "http://localhost:3001"

def test_health():
    """Test health endpoint"""
    print("🏥 Testing health endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print("✅ Health check passed")
            print(f"   Response: {response.json()}")
            return True
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False

def test_file_list():
    """Test file listing endpoint"""
    print("\n📋 Testing file list endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/files")
        if response.status_code == 200:
            files = response.json()
            print(f"✅ File list retrieved: {len(files)} files")
            return True
        else:
            print(f"❌ File list failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ File list error: {e}")
        return False

def test_upload_with_sample():
    """Test file upload with a sample PDF"""
    print("\n📤 Testing file upload...")
    
    # Create a simple PDF-like file for testing
    sample_content = b"%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/MediaBox [0 0 612 792]\n>>\nendobj\nxref\n0 4\n0000000000 65535 f \n0000000010 00000 n \n0000000079 00000 n \n0000000173 00000 n \ntrailer\n<<\n/Size 4\n/Root 1 0 R\n>>\nstartxref\n253\n%%EOF"
    
    try:
        files = {
            'pdf': ('test_document.pdf', sample_content, 'application/pdf')
        }
        
        response = requests.post(f"{BASE_URL}/upload", files=files)
        
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Upload successful: {result['originalName']}")
            print(f"   File name: {result['fileName']}")
            print(f"   Size: {result['size']} bytes")
            return result['fileName']
        else:
            print(f"❌ Upload failed: {response.status_code}")
            if response.headers.get('content-type', '').startswith('application/json'):
                print(f"   Error: {response.json()}")
            return None
    except Exception as e:
        print(f"❌ Upload error: {e}")
        return None

def test_download(filename):
    """Test file download"""
    if not filename:
        print("\n⏭️  Skipping download test (no file to download)")
        return False
        
    print(f"\n⬇️  Testing file download: {filename}")
    try:
        response = requests.get(f"{BASE_URL}/download/{filename}")
        if response.status_code == 200:
            print(f"✅ Download successful: {len(response.content)} bytes")
            return True
        else:
            print(f"❌ Download failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Download error: {e}")
        return False

def test_delete(filename):
    """Test file deletion"""
    if not filename:
        print("\n⏭️  Skipping delete test (no file to delete)")
        return False
        
    print(f"\n🗑️  Testing file deletion: {filename}")
    try:
        response = requests.delete(f"{BASE_URL}/files/{filename}")
        if response.status_code == 200:
            print("✅ Delete successful")
            return True
        else:
            print(f"❌ Delete failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Delete error: {e}")
        return False

def main():
    """Run all tests"""
    print("🧪 Starting API tests...")
    print(f"🔗 Base URL: {BASE_URL}")
    print("=" * 50)
    
    # Test health
    if not test_health():
        print("\n❌ Health check failed. Is the server running?")
        return
    
    # Test file listing
    test_file_list()
    
    # Test upload
    uploaded_filename = test_upload_with_sample()
    
    # Test download
    test_download(uploaded_filename)
    
    # Test delete
    test_delete(uploaded_filename)
    
    print("\n" + "=" * 50)
    print("🏁 API tests completed!")

if __name__ == "__main__":
    main()


