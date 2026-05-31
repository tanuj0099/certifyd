import os
import time
import re
import random
from supabase import create_client, Client
from playwright.sync_api import sync_playwright, Page
from playwright_stealth import Stealth
import posthog_client

# ─────────────────────────────────────────────────────────────────────────────
# CONFIG — credentials loaded from environment, never hardcoded
# Set SUPABASE_URL and SUPABASE_KEY in your .env file before running.
# ─────────────────────────────────────────────────────────────────────────────
from dotenv import load_dotenv
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise EnvironmentError(
        "Missing SUPABASE_URL or SUPABASE_KEY. "
        "Copy .env.example to .env and fill in your credentials."
    )

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

USD_TO_INR = 83.0

# ─── SLICER ───────────────────────────────────────────────────────────────────
# Change this to control how many certs to scrape.
# 4 = test run | None = full run (all 77)
SCRAPE_SLICE = 4
# ─────────────────────────────────────────────────────────────────────────────

NULL_CERT = {"cost_inr": 0, "source": None}


# ─────────────────────────────────────────────────────────────────────────────
# MASTER MANIFEST — 77 certs across 8 domains
# Fields: name, provider, domain, url, scraper, difficulty, prep_time_months
# ─────────────────────────────────────────────────────────────────────────────
CERT_MANIFEST = [

    # ── CLOUD & DEVOPS (12) ──────────────────────────────────────────────────
    {
        "name": "AWS Certified Cloud Practitioner",
        "provider": "AWS",
        "domain": "Cloud & DevOps",
        "url": "https://aws.amazon.com/certification/certified-cloud-practitioner/",
        "scraper": "aws",
        "difficulty": "Beginner",
        "prep_time_months": 2
    },
    {
        "name": "AWS Certified Solutions Architect - Associate",
        "provider": "AWS",
        "domain": "Cloud & DevOps",
        "url": "https://aws.amazon.com/certification/certified-solutions-architect-associate/",
        "scraper": "aws",
        "difficulty": "Intermediate",
        "prep_time_months": 3
    },
    {
        "name": "AWS Certified Developer - Associate",
        "provider": "AWS",
        "domain": "Cloud & DevOps",
        "url": "https://aws.amazon.com/certification/certified-developer-associate/",
        "scraper": "aws",
        "difficulty": "Intermediate",
        "prep_time_months": 3
    },
    {
        "name": "AWS Certified DevOps Engineer - Professional",
        "provider": "AWS",
        "domain": "Cloud & DevOps",
        "url": "https://aws.amazon.com/certification/certified-devops-engineer-professional/",
        "scraper": "aws",
        "difficulty": "Advanced",
        "prep_time_months": 5
    },
    {
        "name": "Microsoft Certified: Azure Administrator Associate",
        "provider": "Microsoft",
        "domain": "Cloud & DevOps",
        "url": "https://learn.microsoft.com/en-us/certifications/azure-administrator/",
        "scraper": "microsoft",
        "difficulty": "Intermediate",
        "prep_time_months": 2
    },
    {
        "name": "Microsoft Certified: Azure Solutions Architect Expert",
        "provider": "Microsoft",
        "domain": "Cloud & DevOps",
        "url": "https://learn.microsoft.com/en-us/certifications/azure-solutions-architect/",
        "scraper": "microsoft",
        "difficulty": "Advanced",
        "prep_time_months": 4
    },
    {
        "name": "Google Cloud Professional Cloud Architect",
        "provider": "Google",
        "domain": "Cloud & DevOps",
        "url": "https://cloud.google.com/learn/certification/cloud-architect",
        "scraper": "google_cloud",
        "difficulty": "Advanced",
        "prep_time_months": 4
    },
    {
        "name": "Google Cloud Associate Cloud Engineer",
        "provider": "Google",
        "domain": "Cloud & DevOps",
        "url": "https://cloud.google.com/learn/certification/cloud-engineer",
        "scraper": "google_cloud",
        "difficulty": "Intermediate",
        "prep_time_months": 3
    },
    {
        "name": "Certified Kubernetes Administrator (CKA)",
        "provider": "CNCF",
        "domain": "Cloud & DevOps",
        "url": "https://training.linuxfoundation.org/certification/certified-kubernetes-administrator-cka/",
        "scraper": "linux_foundation",
        "difficulty": "Advanced",
        "prep_time_months": 3
    },
    {
        "name": "HashiCorp Certified: Terraform Associate",
        "provider": "HashiCorp",
        "domain": "Cloud & DevOps",
        "url": "https://developer.hashicorp.com/certifications/infrastructure-automation",
        "scraper": "hashicorp",
        "difficulty": "Intermediate",
        "prep_time_months": 2
    },
    {
        "name": "Red Hat Certified Engineer (RHCE)",
        "provider": "Red Hat",
        "domain": "Cloud & DevOps",
        "url": "https://www.redhat.com/en/services/certification/rhce",
        "scraper": "redhat",
        "difficulty": "Advanced",
        "prep_time_months": 4
    },
    {
        "name": "CompTIA Cloud+",
        "provider": "CompTIA",
        "domain": "Cloud & DevOps",
        "url": "https://www.comptia.org/certifications/cloud",
        "scraper": "comptia",
        "difficulty": "Intermediate",
        "prep_time_months": 3
    },

    # ── DATA & AI (10) ───────────────────────────────────────────────────────
    {
        "name": "Google Data Analytics Professional Certificate",
        "provider": "Google / Coursera",
        "domain": "Data & AI",
        "url": "https://www.coursera.org/professional-certificates/google-data-analytics",
        "scraper": "coursera",
        "difficulty": "Beginner",
        "prep_time_months": 6
    },
    {
        "name": "IBM Data Science Professional Certificate",
        "provider": "IBM / Coursera",
        "domain": "Data & AI",
        "url": "https://www.coursera.org/professional-certificates/ibm-data-science",
        "scraper": "coursera",
        "difficulty": "Beginner",
        "prep_time_months": 5
    },
    {
        "name": "Microsoft Azure Data Scientist Associate",
        "provider": "Microsoft",
        "domain": "Data & AI",
        "url": "https://learn.microsoft.com/en-us/certifications/azure-data-scientist/",
        "scraper": "microsoft",
        "difficulty": "Intermediate",
        "prep_time_months": 3
    },
    {
        "name": "AWS Certified Machine Learning - Specialty",
        "provider": "AWS",
        "domain": "Data & AI",
        "url": "https://aws.amazon.com/certification/certified-machine-learning-specialty/",
        "scraper": "aws",
        "difficulty": "Advanced",
        "prep_time_months": 4
    },
    {
        "name": "TensorFlow Developer Certificate",
        "provider": "Google",
        "domain": "Data & AI",
        "url": "https://www.tensorflow.org/certificate",
        "scraper": "tensorflow",
        "difficulty": "Intermediate",
        "prep_time_months": 3
    },
    {
        "name": "Tableau Desktop Specialist",
        "provider": "Tableau",
        "domain": "Data & AI",
        "url": "https://www.salesforce.com/blog/tableau-desktop-specialist-certification/",
        "scraper": "tableau",
        "difficulty": "Beginner",
        "prep_time_months": 2
    },
    {
        "name": "Microsoft Power BI Data Analyst Associate",
        "provider": "Microsoft",
        "domain": "Data & AI",
        "url": "https://learn.microsoft.com/en-us/certifications/power-bi-data-analyst-associate/",
        "scraper": "microsoft",
        "difficulty": "Intermediate",
        "prep_time_months": 2
    },
    {
        "name": "Data Science & Machine Learning Bootcamp",
        "provider": "Udemy",
        "domain": "Data & AI",
        "url": "https://www.udemy.com/course/python-for-data-science-and-machine-learning-bootcamp/",
        "scraper": "udemy",
        "difficulty": "Beginner",
        "prep_time_months": 3
    },
    {
        "name": "Databricks Certified Associate Developer",
        "provider": "Databricks",
        "domain": "Data & AI",
        "url": "https://www.databricks.com/learn/certification/apache-spark-developer-associate",
        "scraper": "databricks",
        "difficulty": "Intermediate",
        "prep_time_months": 2
    },
    {
        "name": "SAS Certified Data Scientist",
        "provider": "SAS",
        "domain": "Data & AI",
        "url": "https://www.sas.com/en_us/certification/credentials/advanced-analytics/data-scientist.html",
        "scraper": "sas",
        "difficulty": "Advanced",
        "prep_time_months": 5
    },

    # ── SECURITY (10) ────────────────────────────────────────────────────────
    {
        "name": "CompTIA Security+",
        "provider": "CompTIA",
        "domain": "Security",
        "url": "https://www.comptia.org/certifications/security",
        "scraper": "comptia",
        "difficulty": "Beginner",
        "prep_time_months": 2
    },
    {
        "name": "CompTIA CySA+",
        "provider": "CompTIA",
        "domain": "Security",
        "url": "https://www.comptia.org/certifications/cybersecurity-analyst",
        "scraper": "comptia",
        "difficulty": "Intermediate",
        "prep_time_months": 3
    },
    {
        "name": "CompTIA PenTest+",
        "provider": "CompTIA",
        "domain": "Security",
        "url": "https://www.comptia.org/certifications/pentest",
        "scraper": "comptia",
        "difficulty": "Intermediate",
        "prep_time_months": 3
    },
    {
        "name": "Certified Information Systems Security Professional (CISSP)",
        "provider": "ISC2",
        "domain": "Security",
        "url": "https://www.isc2.org/certifications/cissp",
        "scraper": "isc2",
        "difficulty": "Advanced",
        "prep_time_months": 6
    },
    {
        "name": "Certified Cloud Security Professional (CCSP)",
        "provider": "ISC2",
        "domain": "Security",
        "url": "https://www.isc2.org/certifications/ccsp",
        "scraper": "isc2",
        "difficulty": "Advanced",
        "prep_time_months": 4
    },
    {
        "name": "Certified Information Security Manager (CISM)",
        "provider": "ISACA",
        "domain": "Security",
        "url": "https://www.isaca.org/credentialing/cism",
        "scraper": "isaca",
        "difficulty": "Advanced",
        "prep_time_months": 5
    },
    {
        "name": "Certified Ethical Hacker (CEH)",
        "provider": "EC-Council",
        "domain": "Security",
        "url": "https://www.eccouncil.org/programs/certified-ethical-hacker-ceh/",
        "scraper": "eccouncil",
        "difficulty": "Intermediate",
        "prep_time_months": 3
    },
    {
        "name": "AWS Certified Security - Specialty",
        "provider": "AWS",
        "domain": "Security",
        "url": "https://aws.amazon.com/certification/certified-security-specialty/",
        "scraper": "aws",
        "difficulty": "Advanced",
        "prep_time_months": 4
    },
    {
        "name": "Microsoft Security Operations Analyst",
        "provider": "Microsoft",
        "domain": "Security",
        "url": "https://learn.microsoft.com/en-us/certifications/security-operations-analyst/",
        "scraper": "microsoft",
        "difficulty": "Intermediate",
        "prep_time_months": 3
    },
    {
        "name": "Ethical Hacking Masterclass",
        "provider": "Udemy",
        "domain": "Security",
        "url": "https://www.udemy.com/course/learn-ethical-hacking-from-scratch/",
        "scraper": "udemy",
        "difficulty": "Beginner",
        "prep_time_months": 2
    },

    # ── ENGINEERING (10) ─────────────────────────────────────────────────────
    {
        "name": "Oracle Certified Professional: Java SE 17",
        "provider": "Oracle",
        "domain": "Engineering",
        "url": "https://education.oracle.com/java-se-17-developer/pexam_1Z0-829",
        "scraper": "oracle",
        "difficulty": "Intermediate",
        "prep_time_months": 3
    },
    {
        "name": "Cisco Certified Network Associate (CCNA)",
        "provider": "Cisco",
        "domain": "Engineering",
        "url": "https://www.cisco.com/c/en/us/training-events/training-certifications/certifications/associate/ccna.html",
        "scraper": "cisco",
        "difficulty": "Intermediate",
        "prep_time_months": 3
    },
    {
        "name": "CompTIA Network+",
        "provider": "CompTIA",
        "domain": "Engineering",
        "url": "https://www.comptia.org/certifications/network",
        "scraper": "comptia",
        "difficulty": "Beginner",
        "prep_time_months": 2
    },
    {
        "name": "CompTIA A+",
        "provider": "CompTIA",
        "domain": "Engineering",
        "url": "https://www.comptia.org/certifications/a",
        "scraper": "comptia",
        "difficulty": "Beginner",
        "prep_time_months": 2
    },
    {
        "name": "Microsoft Certified: Azure Developer Associate",
        "provider": "Microsoft",
        "domain": "Engineering",
        "url": "https://learn.microsoft.com/en-us/certifications/azure-developer/",
        "scraper": "microsoft",
        "difficulty": "Intermediate",
        "prep_time_months": 3
    },
    {
        "name": "MongoDB Associate Developer",
        "provider": "MongoDB",
        "domain": "Engineering",
        "url": "https://learn.mongodb.com/pages/mongodb-associate-developer-exam",
        "scraper": "mongodb",
        "difficulty": "Intermediate",
        "prep_time_months": 2
    },
    {
        "name": "Salesforce Platform Developer I",
        "provider": "Salesforce",
        "domain": "Engineering",
        "url": "https://trailhead.salesforce.com/credentials/platformdeveloperi",
        "scraper": "salesforce",
        "difficulty": "Intermediate",
        "prep_time_months": 3
    },
    {
        "name": "The Complete Web Developer Bootcamp",
        "provider": "Udemy",
        "domain": "Engineering",
        "url": "https://www.udemy.com/course/the-complete-web-development-bootcamp/",
        "scraper": "udemy",
        "difficulty": "Beginner",
        "prep_time_months": 4
    },
    {
        "name": "React - The Complete Guide",
        "provider": "Udemy",
        "domain": "Engineering",
        "url": "https://www.udemy.com/course/react-the-complete-guide-incl-redux/",
        "scraper": "udemy",
        "difficulty": "Intermediate",
        "prep_time_months": 2
    },
    {
        "name": "AWS Certified Advanced Networking - Specialty",
        "provider": "AWS",
        "domain": "Engineering",
        "url": "https://aws.amazon.com/certification/certified-advanced-networking-specialty/",
        "scraper": "aws",
        "difficulty": "Advanced",
        "prep_time_months": 4
    },

    # ── PRODUCT & PM (9) ─────────────────────────────────────────────────────
    {
        "name": "Project Management Professional (PMP)",
        "provider": "PMI",
        "domain": "Product & PM",
        "url": "https://www.pmi.org/certifications/project-management-pmp",
        "scraper": "pmi",
        "difficulty": "Advanced",
        "prep_time_months": 4
    },
    {
        "name": "PMI Agile Certified Practitioner (PMI-ACP)",
        "provider": "PMI",
        "domain": "Product & PM",
        "url": "https://www.pmi.org/certifications/agile-acp",
        "scraper": "pmi",
        "difficulty": "Intermediate",
        "prep_time_months": 3
    },
    {
        "name": "Certified Scrum Master (CSM)",
        "provider": "Scrum Alliance",
        "domain": "Product & PM",
        "url": "https://www.scrumalliance.org/get-certified/scrum-master-track/certified-scrummaster",
        "scraper": "scrumalliance",
        "difficulty": "Beginner",
        "prep_time_months": 1
    },
    {
        "name": "SAFe Agilist (SA)",
        "provider": "Scaled Agile",
        "domain": "Product & PM",
        "url": "https://scaledagile.com/training/leading-safe/",
        "scraper": "scaledagile",
        "difficulty": "Intermediate",
        "prep_time_months": 1
    },
    {
        "name": "Google Project Management Certificate",
        "provider": "Google / Coursera",
        "domain": "Product & PM",
        "url": "https://www.coursera.org/professional-certificates/google-project-management",
        "scraper": "coursera",
        "difficulty": "Beginner",
        "prep_time_months": 6
    },
    {
        "name": "IIBA Certified Business Analysis Professional (CBAP)",
        "provider": "IIBA",
        "domain": "Product & PM",
        "url": "https://www.iiba.org/business-analysis-certifications/cbap/",
        "scraper": "iiba",
        "difficulty": "Advanced",
        "prep_time_months": 5
    },
    {
        "name": "PRINCE2 Foundation",
        "provider": "Axelos",
        "domain": "Product & PM",
        "url": "https://www.axelos.com/certifications/propath/prince2-project-management",
        "scraper": "axelos",
        "difficulty": "Beginner",
        "prep_time_months": 2
    },
    {
        "name": "Product Management Fundamentals",
        "provider": "Udemy",
        "domain": "Product & PM",
        "url": "https://www.udemy.com/course/become-a-product-manager-learn-the-skills-get-a-job/",
        "scraper": "udemy",
        "difficulty": "Beginner",
        "prep_time_months": 2
    },
    {
        "name": "IBM Product Manager Professional Certificate",
        "provider": "IBM / Coursera",
        "domain": "Product & PM",
        "url": "https://www.coursera.org/professional-certificates/ibm-product-manager",
        "scraper": "coursera",
        "difficulty": "Beginner",
        "prep_time_months": 4
    },

    # ── DESIGN (8) ───────────────────────────────────────────────────────────
    {
        "name": "Google UX Design Professional Certificate",
        "provider": "Google / Coursera",
        "domain": "Design",
        "url": "https://www.coursera.org/professional-certificates/google-ux-design",
        "scraper": "coursera",
        "difficulty": "Beginner",
        "prep_time_months": 6
    },
    {
        "name": "Adobe Certified Professional - Photoshop",
        "provider": "Adobe",
        "domain": "Design",
        "url": "https://www.adobe.com/products/photoshop/campaign/certification.html",
        "scraper": "adobe",
        "difficulty": "Intermediate",
        "prep_time_months": 2
    },
    {
        "name": "Figma UI/UX Design Essentials",
        "provider": "Udemy",
        "domain": "Design",
        "url": "https://www.udemy.com/course/figma-ux-ui-design-user-experience-tutorial-course/",
        "scraper": "udemy",
        "difficulty": "Beginner",
        "prep_time_months": 1
    },
    {
        "name": "Interaction Design Foundation Membership",
        "provider": "IDF",
        "domain": "Design",
        "url": "https://www.interaction-design.org/membership",
        "scraper": "idf",
        "difficulty": "Beginner",
        "prep_time_months": 3
    },
    {
        "name": "UX Research and Strategy",
        "provider": "Udemy",
        "domain": "Design",
        "url": "https://www.udemy.com/course/ux-design-fundamentals/",
        "scraper": "udemy",
        "difficulty": "Beginner",
        "prep_time_months": 2
    },
    {
        "name": "Adobe XD UI/UX Design",
        "provider": "Udemy",
        "domain": "Design",
        "url": "https://www.udemy.com/course/ui-ux-web-design-using-adobe-xd/",
        "scraper": "udemy",
        "difficulty": "Beginner",
        "prep_time_months": 1
    },
    {
        "name": "Canva Certification",
        "provider": "Canva",
        "domain": "Design",
        "url": "https://www.canva.com/designschool/",
        "scraper": "canva",
        "difficulty": "Beginner",
        "prep_time_months": 1
    },
    {
        "name": "Graphic Design Masterclass",
        "provider": "Udemy",
        "domain": "Design",
        "url": "https://www.udemy.com/course/graphic-design-masterclass-everything-you-need-to-know/",
        "scraper": "udemy",
        "difficulty": "Beginner",
        "prep_time_months": 2
    },

    # ── FINANCE (10) ─────────────────────────────────────────────────────────
    {
        "name": "CFA Level I",
        "provider": "CFA Institute",
        "domain": "Finance",
        "url": "https://www.cfainstitute.org/programs/cfa/exam",
        "scraper": "cfa",
        "difficulty": "Advanced",
        "prep_time_months": 6
    },
    {
        "name": "Financial Risk Manager (FRM) Part I",
        "provider": "GARP",
        "domain": "Finance",
        "url": "https://www.garp.org/frm",
        "scraper": "garp",
        "difficulty": "Advanced",
        "prep_time_months": 4
    },
    {
        "name": "Bloomberg Market Concepts (BMC)",
        "provider": "Bloomberg",
        "domain": "Finance",
        "url": "https://www.bloomberg.com/professional/product/bloomberg-market-concepts/",
        "scraper": "bloomberg",
        "difficulty": "Beginner",
        "prep_time_months": 1
    },
    {
        "name": "NISM Series VIII - Equity Derivatives",
        "provider": "NISM",
        "domain": "Finance",
        "url": "https://www.nism.ac.in/certification-examinations/",
        "scraper": "nism",
        "difficulty": "Intermediate",
        "prep_time_months": 2
    },
    {
        "name": "Financial Modeling & Valuation Analyst (FMVA)",
        "provider": "CFI",
        "domain": "Finance",
        "url": "https://corporatefinanceinstitute.com/certifications/fmva-financial-modeling-valuation-analyst/",
        "scraper": "cfi",
        "difficulty": "Intermediate",
        "prep_time_months": 4
    },
    {
        "name": "Investment Banking Course",
        "provider": "Udemy",
        "domain": "Finance",
        "url": "https://www.udemy.com/course/investment-banking-course/",
        "scraper": "udemy",
        "difficulty": "Intermediate",
        "prep_time_months": 2
    },
    {
        "name": "NCFM Financial Markets Foundation",
        "provider": "NSE India",
        "domain": "Finance",
        "url": "https://www.nseindia.com/education/content/ncfm_modules.htm",
        "scraper": "nse",
        "difficulty": "Beginner",
        "prep_time_months": 1
    },
    {
        "name": "Certified Financial Planner (CFP)",
        "provider": "FPSB India",
        "domain": "Finance",
        "url": "https://www.fpsb.org/about-cfp-certification/",
        "scraper": "fpsb",
        "difficulty": "Advanced",
        "prep_time_months": 6
    },
    {
        "name": "Excel & Financial Modeling Fundamentals",
        "provider": "Udemy",
        "domain": "Finance",
        "url": "https://www.udemy.com/course/the-complete-financial-analyst-course/",
        "scraper": "udemy",
        "difficulty": "Beginner",
        "prep_time_months": 2
    },
    {
        "name": "Chartered Accountancy (CA) Foundation",
        "provider": "ICAI",
        "domain": "Finance",
        "url": "https://www.icai.org/post/ca-foundation-course",
        "scraper": "icai",
        "difficulty": "Intermediate",
        "prep_time_months": 8
    },

    # ── MARKETING & SALES (8) ────────────────────────────────────────────────
    {
        "name": "Google Digital Marketing & E-commerce Certificate",
        "provider": "Google / Coursera",
        "domain": "Marketing & Sales",
        "url": "https://www.coursera.org/professional-certificates/google-digital-marketing-ecommerce",
        "scraper": "coursera",
        "difficulty": "Beginner",
        "prep_time_months": 6
    },
    {
        "name": "HubSpot Marketing Certification",
        "provider": "HubSpot",
        "domain": "Marketing & Sales",
        "url": "https://academy.hubspot.com/courses/digital-marketing",
        "scraper": "hubspot",
        "difficulty": "Beginner",
        "prep_time_months": 1
    },
    {
        "name": "HubSpot Sales Software Certification",
        "provider": "HubSpot",
        "domain": "Marketing & Sales",
        "url": "https://academy.hubspot.com/courses/sales-software",
        "scraper": "hubspot",
        "difficulty": "Beginner",
        "prep_time_months": 1
    },
    {
        "name": "Meta Social Media Marketing Certificate",
        "provider": "Meta / Coursera",
        "domain": "Marketing & Sales",
        "url": "https://www.coursera.org/professional-certificates/facebook-social-media-marketing",
        "scraper": "coursera",
        "difficulty": "Beginner",
        "prep_time_months": 5
    },
    {
        "name": "Salesforce Certified Marketing Cloud Associate",
        "provider": "Salesforce",
        "domain": "Marketing & Sales",
        "url": "https://trailhead.salesforce.com/credentials/marketingcloudassociate",
        "scraper": "salesforce",
        "difficulty": "Beginner",
        "prep_time_months": 2
    },
    {
        "name": "SEMrush SEO Fundamentals Certification",
        "provider": "SEMrush",
        "domain": "Marketing & Sales",
        "url": "https://www.semrush.com/academy/courses/seo-fundamentals-course-with-greg-gifford/",
        "scraper": "semrush",
        "difficulty": "Beginner",
        "prep_time_months": 1
    },
    {
        "name": "HubSpot Content Marketing Certification",
        "provider": "HubSpot",
        "domain": "Marketing & Sales",
        "url": "https://academy.hubspot.com/courses/content-marketing",
        "scraper": "hubspot",
        "difficulty": "Beginner",
        "prep_time_months": 1
    },
    {
        "name": "The Complete Digital Marketing Course",
        "provider": "Udemy",
        "domain": "Marketing & Sales",
        "url": "https://www.udemy.com/course/learn-digital-marketing-course/",
        "scraper": "udemy",
        "difficulty": "Beginner",
        "prep_time_months": 2
    },
]


