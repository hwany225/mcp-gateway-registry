"""
Okta authentication module for MCP Gateway Registry.
"""

import os
import json
import logging
import requests
from typing import Dict, List, Optional, Any, Tuple
from urllib.parse import urlencode

logger = logging.getLogger(__name__)

class OktaAuth:
    """
    Okta authentication provider for MCP Gateway Registry.
    """
    
    def __init__(self):
        """
        Initialize Okta authentication provider.
        """
        self.okta_org_url = os.environ.get('OKTA_ORG_URL', '').rstrip('/')
        self.client_id = os.environ.get('OKTA_CLIENT_ID', '')
        self.client_secret = os.environ.get('OKTA_CLIENT_SECRET', '')
        self.redirect_uri = os.environ.get('OKTA_REDIRECT_URI', 'http://localhost:7860/callback')
        self.token_endpoint = f"{self.okta_org_url}/oauth2/v1/token"
        self.userinfo_endpoint = f"{self.okta_org_url}/oauth2/v1/userinfo"
        self.authorization_endpoint = f"{self.okta_org_url}/oauth2/v1/authorize"
        
        if not all([self.okta_org_url, self.client_id, self.client_secret]):
            logger.warning("Okta configuration is incomplete. Some features may not work.")
    
    def get_authorization_url(self, state: str) -> str:
        """
        Get the authorization URL for Okta OAuth flow.
        
        Args:
            state: State parameter for OAuth flow
            
        Returns:
            Authorization URL
        """
        params = {
            'client_id': self.client_id,
            'response_type': 'code',
            'scope': 'openid profile email groups',
            'redirect_uri': self.redirect_uri,
            'state': state
        }
        
        return f"{self.authorization_endpoint}?{urlencode(params)}"
    
    def exchange_code_for_tokens(self, code: str) -> Dict[str, Any]:
        """
        Exchange authorization code for tokens.
        
        Args:
            code: Authorization code from Okta
            
        Returns:
            Dictionary containing access_token, id_token, etc.
        """
        payload = {
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': self.redirect_uri,
            'client_id': self.client_id,
            'client_secret': self.client_secret
        }
        
        response = requests.post(self.token_endpoint, data=payload)
        if response.status_code != 200:
            logger.error(f"Failed to exchange code for tokens: {response.text}")
            raise Exception(f"Failed to exchange code for tokens: {response.status_code}")
        
        return response.json()
    
    def get_user_info(self, access_token: str) -> Dict[str, Any]:
        """
        Get user information using access token.
        
        Args:
            access_token: Access token from Okta
            
        Returns:
            User information
        """
        headers = {
            'Authorization': f'Bearer {access_token}'
        }
        
        response = requests.get(self.userinfo_endpoint, headers=headers)
        if response.status_code != 200:
            logger.error(f"Failed to get user info: {response.text}")
            raise Exception(f"Failed to get user info: {response.status_code}")
        
        return response.json()
    
    def get_user_groups(self, access_token: str) -> List[str]:
        """
        Get user groups from Okta.
        
        Args:
            access_token: Access token from Okta
            
        Returns:
            List of group names
        """
        user_info = self.get_user_info(access_token)
        
        # Okta returns groups in the 'groups' claim if requested in scope
        groups = user_info.get('groups', [])
        
        return groups
    
    def validate_token(self, token: str) -> Tuple[bool, Optional[Dict[str, Any]]]:
        """
        Validate access token and return user information.
        
        Args:
            token: Access token from Okta
            
        Returns:
            Tuple of (is_valid, user_info)
        """
        try:
            user_info = self.get_user_info(token)
            return True, user_info
        except Exception as e:
            logger.error(f"Token validation failed: {str(e)}")
            return False, None