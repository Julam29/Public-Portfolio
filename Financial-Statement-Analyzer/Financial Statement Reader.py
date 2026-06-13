import os
from groq import Groq
from dotenv import load_dotenv
import pdfplumber
import json

# Load your API key from .env
load_dotenv()

# Set up the Groq client
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

keywords = [
    # Current performance
    "revenue", "net income", "net loss", "earnings per share",
    "operating income", "gross profit", "ebitda",
    "total assets", "total liabilities", "shareholders equity",
    "cash flow", "free cash flow", "capital expenditure",

    # Forward looking / production indicators
    "production", "production guidance", "output",
    "tonnes processed", "ounces produced", "barrels produced",
    "guidance", "forecast", "outlook", "next quarter",
    "reserves", "reserve replacement",
    "order backlog", "pipeline",       # relevant for non-mining too
    "capital projects", "expansion"
]

def extract_relevant_pages(filepath):
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
        "year over year", "profit margin", "return on equity"
    ]
    with pdfplumber.open(filepath) as pdf:
        text = ""
        for page in pdf.pages:
             extracted = page.extract_text()
             if extracted:
                  if any(term in extracted.lower() for term in financial_terms):
                    text += extracted
    return text

def extract_relevant_paragraphs(text, keywords):
    paragraphs = text.split("\n")
    relevant = []

    for p in paragraphs:
        if p.strip() == "":
            continue
        if any(term in p.lower() for term in keywords):
            relevant.append(p)
    return "\n".join(relevant)

def grade_report(text):
    if not text:
        print("Could not extract text - PDF may be a scanned image")
        exit()
    response = client.chat.completions.create(
        model = "meta-llama/llama-4-scout-17b-16e-instruct",
        temperature = 0.1,
        messages=[
            {
                #Assigning the role of the AI assistant as a financial analyst to provide context for the responses.
                "role": "system",
                "content": 
                """You are a financial analyst. Analyze the financial statement and provide a structured grade.

                ### Grading Scale (1-10)
                1-2: Catastrophic — bankruptcy risk, massive losses, dividend suspended, large layoffs
                3-4: Poor — missing expectations significantly, declining revenue, net losses
                5: Below average — barely meeting expectations, weak margins, concerning debt
                6: Average — meeting expectations, stable but unexciting metrics
                7: Good — beating expectations moderately, healthy margins and growth
                8: Strong — beating expectations clearly, strong cash flow, positive outlook
                9: Excellent — significantly exceeding expectations across all metrics
                10: Exceptional — record-breaking results, dominant market position

                ### Hard Cap Rules — Override everything else
                The Overall Grade MUST be 4 or below if ANY of these are true:
                - Revenue declining more than 10% YoY
                - Net loss exceeding 10% of revenue
                - Operating or free cash flow declining more than 10% YoY
                - Missing earnings or production guidance by more than 20%
                - Dividend cut or suspension
                - Layoffs exceeding 10% of workforce
                - Any metric score is 4 or below
                - YoY net income decline exceeding 20%

                ### Special Rules
                - Guidance and Outlook is weighted 2x vs other metrics
                - EPS growth driven by buybacks or tax changes caps EPS score at 6
                - For financial services companies, use transaction margin instead of gross profit margin
                - Always compare metrics to the same quarter last year, not analyst estimates
                - Beating lowered expectations does NOT override poor YoY performance

                ### Response Format
                **Analysis**:
                [Detailed narrative. Discuss key metrics, trends, red flags. Treat declining growth as bearish.]

                **Grading**:
                - Revenue Growth: [score]/10 — [one line reason]
                - Gross Profit Margin: [score]/10 — [one line reason]
                - Cash Flow: [score]/10 — [one line reason]
                - Debt Levels: [score]/10 — [one line reason]
                - Production Growth: [score]/10 or N/A
                - Guidance and Outlook: [score]/10 — [one line reason]
                - EPS Growth: [score]/10 — [one line reason]

                **Overall Grade**: [score]/10
                [1-2 sentences on areas of improvement, or key reasons for low grade if 4 or below]
                """

                # "write 4 newlines before overview for clarity"
            },

            {
                #Assigining context sent to the AI assistant 
                # "role": "user", "content": user_input
                "role": "user", "content": text
            }
        ]
    )

    return (response.choices[0].message.content)

def analyze_report(filepath):
    text = extract_relevant_pages(filepath)
# user_input = input("Enter your financial questions: ")
    if len(text.split()) > 6000:
        print("Super Long Report Detected - Extracting Most Relevant Paragraphs Only")
        print(len(text.split()))
        text = extract_relevant_paragraphs(text, keywords)
    print(len(text.split()))
    result = grade_report(text)
    print(result)


analyze_report("Statements/PayPal Q4 2025.pdf")