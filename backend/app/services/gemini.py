"""
Google Gemini integration.

Behavior preserved from the original prototype:
  - PDF text extraction via pypdf
  - Streaming responses over Server-Sent Events
  - Bundled demo lease documents

Extended for the SaaS redesign:
  - The analysis prompt now asks Gemini for strict JSON matching a schema
    (risk score, key terms, timeline, financial breakdown, per-clause cards,
    questions, recommendations) instead of free-form Markdown, so the
    frontend can render structured cards. The response is still streamed
    chunk-by-chunk over SSE exactly as before; the frontend buffers the
    chunks and parses the final JSON once the stream completes.
  - A separate chat function answers follow-up questions about a specific
    lease, using the extracted lease text as context.
"""

import io
import json
from collections.abc import AsyncGenerator

from fastapi import HTTPException
from google import genai
from google.genai import types
from pypdf import PdfReader

from app.config import get_settings

settings = get_settings()

client = genai.Client(api_key=settings.gemini_api_key) if settings.gemini_api_key else None

ANALYSIS_SYSTEM_PROMPT = """You are LeaseCheck, an assistant that explains rental lease \
agreements in plain, everyday language for tenants who are not lawyers.

You are NOT providing legal advice. Never tell the user whether a clause is \
legally enforceable in their jurisdiction. Instead, help them understand what \
the document says and what is worth double-checking or asking about.

Read the lease text you are given and respond with ONLY a single valid JSON object \
(no markdown fences, no commentary before or after) matching exactly this shape:

{
  "summary": "3-5 sentence plain-language overview of the lease",
  "riskScore": 0-100 integer, higher means riskier for the tenant,
  "riskLevel": "low" | "medium" | "high",
  "keyTerms": {
    "monthlyRent": "string, e.g. $1,450/month",
    "deposit": "string",
    "leaseStart": "string date",
    "leaseEnd": "string date",
    "noticePeriod": "string",
    "utilities": "string describing who pays what"
  },
  "importantDates": [ { "label": "Lease Start", "date": "string" }, ... ],
  "financial": {
    "monthlyRent": "string",
    "deposit": "string",
    "lateFee": "string",
    "earlyTerminationFee": "string",
    "otherFees": [ { "name": "string", "amount": "string" } ]
  },
  "clauses": [
    {
      "name": "short plain-language clause name",
      "original": "short quote or paraphrase of the original clause",
      "plainEnglish": "1-2 sentence plain-language explanation",
      "riskLevel": "low" | "medium" | "high",
      "suggestion": "1 sentence on what the tenant should consider or ask"
    }
  ],
  "questions": [ "question the tenant might ask the landlord", ... ],
  "recommendations": [ "short actionable recommendation", ... ]
}

Cover these topics across "clauses" where present in the lease: deposit, rent, \
notice period, hidden fees, late payment rules, guest policy, maintenance, \
renewal terms, termination rules, pet rules, subletting, and anything unusual. \
Order clauses roughly by how much they could cost or affect the tenant, most \
important first. Populate every field even if you must write "Not specified in \
the lease" for missing information. Output ONLY the JSON object.
"""

CHAT_SYSTEM_PROMPT = """You are LeaseCheck's AI assistant. You answer a tenant's \
questions about ONE specific lease, using only the lease text provided as context. \
You are not a lawyer and do not give legal advice; you help the tenant understand \
what the document says. If the lease doesn't address something, say so plainly. \
Keep answers concise (2-5 sentences) and in plain, everyday language."""

