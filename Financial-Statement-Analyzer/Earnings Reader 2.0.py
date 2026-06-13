import os
import json
from groq import Groq
from dotenv import load_dotenv
import pdfplumber

# Load your API key from .env
load_dotenv()

# Set up the Groq client
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))



financial_terms = [
    # Income statement terms
    "revenue", "net income", "net loss", "earnings per share",
    "operating income", "gross profit", "ebitda", "sales",

    # Balance sheet terms
    "total assets", "total liabilities", "shareholders equity",
    "cash and cash equivalents", "long term debt", "working capital",

    # Cash flow terms
    "cash flow", "capital expenditure", "free cash flow",
    "operating activities", "investing activities",

    # General financial terms
    "financial highlights", "results of operations",
    "management discussion", "quarterly results",
    "year over year", "profit margin", "return on equity",

    # Forward looking / production indicators
    "production", "production guidance", "output",
    "tonnes processed", "ounces produced", "barrels produced",
    "guidance", "forecast", "outlook", "next quarter",
    "reserves", "reserve replacement",
    "order backlog", "pipeline",
    "capital projects", "expansion",

    "total debt", "long-term debt", "short-term debt", 
    "notes payable", "debt obligations", "borrowings",
    "credit facility", "senior notes"
]

def extract_relevant_pages(filepath):
    with pdfplumber.open(filepath) as pdf:
        text = ""
        for page in pdf.pages:
            extracted = page.extract_text()
            if extracted:
                if any(term in extracted.lower() for term in financial_terms):
                    text += extracted
    return text

def extract_relevant_paragraphs(text, keywords):
    lines = text.split("\n")
    relevant = []

    for line in lines:
        if line.strip() == "":
            continue
        if any(term in line.lower() for term in keywords):
            relevant.append(line)

    return "\n".join(relevant)

def grade_report(text):
    if not text:
        print("Could not extract text - PDF may be a scanned image")
        exit()

    response = client.chat.completions.create(
        model="meta-llama/llama-4-scout-17b-16e-instruct",
        temperature=0.1,
        messages=[
            {
                "role": "system",
                "content": """You are a financial analyst. Analyze the financial statement and return ONLY a valid JSON object.
                No markdown, no backticks, no extra text — just raw JSON.

                ### Grading Scale (1-10)
                1-2: Catastrophic — bankruptcy risk, massive losses, dividend suspended, large layoffs
                3-4: Poor — missing expectations significantly, declining revenue, net losses
                5: Below average — barely meeting expectations, weak margins, concerning debt
                6: Average — meeting expectations, stable but unexciting metrics
                7: Good — beating expectations moderately, healthy margins and growth
                8: Strong — beating expectations clearly, strong cash flow, positive outlook
                9: Excellent — significantly exceeding expectations across all metrics
                10: Exceptional — record-breaking results, dominant market position

                Return this exact JSON structure:
                {
                    "company": "company name here",
                    "period": "e.g. Q4 2025",
                    "analysis": "detailed narrative analysis here",
                    "red_flags": ["flag 1", "flag 2"],
                    "strengths": ["strength 1", "strength 2"],
                    "metrics": {
                        "revenue_growth":       {"score": 0, "note": "reason here"},
                        "gross_profit_margin":  {"score": 0, "note": "reason here"},
                        "cash_flow":            {"score": 0, "note": "reason here"},
                        "debt_levels":          {"score": 0, "note": "reason here"},
                        "production_growth":    {"score": 0, "note": "N/A if not applicable"},
                        "guidance_outlook":     {"score": 0, "note": "reason here"},
                        "eps_growth":           {"score": 0, "note": "reason here"}
                    },
                    "overall_grade": 0.0
                }

                ### Rules for scoring:
                - If your note mentions a decline, concern, or missing data, score cannot exceed 6
                - Missing data = score 5 or below
                - Guidance and Outlook is weighted 2x vs other metrics
                - EPS driven by buybacks or tax changes caps that score at 6
                - For financial services companies, use transaction margin for gross profit margin
                - Revenue growth that MISSED analyst estimates cannot score above 5, even if it's positive growth
                - A score of 7 means you are beating expectations moderately, not just growing — if you are missing estimates, your score cannot be above 5 if the company missed ANY key metric
                - Beating lowered expectations does NOT override poor YoY performance
                - Missing your own guidance is more bearish than missing analyst estimates
                - For EPS Growth, always use:
                    - Non-GAAP diluted EPS for the current quarter vs same quarter last year
                    - Never use full year EPS when analyzing a quarterly report
                    - If both GAAP and non-GAAP are available, use non-GAAP but note the GAAP figure
                - When scoring debt levels, always consider debt relative to 
                    - free cash flow and revenue — not as an absolute number. 
                    - Debt below 2x annual free cash flow should score 7 or above.
                """
                """
                For financial services companies like PayPal, Visa, Mastercard:
                - Use transaction margin or net revenue margin instead of gross profit margin
                - Debt levels MUST be assessed using total debt, credit facilities, 
                or notes payable from the balance sheet — never mark as N/A
                - These numbers always exist in a financial report, look harder"""

                
            },
            {
                "role": "user",
                "content": text
            }
        ]
    )
    return response.choices[0].message.content