# ─────────────────────────────────────────────────────────────────────────────
# PRICE HELPERS
# ─────────────────────────────────────────────────────────────────────────────
def _usd_to_inr(usd: float) -> int:
    return int(usd * USD_TO_INR)


def _extract_usd(text: str) -> float:
    """Extract first USD price from body text."""
    m = re.search(r'\$\s*([\d,]+(?:\.\d{1,2})?)', text)
    if m:
        return float(m.group(1).replace(',', ''))
    return 0.0


def _extract_inr(text: str) -> int:
    """Extract INR price from body text."""
    m = re.search(r'₹\s*([\d,]+)', text)
    if m:
        return int(m.group(1).replace(',', ''))
    return 0


# ─────────────────────────────────────────────────────────────────────────────
# PER-SOURCE SCRAPERS
# ─────────────────────────────────────────────────────────────────────────────

def scrape_aws(page: Page, url: str) -> dict:
    try:
        page.goto(url, wait_until="domcontentloaded", timeout=30_000)
        page.wait_for_timeout(3000)
        body = page.locator("body").inner_text()

        # Pattern: "150 USD" or "$150"
        m = re.search(r'\$?\s*(\d+)\s*USD', body, re.I)
        if not m:
            m = re.search(r'\$\s*(\d+)', body)
        if m:
            usd = float(m.group(1))
            inr = _usd_to_inr(usd)
            print(f"    ✅ ${usd} = ₹{inr}")
            return {"cost_inr": inr, "source": "aws"}
    except Exception as e:
        print(f"    ❌ {e}")
    return NULL_CERT.copy()


