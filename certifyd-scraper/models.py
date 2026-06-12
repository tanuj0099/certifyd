"""
models.py — Pydantic v2 schema definitions for the Certifyd industrial scraping pipeline.

These models serve a dual purpose:
  1. Runtime validation of all structured data entering the persistence layer.
  2. LLM extraction contracts — field docstrings are injected verbatim into the
     Instructor/structured-output prompt so the model knows exactly what to populate.

Design principles:
  - Every field carries an explicit Field(...) with description= so Instructor can
    surface it as a JSON-schema annotation. The LLM sees these descriptions.
  - Defaults are avoided on required fields; Optional is used only when a value is
    genuinely absent in the real world (e.g. some certs have no cost).
  - All monetary amounts are stored as floats with an explicit currency code rather
    than locale-sensitive strings to keep downstream aggregation clean.
"""

from __future__ import annotations

from typing import List

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Sub-models
# ---------------------------------------------------------------------------


class CertificationCost(BaseModel):
    """
    Represents a single pricing line-item for a certification.

    A certification may carry multiple cost entries — for example, an exam fee,
    a separate training course fee, and an annual renewal fee.  Each entry is
    modelled independently so the consumer can filter, sum, or convert currencies
    without parsing free-text strings.
    """

    cost_type: str = Field(
        ...,
        description=(
            "The category or label of this cost entry as it appears on the vendor "
            "website.  Canonical examples: 'exam_fee', 'retake_fee', 'training_bundle', "
            "'annual_renewal', 'voucher_discount'.  Use snake_case, lowercase.  "
            "Do NOT collapse multiple cost types into one record."
        ),
    )
    amount: float = Field(
        ...,
        ge=0.0,
        description=(
            "The numeric monetary value of this cost, stripped of currency symbols "
            "and thousand-separators.  Must be >= 0.  If the page shows a range "
            "(e.g. '$200–$300'), record the lower bound and flag it in cost_type "
            "with a '_min' suffix."
        ),
    )
    currency: str = Field(
        ...,
        min_length=3,
        max_length=3,
        description=(
            "ISO 4217 three-letter currency code in uppercase (e.g. 'USD', 'EUR', "
            "'INR', 'GBP').  Infer from the page locale or explicit currency symbol. "
            "Default to 'USD' only when no currency signal is present."
        ),
    )

    model_config = {"json_schema_extra": {"example": {"cost_type": "exam_fee", "amount": 165.0, "currency": "USD"}}}


class CertificationEligibility(BaseModel):
    """
    Captures a single prerequisite or eligibility requirement for a certification.

    Vendors often list multiple prerequisites (e.g. a required prior cert AND a
    minimum years-of-experience threshold).  Model each distinct requirement as a
    separate CertificationEligibility instance inside the parent list.
    """

    prerequisite_name: str = Field(
        ...,
        description=(
            "Human-readable name of the prerequisite exactly as stated on the page, "
            "or a clean normalisation if the page uses colloquial phrasing.  "
            "Examples: 'Associate-level AWS certification', "
            "'Completion of AZ-900', 'Bachelor degree in Computer Science'. "
            "If the prerequisite is purely experiential (no named cert/degree), "
            "use a short description such as 'Hands-on cloud administration experience'."
        ),
    )
    required_experience_years: int = Field(
        ...,
        ge=0,
        description=(
            "Minimum years of relevant professional experience explicitly required "
            "for this prerequisite.  Set to 0 when experience is recommended but not "
            "mandatory, or when the requirement is purely credential-based with no "
            "stated experience floor."
        ),
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "prerequisite_name": "AWS Certified Solutions Architect – Associate",
                "required_experience_years": 2,
            }
        }
    }


class ExamMetadata(BaseModel):
    """
    Structural and logistical details about the certification exam itself.

    This sub-model focuses on what a candidate experiences on exam day, not on
    cost or eligibility.  Keep it factual and vendor-neutral in terminology.
    """

    exam_code: str = Field(
        ...,
        description=(
            "The vendor's official alphanumeric exam identifier, exactly as listed "
            "on the certification page (e.g. 'AZ-104', 'CLF-C02', 'CKA', 'OSCP'). "
            "Preserve original casing and hyphens.  If no code is published, use "
            "an empty string — do NOT fabricate a code."
        ),
    )
    duration_minutes: int = Field(
        ...,
        gt=0,
        description=(
            "Total allotted exam duration in whole minutes.  Convert hours to minutes "
            "if the page states hours (e.g. '3 hours' → 180).  If a range is given, "
            "use the maximum.  Do not include optional break time."
        ),
    )
    question_format: str = Field(
        ...,
        description=(
            "Comma-separated list of question types used in the exam, lower-cased and "
            "normalised.  Canonical tokens: 'multiple_choice', 'multiple_select', "
            "'drag_and_drop', 'hotspot', 'case_study', 'lab_practical', 'essay'. "
            "Example: 'multiple_choice, case_study'.  If the vendor does not disclose "
            "the format, use 'undisclosed'."
        ),
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "exam_code": "AZ-104",
                "duration_minutes": 120,
                "question_format": "multiple_choice, drag_and_drop, case_study",
            }
        }
    }