DEMO_DOCS = {
    "standard": {
        "label": "🏠 Standard Apartment Lease",
        "text": """RESIDENTIAL LEASE AGREEMENT
This Lease is entered into between Sunview Apartments LLC ("Landlord") and the undersigned Tenant.
1. TERM. The lease term begins January 1, 2026 and ends December 31, 2026.
2. RENT. Tenant shall pay $1,450.00 per month, due on the 1st of each month.
3. SECURITY DEPOSIT. Tenant shall pay a security deposit of $1,450.00, refundable within 30 days of move-out, less deductions for damage beyond normal wear and tear.
4. LATE FEES. A late fee of $50 will be charged if rent is not received within 5 days of the due date.
5. UTILITIES. Tenant is responsible for electricity and internet. Landlord covers water and trash.
6. MAINTENANCE. Tenant must report maintenance issues within 48 hours of discovery. Landlord will address non-emergency repairs within 7 business days.
7. TERMINATION. Either party may terminate at the end of the term with 60 days' written notice. Early termination by Tenant requires payment of two months' rent as a termination fee.
8. PETS. No pets allowed without prior written consent of Landlord.
9. GUESTS. Guests may not stay longer than 14 consecutive days without Landlord approval.
""",
    },
    "commercial": {
        "label": "🏢 Commercial Office Lease",
        "text": """COMMERCIAL OFFICE LEASE AGREEMENT
Landlord: Meridian Business Park Inc. Tenant: the undersigned business entity.
1. PREMISES. Suite 300, approximately 2,400 sq ft, for general office use only.
2. TERM. 5 years, commencing March 1, 2026.
3. BASE RENT. $6,200.00 per month, with a 3% annual escalation on each anniversary of the commencement date.
4. TRIPLE NET CHARGES (NNN). Tenant shall pay its pro-rata share of property taxes, building insurance, and common area maintenance, estimated at $1,100/month, subject to annual reconciliation.
5. SECURITY DEPOSIT. Equal to two months' base rent, non-interest-bearing.
6. USE RESTRICTIONS. Premises may not be used for retail sales, food service, or any use requiring additional parking beyond the allocated 8 spaces.
7. ASSIGNMENT/SUBLEASE. Tenant may not assign or sublease without Landlord's prior written consent, which may be withheld at Landlord's sole discretion.
8. DEFAULT. Failure to pay rent within 10 days of due date constitutes default, entitling Landlord to accelerate all remaining rent due under the lease.
9. RENEWAL OPTION. Tenant has one option to renew for an additional 5 years at then-current market rate, exercisable with 180 days' written notice.
""",
    },
    "hidden_fees": {
        "label": "⚠️ Lease with Hidden Fees",
        "text": """RESIDENTIAL LEASE AGREEMENT
Landlord: Crestwood Property Management. Tenant: the undersigned.
1. TERM. 12 months beginning June 1, 2026.
2. RENT. $1,750.00/month.
3. SECURITY DEPOSIT. $1,750.00.
4. ADMINISTRATIVE FEE. A non-refundable administrative fee of $250 is due at signing, separate from the security deposit.
5. AMENITY FEE. A monthly amenity fee of $85 applies regardless of amenity usage, in addition to base rent.
6. AUTO-RENEWAL. This lease automatically renews for successive 12-month terms unless either party provides written notice of non-renewal at least 90 days before the term ends. Failure to provide timely notice obligates Tenant to a full additional 12-month term.
7. EARLY TERMINATION. Tenant may terminate early only by paying liquidated damages equal to 3 months' rent, plus forfeiture of the full security deposit.
8. LATE FEES. $75 late fee plus $15 per additional day rent remains unpaid, with no grace period.
9. CARPET CLEANING FEE. A mandatory professional carpet cleaning fee of $200 will be deducted from the security deposit at move-out regardless of carpet condition.
10. RETURNED PAYMENT FEE. $45 for any returned or failed payment.
""",
    },
    "pet_friendly": {
        "label": "🐶 Pet-Friendly Lease",
        "text": """RESIDENTIAL LEASE AGREEMENT — PET ADDENDUM INCLUDED
Landlord: Willow Creek Rentals. Tenant: the undersigned.
1. TERM. 12 months beginning September 1, 2026.
2. RENT. $1,600.00/month.
3. SECURITY DEPOSIT. $1,600.00.
4. PET DEPOSIT. An additional pet deposit of $500 per pet is required, refundable subject to inspection for pet-related damage.
5. PET RENT. Monthly pet rent of $40 per pet applies in addition to base rent.
6. PET RESTRICTIONS. Maximum of 2 pets. Dogs must be under 50 lbs. Certain breeds are restricted per Landlord's breed policy, available on request.
7. PET RULES. Pets must be leashed in common areas at all times. Tenant is responsible for immediate cleanup of pet waste. Repeated violations may result in a $100 fine per incident and, after 3 violations, revocation of pet privileges.
8. LIABILITY. Tenant is fully liable for any injury or property damage caused by Tenant's pet, including to other tenants.
9. TERMINATION. 60 days' written notice required to terminate at end of term. No early termination penalty specific to pets.
10. NORMAL LEASE TERMS. Standard late fee of $50 after a 3-day grace period. Utilities split as electricity/gas (Tenant) and water/trash (Landlord).
""",
    },
}


