import json
import re

def map_llm_response_to_message_analysis(raw_analysis: dict, metadata: dict) -> dict:
    # In a real app, this would map the raw LLM analysis to the MessageAnalysis structure
    # For now, we'll just combine the analysis and metadata.
    print(f"Mapping LLM response: {raw_analysis} with metadata: {metadata}")
    return {**raw_analysis, **metadata}

def clean_llm_response(response_text: str) -> dict:
    """
    Cleans the raw LLM string response by removing markdown code blocks
    and parsing it into a JSON object.
    """
    # Use regex to find the content inside ```json ... ```
    match = re.search(r"```json\n(.*?)\n```", response_text, re.DOTALL)
    if match:
        clean_text = match.group(1)
    else:
        # Fallback if the markdown block is not found
        clean_text = response_text.strip()
    
    return json.loads(clean_text)
