"""
API Testing Script
Test endpoints without needing curl or Postman
"""

import httpx
import asyncio
import os
from typing import Optional


class APITester:
    """Simple API testing client"""
    
    def __init__(self, base_url: str = "http://localhost:8000"):
        self.base_url = base_url
        self.token = None
    
    def set_token(self, token: str):
        """Set Firebase token for authenticated requests"""
        self.token = token
        print(f"✅ Token set")
    
    def _get_headers(self, **extra_headers):
        """Get request headers with token if available"""
        headers = {
            "Content-Type": "application/json",
            **extra_headers
        }
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers
    
    async def test_health(self):
        """Test health check endpoint"""
        print("\n" + "=" * 60)
        print("Testing: GET /health")
        print("=" * 60)
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(f"{self.base_url}/health")
                print(f"Status: {response.status_code}")
                print(f"Response: {response.json()}")
                return response.status_code == 200
            except httpx.ConnectError:
                print(f"❌ Could not connect to {self.base_url}")
                print("   Make sure backend is running: python main.py")
                return False
            except Exception as e:
                print(f"❌ Error: {str(e)}")
                return False
    
    async def test_verify_token(self):
        """Test token verification"""
        print("\n" + "=" * 60)
        print("Testing: POST /api/auth/verify-token")
        print("=" * 60)
        
        if not self.token:
            print("⚠️  No token set. Use set_token() first")
            return False
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{self.base_url}/api/auth/verify-token",
                    headers=self._get_headers()
                )
                print(f"Status: {response.status_code}")
                print(f"Response: {response.json()}")
                return response.status_code == 200
            except Exception as e:
                print(f"❌ Error: {str(e)}")
                return False
    
    async def test_get_profile(self):
        """Test get user profile"""
        print("\n" + "=" * 60)
        print("Testing: GET /api/user/profile")
        print("=" * 60)
        
        if not self.token:
            print("⚠️  No token set. Use set_token() first")
            return False
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.base_url}/api/user/profile",
                    headers=self._get_headers()
                )
                print(f"Status: {response.status_code}")
                print(f"Response: {response.json()}")
                return response.status_code == 200
            except Exception as e:
                print(f"❌ Error: {str(e)}")
                return False
    
    async def test_org_access(self, org_id: str = "org-123"):
        """Test organization access"""
        print("\n" + "=" * 60)
        print(f"Testing: GET /api/org/{org_id}/dashboard")
        print("=" * 60)
        
        if not self.token:
            print("⚠️  No token set. Use set_token() first")
            return False
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.base_url}/api/org/{org_id}/dashboard",
                    headers=self._get_headers(**{"X-Organization-Id": org_id})
                )
                print(f"Status: {response.status_code}")
                print(f"Response: {response.json()}")
                return response.status_code in [200, 403]
            except Exception as e:
                print(f"❌ Error: {str(e)}")
                return False
    
    async def test_admin_users(self):
        """Test admin users endpoint"""
        print("\n" + "=" * 60)
        print("Testing: GET /api/admin/users (requires admin role)")
        print("=" * 60)
        
        if not self.token:
            print("⚠️  No token set. Use set_token() first")
            return False
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.base_url}/api/admin/users",
                    headers=self._get_headers()
                )
                print(f"Status: {response.status_code}")
                print(f"Response: {response.json()}")
                return response.status_code in [200, 403]
            except Exception as e:
                print(f"❌ Error: {str(e)}")
                return False
    
    async def run_all_tests(self):
        """Run all tests"""
        print("\n")
        print("╔══════════════════════════════════════════════════════╗")
        print("║  API Endpoint Testing                              ║")
        print("╚══════════════════════════════════════════════════════╝")
        
        results = []
        
        # Test health (no auth required)
        results.append(("Health Check", await self.test_health()))
        
        if self.token:
            # Test auth endpoints
            results.append(("Verify Token", await self.test_verify_token()))
            results.append(("Get Profile", await self.test_get_profile()))
            results.append(("Org Access", await self.test_org_access()))
            results.append(("Admin Users", await self.test_admin_users()))
        
        # Print summary
        print("\n" + "=" * 60)
        print("Test Summary")
        print("=" * 60)
        for name, passed in results:
            status = "✅ PASSED" if passed else "❌ FAILED"
            print(f"{name:.<40} {status}")


async def main():
    """Main entry point"""
    tester = APITester()
    
    print("\n=== Firebase Backend API Testing ===\n")
    print("Instructions:")
    print("1. Make sure backend is running: python main.py")
    print("2. Get a Firebase token from your Angular app")
    print("3. Paste the token when prompted\n")
    
    # Try health check first (no token needed)
    passed = await tester.test_health()
    
    if not passed:
        print("\n⚠️  Backend not running or connection failed")
        print("Start backend with: python main.py")
        return
    
    # Optionally test with token
    token = input("\nEnter Firebase token (or press Enter to skip auth tests): ").strip()
    if token:
        tester.set_token(token)
    
    # Run all tests
    await tester.run_all_tests()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n\nTesting cancelled by user")
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
