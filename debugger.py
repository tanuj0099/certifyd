import os
import sys
from google import genai
from google.genai import types

def generate_debug_session():
    # Verify environment variable presence before executing network calls
    api_key = os.environ.get("GOOGLE_CLOUD_API_KEY")
    if not api_key:
        print("ERROR: GOOGLE_CLOUD_API_KEY environment variable is not set.")
        print("Run: $env:GOOGLE_CLOUD_API_KEY=\"your_key\"")
        sys.exit(1)

    # Initialize the native Google Gen AI Client pointing to Vertex infrastructure
    client = genai.Client(
        vertexai=True,
        api_key=api_key,
    )

    print("\n--- GEMINI 3.1 PRO DEBUG ENGINE ONLINE ---")
    print("Paste your code error/context below. Press Ctrl+Z (then Enter) on Windows to execute:\n")
    
    # Read multi-line input from the terminal context cleanly
    user_prompt = sys.stdin.read()
    if not user_prompt.strip():
        print("No prompt provided. Exiting.")
        return

    model = "gemini-3.1-pro-preview"
    
    contents = [
        types.Content(
            role="user",
            parts=[types.Part.from_text(text=user_prompt)]
        )
    ]
    
    tools = [
        types.Tool(google_search=types.GoogleSearch()),
    ]

    generate_content_config = types.GenerateContentConfig(
        temperature=0.2, # Lowered for strict, precise code compilation logic
        top_p=0.95,
        max_output_tokens=65535,
        safety_settings=[
            types.SafetySetting(category="HARM_CATEGORY_HATE_SPEECH", threshold="OFF"),
            types.SafetySetting(category="HARM_CATEGORY_DANGEROUS_CONTENT", threshold="OFF"),
            types.SafetySetting(category="HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold="OFF"),
            types.SafetySetting(category="HARM_CATEGORY_HARASSMENT", threshold="OFF")
        ],
        tools=tools,
        thinking_config=types.ThinkingConfig(
            thinking_level="HIGH", # Forces deep analysis before answering code breaks
        ),
    )

    print("\n[THINKING PIPELINE STREAMING BEGINS]\n")

    # Execute the streaming runtime loop
    for chunk in client.models.generate_content_stream(
        model=model,
        contents=contents,
        config=generate_content_config,
    ):
        if not chunk.candidates or not chunk.candidates[0].content or not chunk.candidates[0].content.parts:
            continue
        print(chunk.text, end="")
        sys.stdout.flush()
        
    print("\n\n--- END OF STREAM ---")

if __name__ == "__main__":
    generate_debug_session()