import firebase_admin
from firebase_admin import firestore
from pydantic import ValidationError
from models import Certification

def get_firestore_client():
    """Initialize Firebase Admin and return a Firestore client."""
    if not firebase_admin._apps:
        firebase_admin.initialize_app()
    return firestore.client()

def upload_to_firebase(scraped_data_list: list[dict]):
    """
    Process a list of scraped certification dictionaries.
    Valid records go to 'certifications' collection.
    Invalid records go to 'quarantine_queue' collection.
    """
    db = get_firestore_client()
    
    cert_collection = db.collection('certifications')
    quarantine_collection = db.collection('quarantine_queue')
    
    green_count = 0
    red_count = 0
    
    for raw_data in scraped_data_list:
        try:
            # Attempt strict Pydantic validation
            cert = Certification(**raw_data)
            
            # THE GREEN PIPELINE
            # Push valid data to Firestore. We use the exam_code as the document ID to prevent duplicates.
            doc_ref = cert_collection.document(cert.exam_code)
            doc_ref.set(cert.model_dump())
            green_count += 1
            print(f"[GREEN] Successfully uploaded: {cert.exam_code}")
            
        except ValidationError as e:
            # THE RED PIPELINE
            # Catch validation errors, push raw data + error context to quarantine
            quarantine_payload = {
                "raw_data": raw_data,
                "error_message": str(e),
                "error_details": e.errors()
            }
            # Use .add() to auto-generate a document ID for quarantined items
            quarantine_collection.add(quarantine_payload)
            red_count += 1
            
            failed_id = raw_data.get('exam_code', 'UNKNOWN_CODE')
            print(f"[RED] Quarantined item: {failed_id} | Reason: {len(e.errors())} validation errors")

    print(f"\nUpload complete! Valid: {green_count} | Quarantined: {red_count}")

# Example usage (for testing purposes if run directly)
if __name__ == "__main__":
    # dummy test data
    test_data = [
        {
            "source_url": "https://...",
            "title": "Microsoft Certified: Azure Fundamentals",
            "tagline": "...",
            "overview": "...",
            "skills_measured": ["cloud concepts"],
            "prerequisites": [],
            "exam_code": "AZ-900",
            "cost": "$99 USD",
            "eligibility": "IT pros"
        },
        {
            # Will fail validation due to bad cost and exam code
            "source_url": "https://...",
            "title": "Bad Cert",
            "tagline": "...",
            "overview": "...",
            "skills_measured": [],
            "prerequisites": [],
            "exam_code": "INVALID-12345",
            "cost": "Free",
            "eligibility": "..."
        }
    ]
    # Uncomment to test (requires valid Firebase credentials configured locally)
    # upload_to_firebase(test_data)