def scrape_microsoft(page: Page, url: str) -> dict:
    try:
        page.goto(url, wait_until="domcontentloaded", timeout=30_000)
        page.wait_for_timeout(3000)
        body = page.locator("body").inner_text()

        inr = _extract_inr(body)
        if inr:
            print(f"    ✅ ₹{inr}")
            return {"cost_inr": inr, "source": "microsoft"}

        usd = _extract_usd(body)
        if usd:
            inr = _usd_to_inr(usd)
            print(f"    ✅ ${usd} = ₹{inr}")
            return {"cost_inr": inr, "source": "microsoft"}
    except Exception as e:
        print(f"    ❌ {e}")
    return NULL_CERT.copy()


def scrape_comptia(page: Page, url: str) -> dict:
    try:
        page.goto(url, wait_until="domcontentloaded", timeout=30_000)
        page.wait_for_timeout(3000)
        body = page.locator("body").inner_text()

        usd = _extract_usd(body)
        if usd:
            inr = _usd_to_inr(usd)
            print(f"    ✅ ${usd} = ₹{inr}")
            return {"cost_inr": inr, "source": "comptia"}
    except Exception as e:
        print(f"    ❌ {e}")
    return NULL_CERT.copy()


def scrape_coursera(page: Page, url: str) -> dict:
    """Coursera: monthly subscription × 6 months."""
    try:
        page.goto(url, wait_until="domcontentloaded", timeout=30_000)
        page.wait_for_timeout(4000)
        body = page.locator("body").inner_text()

        # INR monthly
        inr = _extract_inr(body)
        if inr:
            total = inr * 6
            print(f"    ✅ ₹{inr}/mo × 6 = ₹{total}")
            return {"cost_inr": total, "source": "coursera"}

        # USD monthly
        usd = _extract_usd(body)
        if usd:
            total = _usd_to_inr(usd * 6)
            print(f"    ✅ ${usd}/mo × 6 = ₹{total}")
            return {"cost_inr": total, "source": "coursera"}
    except Exception as e:
        print(f"    ❌ {e}")
    return NULL_CERT.copy()


