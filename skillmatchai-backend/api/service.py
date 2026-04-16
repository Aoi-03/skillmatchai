import logging
import json
import re
import asyncio
import httpx
from .schemas import Volunteer, Task
from config import settings

logger = logging.getLogger("skillmatch.service")

GEMINI_URL = (
    f"https://generativelanguage.googleapis.com/v1beta/models/"
    f"gemini-2.0-flash:generateContent?key={settings.gemini_api_key}"
)

HF_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2"

GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.1-8b-instant"

SYSTEM_INSTRUCTION = (
    "You are an advanced logistical routing AI. "
    "Analyze the overlapping vectors between volunteer skills and task requirements. "
    "Return ONLY a raw JSON array — no markdown, no explanation, no code fences. "
    "Each element must have exactly these fields: "
    "task_id (string), volunteer_id (string), confidence_score (integer 1-100), "
    "allocation_reasoning (string). "
    "If no suitable volunteer exists for a task, set volunteer_id to 'unassigned' and confidence_score to 0."
)

MAX_RETRIES = 3
BASE_DELAY = 5  # seconds — 5s, 10s, 20s backoff


def _build_prompt(volunteers: list[Volunteer], tasks: list[Task]) -> str:
    vol_lines = "\n".join(
        f"- id={v.id} skills={v.skills} availability={v.availability}"
        for v in volunteers
    )
    task_lines = "\n".join(
        f"- id={t.id} title={t.title} required_skills={t.required_skills} urgency={t.urgency_level}"
        for t in tasks
    )
    return (
        f"VOLUNTEERS ({len(volunteers)}):\n{vol_lines}\n\n"
        f"TASKS ({len(tasks)}):\n{task_lines}\n\n"
        "Produce the optimal one-to-one volunteer-to-task allocation JSON array."
    )


def _sanitize_response(raw: str) -> list[dict]:
    cleaned = re.sub(r"```(?:json)?", "", raw).strip()
    start = cleaned.find("[")
    end = cleaned.rfind("]") + 1
    if start == -1 or end == 0:
        raise ValueError("No JSON array found in AI response")
    return json.loads(cleaned[start:end])


# ── Gemini ────────────────────────────────────────────────────────────────────

async def _call_gemini(prompt: str, task_count: int) -> str | None:
    """Returns raw text from Gemini or None if all retries fail."""
    body = {
        "system_instruction": {"parts": [{"text": SYSTEM_INSTRUCTION}]},
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.2, "maxOutputTokens": 4096},
    }

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            async with httpx.AsyncClient(timeout=40.0) as client:
                logger.info(
                    "Sending request to Gemini API",
                    extra={"task_count": task_count, "attempt": attempt},
                )
                response = await client.post(GEMINI_URL, json=body)

                if response.status_code == 429:
                    wait = BASE_DELAY * (2 ** (attempt - 1))
                    logger.warning(
                        "Gemini rate limit hit, backing off",
                        extra={"attempt": attempt, "wait_seconds": wait},
                    )
                    if attempt < MAX_RETRIES:
                        await asyncio.sleep(wait)
                        continue
                    logger.error("Gemini exhausted all retries on rate limit")
                    return None

                response.raise_for_status()
                data = response.json()
                return data["candidates"][0]["content"]["parts"][0]["text"]

        except httpx.TimeoutException:
            logger.error("Gemini timed out", extra={"attempt": attempt})
            if attempt < MAX_RETRIES:
                await asyncio.sleep(BASE_DELAY * attempt)
                continue
            return None
        except Exception as e:
            logger.error("Gemini request failed", extra={"detail": str(e)})
            return None

    return None


# ── Groq fallback (Llama 3.1 8B) ─────────────────────────────────────────────

async def _call_groq(prompt: str) -> str | None:
    """Returns raw text from Groq (Llama 3.1 8B) or None on failure."""
    if not settings.groq_api_key:
        logger.warning("Groq API key not set, skipping fallback")
        return None

    body = {
        "model": GROQ_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_INSTRUCTION},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.2,
        "max_tokens": 4096,
    }

    headers = {
        "Authorization": f"Bearer {settings.groq_api_key}",
        "Content-Type": "application/json",
    }

    for attempt in range(1, MAX_RETRIES + 1):
        try:
            async with httpx.AsyncClient(timeout=40.0) as client:
                logger.info(
                    "Sending request to Groq (Llama fallback)",
                    extra={"attempt": attempt},
                )
                response = await client.post(GROQ_URL, json=body, headers=headers)

                if response.status_code == 429:
                    wait = BASE_DELAY * (2 ** (attempt - 1))
                    logger.warning("Groq rate limit hit", extra={"wait_seconds": wait})
                    if attempt < MAX_RETRIES:
                        await asyncio.sleep(wait)
                        continue
                    return None

                response.raise_for_status()
                data = response.json()
                return data["choices"][0]["message"]["content"]

        except httpx.TimeoutException:
            logger.error("Groq timed out", extra={"attempt": attempt})
            if attempt < MAX_RETRIES:
                await asyncio.sleep(BASE_DELAY * attempt)
                continue
            return None
        except Exception as e:
            logger.error("Groq request failed", extra={"detail": str(e)})
            return None

    return None


# ── Main entry ────────────────────────────────────────────────────────────────

async def run_allocation(volunteers: list[Volunteer], tasks: list[Task]) -> dict:
    prompt = _build_prompt(volunteers, tasks)

    # Try Gemini first
    raw = await _call_gemini(prompt, len(tasks))

    if raw is None:
        logger.warning("Gemini failed, falling back to Groq Llama")
        raw = await _call_groq(prompt)

    if raw is None:
        return {
            "error": True,
            "message": "Both AI providers failed. Please check your API keys or try again later.",
        }

    try:
        allocations = _sanitize_response(raw)
        logger.info(
            "Allocation parsed successfully",
            extra={"allocation_count": len(allocations)},
        )
        return {"allocations": allocations}
    except (json.JSONDecodeError, ValueError) as e:
        logger.error("Failed to parse AI response", extra={"detail": str(e)})
        return {
            "error": True,
            "message": "AI returned an unreadable response. Please try again.",
        }