def extract_pdf_text(file_bytes: bytes) -> str:
    try:
        reader = PdfReader(io.BytesIO(file_bytes))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Could not read PDF: {exc}")

    if reader.is_encrypted:
        raise HTTPException(status_code=400, detail="This PDF is password-protected. Please upload an unlocked file.")

    pages = [page.extract_text() or "" for page in reader.pages]
    text = "\n\n".join(pages).strip()

    if not text:
        raise HTTPException(
            status_code=400,
            detail="No extractable text found in this PDF. It may be a scanned image — try a text-based PDF.",
        )
    return text


async def stream_analysis(lease_text: str) -> AsyncGenerator[str, None]:
    if client is None:
        yield f"data: {json.dumps({'error': 'Server is missing GEMINI_API_KEY.'})}\n\n"
        return

    lease_text = lease_text[:60000]

    try:
        stream = client.models.generate_content_stream(
            model=settings.gemini_model,
            contents=f"Here is the lease text:\n\n{lease_text}",
            config=types.GenerateContentConfig(
                system_instruction=ANALYSIS_SYSTEM_PROMPT,
                max_output_tokens=4000,
                response_mime_type="application/json",
            ),
        )
        for chunk in stream:
            if chunk.text:
                yield f"data: {json.dumps({'text': chunk.text})}\n\n"
        yield f"data: {json.dumps({'done': True})}\n\n"
    except Exception as exc:
        yield f"data: {json.dumps({'error': str(exc)})}\n\n"


async def stream_chat(lease_text: str, question: str, history: list[dict]) -> AsyncGenerator[str, None]:
    if client is None:
        yield f"data: {json.dumps({'error': 'Server is missing GEMINI_API_KEY.'})}\n\n"
        return

    contents = []
    for turn in history[-10:]:
        role = "model" if turn.get("role") == "assistant" else "user"
        contents.append(types.Content(role=role, parts=[types.Part(text=turn.get("content", ""))]))

    context_prefix = f"Lease text:\n\n{lease_text[:60000]}\n\nTenant question: "
    contents.append(types.Content(role="user", parts=[types.Part(text=context_prefix + question)]))

    try:
        stream = client.models.generate_content_stream(
            model=settings.gemini_model,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=CHAT_SYSTEM_PROMPT,
                max_output_tokens=800,
            ),
        )
        for chunk in stream:
            if chunk.text:
                yield f"data: {json.dumps({'text': chunk.text})}\n\n"
        yield f"data: {json.dumps({'done': True})}\n\n"
    except Exception as exc:
        yield f"data: {json.dumps({'error': str(exc)})}\n\n"


def parse_analysis_json(full_text: str) -> dict:
    """Best-effort parse of the model's JSON output, tolerating stray fences."""
    text = full_text.strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.lower().startswith("json"):
            text = text[4:]
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        start, end = text.find("{"), text.rfind("}")
        if start != -1 and end != -1:
            return json.loads(text[start : end + 1])
        raise
