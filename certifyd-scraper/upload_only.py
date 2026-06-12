import os
import glob
import json
import logging
from supabase_uploader import upload_to_supabase

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    logger.info("Reading extracted records from dataset...")
    dataset_dir = os.path.join("storage", "datasets", "default")
    json_files = glob.glob(os.path.join(dataset_dir, "*.json"))
    
    scraped_data_list = []
    for filepath in json_files:
        with open(filepath, "r", encoding="utf-8") as f:
            try:
                data = json.load(f)
                scraped_data_list.append(data)
            except Exception as e:
                logger.error(f"Failed to load {filepath}: {e}")
                
    if scraped_data_list:
        logger.info(f"Loaded {len(scraped_data_list)} records. Initiating Supabase upload...")
        upload_to_supabase(scraped_data_list)
    else:
        logger.info("No records found to upload.")

if __name__ == "__main__":
    main()