def scrape_udemy(page: Page, url: str) -> dict:
    """Udemy: grab INR sale price from course page."""
    try:
        page.goto(url, wait_until="domcontentloaded", timeout=30_000)
        page.wait_for_timeout(4000)
        body = page.locator("body").inner_text()

        # Udemy India shows ₹xxx discounted price
        inr = _extract_inr(body)
        if inr:
            print(f"    ✅ ₹{inr}")
            return {"cost_inr": inr, "source": "udemy"}

        usd = _extract_usd(body)
        if usd:
            inr = _usd_to_inr(usd)
            print(f"    ✅ ${usd} = ₹{inr}")
            return {"cost_inr": inr, "source": "udemy"}
    except Exception as e:
        print(f"    ❌ {e}")
    return NULL_CERT.copy()


def scrape_pmi(page: Page, url: str) -> dict:
    try:
        page.goto(url, wait_until="domcontentloaded", timeout=30_000)
        page.wait_for_timeout(3000)
        body = page.locator("body").inner_text()

        # Take highest USD price found (non-member > member)
        matches = re.findall(r'\$\s*([\d,]+)', body)
        if matches:
            usd = max(float(m.replace(',', '')) for m in matches)
            inr = _usd_to_inr(usd)
            print(f"    ✅ ${usd} = ₹{inr}")
            return {"cost_inr": inr, "source": "pmi"}
    except Exception as e:
        print(f"    ❌ {e}")
    return NULL_CERT.copy()