def safe_score(val):
    try:
        return float(val)
    except (ValueError, TypeError):
        return 0.0

def enforce_rules(data):
    metrics = data['metrics']
    data['overall_grade'] = safe_score(data['overall_grade'])

    notes = [m['note'].lower() for m in metrics.values()]

    reasons = []

        # Rule — missing data in note caps score at 5
    for key, val in metrics.items():
        note = val['note'].lower()
        score = safe_score(val['score'])
        if any(phrase in note for phrase in ["not provided", "details not provided", 
                                            "not available", "insufficient"]):
            if score > 5:
                metrics[key]['score'] = 5
                reasons.append(f"Capped {key}: missing data cannot score above 5")

    # Rule — EPS driven by non-GAAP or one-time items caps at 5
    eps_note = metrics['eps_growth']['note'].lower()
    if any(phrase in eps_note for phrase in ["non-recurring", "one-time", "buyback", 
                                            "tax", "investment gain"]):
        if safe_score(metrics['eps_growth']['score']) > 5:
            metrics['eps_growth']['score'] = 5
            reasons.append("Capped EPS: driven by non-operational factors")

    # Rule — guidance mentioning declines caps guidance score at 4
    guidance_note = metrics['guidance_outlook']['note'].lower()
    if any(phrase in guidance_note for phrase in ["decline", "lower", "offset", 
                                                "headwind", "decrease"]):
        if safe_score(metrics['guidance_outlook']['score']) > 4:
            metrics['guidance_outlook']['score'] = 4
            reasons.append("Capped guidance: note mentions declines or headwinds")

    scores = [safe_score(m['score']) for m in metrics.values() if safe_score(m['score']) > 0]

    low_metrics = [k for k, v in metrics.items() if 0 < safe_score(v['score']) <= 4]
    if low_metrics:
        data['overall_grade'] = min(data['overall_grade'], 4.0)
        reasons.append(f"Capped: low metric scores in {', '.join(low_metrics)}")

    if scores:
        average = sum(scores) / len(scores)
        if data['overall_grade'] > average + 1:
            data['overall_grade'] = round(average, 1)
            reasons.append(f"Corrected: grade exceeded metric average of {round(average, 1)}")

    data['red_flags'].extend(reasons)
    return data

def display_result(data):
    grade = data['overall_grade']

    if grade >= 8:   emoji = "🟢"
    elif grade >= 6: emoji = "🟡"
    elif grade >= 4: emoji = "🟠"
    else:            emoji = "🔴"

    print(f"\n{'='*55}")
    print(f"  {data['company']} — {data['period']}")
    print(f"  {emoji} OVERALL GRADE: {grade}/10")
    print(f"{'='*55}")

    print(f"\nANALYSIS:\n{data['analysis']}")

    print(f"\nMETRIC BREAKDOWN:")
    for metric, values in data['metrics'].items():
        label = metric.replace('_', ' ').title()
        if values['note'].lower() == 'n/a if not applicable' or values['score'] == 0:
            print(f"  {label:<25} N/A")
        else:
            print(f"  {label:<25} {values['score']}/10 — {values['note']}")

    if data['strengths']:
        print(f"\nSTRENGTHS:")
        for s in data['strengths']:
            print(f"  ✓ {s}")

    if data['red_flags']:
        print(f"\nRED FLAGS:")
        for f in data['red_flags']:
            print(f"  ✗ {f}")

    print(f"\n{'='*55}\n")
    # print("\n\n",data)

def analyze_report(filepath):
    text = extract_relevant_pages(filepath)

    if len(text.split()) > 6000:
        print("Long report detected — extracting relevant sections...")
        text = extract_relevant_paragraphs(text, financial_terms)

    raw = grade_report(text)

    # clean up backticks if model adds them anyway
    clean = raw.strip().replace("```json", "").replace("```", "").strip()

    try:
        data = json.loads(clean)        # convert string to Python dictionary
        data = enforce_rules(data)      # apply your cap rules in Python
        display_result(data)            # print it nicely
        return json.dumps(data)         # return JSON string for compare.py
    except json.JSONDecodeError:
        print("Model did not return valid JSON. Raw output:")
        print(raw)

analyze_report("Statements/Tesla Q1 2026.pdf")