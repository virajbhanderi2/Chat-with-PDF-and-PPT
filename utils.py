"""
Utility functions for the Chat with PDF application.
"""
from typing import Optional, Tuple
from werkzeug.utils import secure_filename

def validate_pdf_file(filename: str, file_size: int, max_size: int) -> Tuple[bool, Optional[str]]:
    """Validate PDF file extension and size before processing."""
    if not filename:
        return False, "No file selected"
    
    if not filename.lower().endswith('.pdf'):
        return False, "File must be a PDF (.pdf extension required)"
    
    if file_size > max_size:
        max_size_mb = max_size / (1024 * 1024)
        return False, f"File size exceeds maximum allowed size of {max_size_mb:.1f}MB"
    
    if file_size == 0:
        return False, "File is empty"
    
    return True, None

def sanitize_filename(filename: str) -> str:
    """Sanitize filename to prevent security issues."""
    return secure_filename(filename)

def validate_question(question: str, max_length: int = 1000) -> Tuple[bool, Optional[str]]:
    """Validate user question length and content."""
    if not question or len(question.strip()) == 0:
        return False, "Question cannot be empty"
        
    question = question.strip()
    
    if len(question) > max_length:
        return False, f"Question exceeds maximum length of {max_length} characters"
    
    # Check for basic malicious content
    dangerous_patterns = ['<script', 'javascript:', 'onerror=', 'onload=']
    if any(pattern in question.lower() for pattern in dangerous_patterns):
        return False, "Question contains potentially unsafe content"
    
    return True, None

def format_error_response(error_message: str, error_code: str = None, status_code: int = 400) -> dict:
    """Format standardized error response."""
    response = {
        "success": False,
        "error": {
            "message": error_message,
            "status_code": status_code
        }
    }
    if error_code:
        response["error"]["code"] = error_code
    return response

def format_success_response(data: dict, message: str = None) -> dict:
    """Format standardized success response."""
    response = {
        "success": True,
        "data": data
    }
    if message:
        response["message"] = message
    return response