def scrape_isc2(page: Page, url: str) -> dict:
    try:
        page.goto(url, wait_until="domcontentloaded", timeout=30_000)
        page.wait_for_timeout(3000)
        body = page.locator("body").inner_text()

        usd = _extract_usd(body)
        if usd:
            inr = _usd_to_inr(usd)
            print(f"    ✅ ${usd} = ₹{inr}")
            return {"cost_inr": inr, "source": "isc2"}
    except Exception as e:
        print(f"    ❌ {e}")
    return NULL_CERT.copy()


def scrape_hubspot(page: Page, url: str) -> dict:
    """HubSpot Academy certs are free."""
    try:
        page.goto(url, wait_until="domcontentloaded", timeout=30_000)
        page.wait_for_timeout(2000)
        body = page.locator("body").inner_text().lower()

        if "free" in body:
            print("    ✅ Free course (₹0)")
            return {"cost_inr": 0, "source": "hubspot"}

        inr = _extract_inr(page.locator("body").inner_text())
        if inr:
            return {"cost_inr": inr, "source": "hubspot"}
    except Exception as e:
        print(f"    ❌ {e}")
    return {"cost_inr": 0, "source": "hubspot"}


def scrape_google_cloud(page: Page, url: str) -> dict:
    try:
        page.goto(url, wait_until="domcontentloaded", timeout=30_000)
        page.wait_for_timeout(3000)
        body = page.locator("body").inner_text()

        usd = _extract_usd(body)
        if usd:
            inr = _usd_to_inr(usd)
            print(f"    ✅ ${usd} = ₹{inr}")
            return {"cost_inr": inr, "source": "google_cloud"}
    except Exception as e:
        print(f"    ❌ {e}")
    return NULL_CERT.copy()