# ---------------------------------------------------------------------------
# Master schema
# ---------------------------------------------------------------------------


class ProfessionalCertification(BaseModel):
    """
    Canonical master record for a single professional IT certification.

    This is the top-level schema passed to Instructor for structured extraction.
    Every page crawled by the pipeline should resolve to exactly one instance of
    this model (or raise a validation error that gets routed to the dead-letter queue).

    Extraction contract:
      - Populate ALL required fields.  Use the sub-model docstrings as additional
        context when filling nested structures.
      - If a list field (costs, eligibility_requirements) has genuinely zero items
        on the page, return an empty list — never None.
      - exam_details must always be populated; if partial data is missing, set
        missing sub-fields to their documented defaults (see ExamMetadata).
    """

    certification_name: str = Field(
        ...,
        description=(
            "Full official name of the certification as displayed in the page's <h1> "
            "or primary heading, without marketing slogans or taglines.  "
            "Example: 'Microsoft Certified: Azure Administrator Associate'."
        ),
    )
    provider: str = Field(
        ...,
        description=(
            "Short canonical name of the certifying body.  Use these normalised "
            "values where applicable: 'Microsoft', 'AWS', 'Google Cloud', 'Linux "
            "Foundation', 'Offensive Security', 'CompTIA', 'ISC2', 'PMI', "
            "'Scrum.org', 'LPI'.  For others, use the organisation's trading name."
        ),
    )
    costs: List[CertificationCost] = Field(
        default_factory=list,
        description=(
            "Ordered list of all cost line-items found on the page.  Exam fees come "
            "first, then training/bundle costs, then renewal/maintenance fees.  "
            "Return an empty list if the page shows no pricing information at all."
        ),
    )
    eligibility_requirements: List[CertificationEligibility] = Field(
        default_factory=list,
        description=(
            "All prerequisites and eligibility criteria stated on the page.  Each "
            "distinct requirement is a separate list element.  Return an empty list "
            "if no prerequisites are mentioned."
        ),
    )
    exam_details: ExamMetadata = Field(
        ...,
        description=(
            "Structured exam logistics.  This field is always required.  Populate "
            "each sub-field using data found on the page; fall back to the sub-model "
            "defaults only when the data is genuinely absent from the source."
        ),
    )
    validity_period_months: int = Field(
        ...,
        ge=0,
        description=(
            "How long the certification remains valid before renewal is required, "
            "expressed in whole months.  Convert years to months (e.g. 3 years → 36). "
            "Set to 0 if the certification is explicitly stated as lifetime/permanent. "
            "Set to -1 only if validity information is completely absent from the page."
        ),
    )
    description: str = Field(
        ...,
        description=(
            "A factual 2–4 sentence summary of what the certification validates and "
            "who it is intended for.  Synthesise from the page's overview section — "
            "do not copy marketing copy verbatim.  Write in third-person present tense."
        ),
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "certification_name": "Microsoft Certified: Azure Administrator Associate",
                "provider": "Microsoft",
                "costs": [{"cost_type": "exam_fee", "amount": 165.0, "currency": "USD"}],
                "eligibility_requirements": [
                    {
                        "prerequisite_name": "Hands-on Azure administration experience",
                        "required_experience_years": 1,
                    }
                ],
                "exam_details": {
                    "exam_code": "AZ-104",
                    "duration_minutes": 120,
                    "question_format": "multiple_choice, drag_and_drop, case_study",
                },
                "validity_period_months": 24,
                "description": (
                    "The Azure Administrator Associate certification validates skills in "
                    "implementing, managing, and monitoring Azure environments.  It targets "
                    "IT professionals who administer cloud infrastructure as part of a wider "
                    "enterprise team."
                ),
            }
        }
    }

import re
from pydantic import field_validator

class Certification(BaseModel):
    """
    Validation schema for the output of the scraping pipeline.
    """
    source_url: str
    title: str
    tagline: str
    overview: str
    skills_measured: list[str]
    prerequisites: list[str]
    exam_code: str
    cost_inr: float
    cost_usd: float
    eligibility: str
    level: str
    job_roles: list[str]
    languages: list[str]
    retirement_date: str | None = None
