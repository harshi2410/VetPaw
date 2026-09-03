import json
import os
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


class PetAdviceLLM:
    """Small OpenAI-compatible client used only after local safety triage."""

    def __init__(self):
        self.api_key = os.environ.get("OPENAI_API_KEY", "").strip()
        self.endpoint = os.environ.get(
            "OPENAI_API_URL", "https://api.openai.com/v1/chat/completions"
        )
        self.model = os.environ.get("OPENAI_MODEL", "gpt-4o-mini")
        self.timeout = float(os.environ.get("OPENAI_TIMEOUT", "12"))

    @property
    def enabled(self):
        return bool(self.api_key)

    def answer(self, user_message, pet_context, symptoms, severity):
        if not self.enabled:
            return None

        system_message = (
            "You are VETPAW, a careful pet-care assistant for dogs, cats, fish, and other pets. "
            "Give practical, calm, plain-language educational guidance. Never claim a diagnosis. "
            "Use the provided triage result; do not upgrade a localized minor injury to an emergency "
            "unless there are clear red flags. Ask at most two important follow-up questions when "
            "information is missing. For medication, poisoning, breathing problems, collapse, severe "
            "pain, uncontrolled bleeding, or rapidly worsening symptoms, recommend a veterinarian "
            "or emergency clinic. Do not recommend human medicines. Mention that a veterinarian is "
            "needed when the situation cannot be safely assessed remotely."
        )
        context = {
            "pet": pet_context or "No pet profile provided",
            "detected_symptoms": symptoms,
            "local_triage": severity,
            "user_message": user_message,
        }
        payload = {
            "model": self.model,
            "temperature": 0.2,
            "max_tokens": 450,
            "messages": [
                {"role": "system", "content": system_message},
                {"role": "user", "content": json.dumps(context)},
            ],
        }
        request = Request(
            self.endpoint,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        try:
            with urlopen(request, timeout=self.timeout) as response:
                result = json.loads(response.read().decode("utf-8"))
            content = result["choices"][0]["message"]["content"].strip()
            return content or None
        except (HTTPError, URLError, TimeoutError, KeyError, IndexError, ValueError, OSError):
            return None