def scrape_generic(page: Page, url: str, source_label: str) -> dict:
    """Generic fallback: try INR then USD from any page."""
    try:
        page.goto(url, wait_until="domcontentloaded", timeout=30_000)
        page.wait_for_timeout(3000)
        body = page.locator("body").inner_text()

        inr = _extract_inr(body)
        if inr:
            print(f"    ✅ ₹{inr}")
            return {"cost_inr": inr, "source": source_label}

        usd = _extract_usd(body)
        if usd:
            inr = _usd_to_inr(usd)
            print(f"    ✅ ${usd} = ₹{inr}")
            return {"cost_inr": inr, "source": source_label}
    except Exception as e:
        print(f"    ❌ {e}")
    return NULL_CERT.copy()


# ─────────────────────────────────────────────────────────────────────────────
# DISPATCHER
# ─────────────────────────────────────────────────────────────────────────────
SCRAPER_MAP = {
    "aws":           scrape_aws,
    "microsoft":     scrape_microsoft,
    "comptia":       scrape_comptia,
    "coursera":      scrape_coursera,
    "udemy":         scrape_udemy,
    "pmi":           scrape_pmi,
    "isc2":          scrape_isc2,
    "hubspot":       scrape_hubspot,
    "google_cloud":  scrape_google_cloud,
    # All others fall through to generic
}

def dispatch(page: Page, cert: dict) -> dict:
    scraper_key = cert["scraper"]
    url = cert["url"]
    print(f"  [{cert['scraper'].upper()}] {url}")

    fn = SCRAPER_MAP.get(scraper_key)
    if fn:
        return fn(page, url)
    else:
        # Generic handler for oracle, cisco, cfa, garp, etc.
        return scrape_generic(page, url, scraper_key)


# ─────────────────────────────────────────────────────────────────────────────
# SYNC TO SUPABASE (unchanged from original)
# ─────────────────────────────────────────────────────────────────────────────
def sync_certificates(cert_data: list):
    print("\nStarting Certification Sync to Supabase...")
    for cert in cert_data:
        try:
            supabase.table('certificates').upsert(
                cert,
                on_conflict='cert_name'
            ).execute()
            print(f"  Synced: {cert['cert_name']} (Rs {cert['cost_inr']})")
        except Exception as e:
            print(f"  Failed to sync {cert['cert_name']}: {str(e)}")
    print("Sync complete.")


# ─────────────────────────────────────────────────────────────────────────────
# MAIN ENGINE
# ─────────────────────────────────────────────────────────────────────────────
def run_engine():
    # Apply slicer
    manifest = CERT_MANIFEST[:SCRAPE_SLICE] if SCRAPE_SLICE else CERT_MANIFEST
    total = len(manifest)

    print(f"Scraping {total} certs (SCRAPE_SLICE={SCRAPE_SLICE})")
    print(f"Total in manifest: {len(CERT_MANIFEST)}")

    posthog_client.capture("cert_pipeline", "cert_scrape_run_started", {
        "total_certs": total,
        "scrape_slice": SCRAPE_SLICE,
    })

    with Stealth().use_sync(sync_playwright()) as p:
        browser = p.chromium.launch(
            headless=False,
            args=["--disable-blink-features=AutomationControlled", "--no-sandbox"],
        )
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            viewport={"width": 1920, "height": 1080},
            locale="en-IN",
            timezone_id="Asia/Kolkata",
        )
        context.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
            Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3] });
            Object.defineProperty(navigator, 'languages', { get: () => ['en-IN', 'en-GB', 'en'] });
            window.chrome = { runtime: {}, loadTimes: () => {}, csi: () => {}, app: {} };
        """)

        page = context.new_page()
        results = []
        scraped_data = []

        for i, cert in enumerate(manifest):
            print(f"\n{'='*60}")
            print(f"[{i+1}/{total}] {cert['name']} | {cert['domain']}")
            print(f"{'='*60}")

            pricing = dispatch(page, cert)

            row = {
                "cert_name":        cert["name"],
                "provider":         cert["provider"],
                "domain_name":      cert["domain"],
                "cost_inr":         pricing["cost_inr"],
                "difficulty_level": cert["difficulty"],
                "prep_time_months": cert["prep_time_months"],
            }
            scraped_data.append(row)

            results.append({
                "cert":   cert["name"],
                "domain": cert["domain"],
                "cost":   pricing["cost_inr"],
                "source": pricing.get("source", "none"),
            })

            print(f"  Result: ₹{pricing['cost_inr']:,} | source: {pricing.get('source')}")

            posthog_client.capture("cert_pipeline", "cert_scraped", {
                "cert_name": cert["name"],
                "provider": cert["provider"],
                "domain": cert["domain"],
                "cost_inr": pricing["cost_inr"],
                "source": pricing.get("source"),
                "success": pricing["cost_inr"] > 0,
            })

            if i < total - 1:
                delay = random.uniform(3, 6)
                print(f"  [Delay] {delay:.1f}s")
                time.sleep(delay)

        browser.close()

    # Push to Supabase
    sync_certificates(scraped_data)

    # Summary
    print(f"\n{'='*60}")
    print("SUMMARY")
    print(f"{'='*60}")
    hits = sum(1 for r in results if r["cost"] > 0)
    print(f"  Success rate: {hits}/{total}")
    for r in results:
        flag = "✅" if r["cost"] > 0 else "❌"
        print(f"  {flag} [{r['domain']:<20}] {r['cert']:<55} ₹{r['cost']:,}")
    print(f"{'='*60}\nDONE")

    posthog_client.capture("cert_pipeline", "cert_scrape_run_completed", {
        "total_certs": total,
        "success_count": hits,
        "failure_count": total - hits,
    })
    posthog_client.shutdown()


if __name__ == "__main__":
    run_engine()